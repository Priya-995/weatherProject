"""Central Uttar Pradesh 3-Day Flood-Onset Prediction Engine.

Implements the exact pipeline defined in the user's four research notebooks:
- 01_flood_labels_and_district_points: 75 UP districts, canonical aliases, representative coordinates
- 02_weather_and_river_data: 14 study districts (7 central, 7 east), river discharge coordinates,
  Open-Meteo ERA5 precipitation + soil_moisture_0_to_7cm + GloFAS river_discharge
- 03_modelling_table: Exact rolling/EWMA/anomaly feature engineering (11 features in exact order)
- 04_training_and_evaluation: Exact XGBoost booster + IsotonicRegression calibration + CSI threshold

Strict integrity guarantees:
- One central engine returning the exact same prediction for a given (district, forecast_date).
- Never fabricates or hardcodes probabilities.
- Returns explicit status="unavailable" for unsupported districts, outside-monsoon dates (Nov-May),
  missing Open-Meteo features, or missing trained model artifacts.
- Never marks model outputs as official government warnings (is_official=False).
"""

from __future__ import annotations

import json
import os
import threading
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import joblib
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import precision_recall_curve
from xgboost import XGBClassifier

IST = timezone(timedelta(hours=5, minutes=30))

# Exact constants from Notebook 03 & 04
HORIZON = 3
API_DECAY = 0.9
WINDOWS = (1, 3, 7, 14, 30)
SEASON_MONTHS = (6, 10)
FEATURES = [
    "rain_1d",
    "rain_3d",
    "rain_7d",
    "rain_14d",
    "rain_30d",
    "rain_api",
    "soil_moisture",
    "soil_change_7d",
    "discharge",
    "discharge_change_3d",
    "discharge_anomaly",
]

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
FLOOD_URL = "https://flood-api.open-meteo.com/v1/flood"

# Exact district aliases from Notebook 01 Cell 7 (+ common spacing variants)
DISTRICT_ALIASES: dict[str, str] = {
    "allahabad": "prayagraj",
    "raebareli": "rae bareli",
    "raibareilly": "rae bareli",
    "rai bareli": "rae bareli",
    "siddharthnagarnagar": "siddharthnagar",
    "siddharth nagar": "siddharthnagar",
    "balia": "ballia",
    "kanpur": "kanpur nagar",
    "kanpur-dehat": "kanpur dehat",
    "kanpurdehat": "kanpur dehat",
    "kanpurnagar": "kanpur nagar",
    "lakhimpur": "kheri",
    "lakhimpur kheri": "kheri",
    "lakhimpur-kheri": "kheri",
    "bareily": "bareilly",
    "bareilli": "bareilly",
    "baharich": "bahraich",
    "shahajanpur": "shahjahanpur",
    "badaun": "budaun",
    "fatepur": "fatehpur",
    "hrawasti": "shrawasti",
    "shravasti": "shrawasti",
    "maharajganj": "mahrajganj",
    "barabanki": "bara banki",
    "ayodhya": "faizabad",
    "sant ravidas nagar": "bhadohi",
    "jyotiba phule nagar": "amroha",
    "mahamaya nagar": "hathras",
    "kanshiram nagar": "kasganj",
    "gautam budh nagar": "gautam buddha nagar",
}

# Exact 14 study districts & river coordinates from Notebook 02
DEFAULT_STUDY_DISTRICTS: dict[str, dict[str, Any]] = {
    "sitapur": {"group": "central", "lat": 27.5027, "lon": 80.8336, "river_lat": 27.3, "river_lon": 81.4},
    "kanpur dehat": {"group": "central", "lat": 26.4586, "lon": 79.8548, "river_lat": 26.3, "river_lon": 79.5},
    "fatehpur": {"group": "central", "lat": 25.8348, "lon": 80.9155, "river_lat": 25.8, "river_lon": 80.5},
    "kheri": {"group": "central", "lat": 28.1835, "lon": 80.7131, "river_lat": 27.7, "river_lon": 81.2},
    "kanpur nagar": {"group": "central", "lat": 26.4416, "lon": 80.2648, "river_lat": 25.9, "river_lon": 80.2},
    "unnao": {"group": "central", "lat": 26.5673, "lon": 80.6199, "river_lat": 26.1, "river_lon": 80.8},
    "etawah": {"group": "central", "lat": 26.7155, "lon": 79.0917, "river_lat": 26.4, "river_lon": 79.2},
    "gonda": {"group": "east", "lat": 27.1104, "lon": 81.9239, "river_lat": 26.8, "river_lon": 82.0},
    "bara banki": {"group": "east", "lat": 26.9422, "lon": 81.3857, "river_lat": 26.9, "river_lon": 81.7},
    "bahraich": {"group": "east", "lat": 27.7363, "lon": 81.4745, "river_lat": 27.0, "river_lon": 81.5},
    "ballia": {"group": "east", "lat": 25.8746, "lon": 84.1209, "river_lat": 25.7, "river_lon": 84.7},
    "faizabad": {"group": "east", "lat": 26.6385, "lon": 82.0582, "river_lat": 26.7, "river_lon": 82.3},
    "prayagraj": {"group": "east", "lat": 25.2793, "lon": 81.9035, "river_lat": 25.3, "river_lon": 82.0},
    "pratapgarh": {"group": "east", "lat": 25.8767, "lon": 81.8318, "river_lat": 25.5, "river_lon": 81.6},
}

DISCLAIMER_TEXT = (
    "Experimental ML 3-day flood-onset probability (XGBoost + Isotonic Calibration) trained on "
    "2004–2023 June–October data for 14 Uttar Pradesh study districts. "
    "This is NOT an official IMD, CWC, or NDMA government flood warning."
)


def _ist_today() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).date()


def normalize_district_name(raw: str | None) -> str | None:
    if not raw or not raw.strip():
        return None
    cleaned = " ".join(raw.strip().lower().replace("_", " ").split())
    cleaned = cleaned.split(",")[0].strip()
    # Strip parenthetical suffixes like "Kheri (Lakhimpur)"
    if "(" in cleaned:
        cleaned = cleaned.split("(")[0].strip()
    return DISTRICT_ALIASES.get(cleaned, cleaned)


def build_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Exact copy of build_features() from Notebook 03 (03_modelling_table.ipynb Cell 4)."""
    frame = frame.sort_values(["district", "date"]).copy()
    frame["date"] = pd.to_datetime(frame["date"])
    season = frame.groupby([frame["district"], frame["date"].dt.year], sort=False)
    for window in WINDOWS:
        frame[f"rain_{window}d"] = season["precip_mm"].transform(
            lambda s, w=window: s.rolling(w, min_periods=w).sum()
        )
    frame["rain_api"] = season["precip_mm"].transform(
        lambda s: s.ewm(alpha=1 - API_DECAY, adjust=False).mean()
    )
    frame["soil_change_7d"] = season["soil_moisture"].transform(lambda s: s - s.shift(7))
    frame["discharge_change_3d"] = season["discharge"].transform(lambda s: s - s.shift(3))
    return frame


def compute_best_threshold(actual: np.ndarray | pd.Series, predicted: np.ndarray | pd.Series) -> float:
    """Exact copy of best_threshold() from Notebook 04 (04_training_and_evaluation.ipynb Cell 6)."""
    precision, recall, cuts = precision_recall_curve(actual, predicted)
    csi = (precision[:-1] * recall[:-1]) / np.maximum(
        precision[:-1] + recall[:-1] - precision[:-1] * recall[:-1], 1e-9
    )
    return float(cuts[int(np.argmax(csi))])


class UttarPradeshFloodPredictor:
    module_name = "uttar_pradesh_flood_prediction"
    target_region = "Uttar Pradesh"

    def __init__(self, artifacts_dir: Path | None = None, cache_ttl_seconds: int = 900):
        default_dir = Path(__file__).resolve().parents[2] / "ml_artifacts"
        env_dir = os.getenv("FLOOD_ARTIFACTS_DIR", "").strip()
        self.artifacts_dir = artifacts_dir or (Path(env_dir) if env_dir else default_dir)
        self.cache_ttl_seconds = cache_ttl_seconds

        self._lock = threading.Lock()
        self._cache: dict[tuple[str, str], tuple[float, dict[str, Any]]] = {}

        self.study_districts: dict[str, dict[str, Any]] = {}
        self.model: XGBClassifier | None = None
        self.calibrator: IsotonicRegression | None = None
        self.typical_discharge: dict[tuple[str, int], float] = {}
        self.climatology_rates: dict[tuple[str, int], float] = {}
        self.overall_rate: float | None = None
        self.threshold: float | None = None
        self.load_error: str | None = None

        self._load_lookups()
        self._load_model_artifacts()

    def _load_lookups(self) -> None:
        districts = {k: dict(v) for k, v in DEFAULT_STUDY_DISTRICTS.items()}
        study_csv = self.artifacts_dir / "study_districts.csv"
        rivers_csv = self.artifacts_dir / "up_river_points.csv"
        pts_csv = self.artifacts_dir / "up_district_points.csv"

        if study_csv.exists():
            sdf = pd.read_csv(study_csv)
            for row in sdf.itertuples(index=False):
                d = str(row.district).strip().lower()
                if d in districts:
                    if hasattr(row, "group"):
                        districts[d]["group"] = str(row.group).strip().lower()
                    if hasattr(row, "lat") and pd.notna(row.lat):
                        districts[d]["lat"] = float(row.lat)
                    if hasattr(row, "lon") and pd.notna(row.lon):
                        districts[d]["lon"] = float(row.lon)
        elif pts_csv.exists():
            pdf = pd.read_csv(pts_csv)
            for row in pdf.itertuples(index=False):
                d = str(row.district).strip().lower()
                if d in districts:
                    districts[d]["lat"] = float(row.lat)
                    districts[d]["lon"] = float(row.lon)

        if rivers_csv.exists():
            rdf = pd.read_csv(rivers_csv)
            for row in rdf.itertuples(index=False):
                d = str(row.district).strip().lower()
                if d in districts:
                    districts[d]["river_lat"] = float(row.lat)
                    districts[d]["river_lon"] = float(row.lon)

        self.study_districts = districts

    def _derive_from_model_table(self, model: XGBClassifier, table_path: Path) -> None:
        """Exact calibration, CSI threshold, typical discharge, and climatology extraction from Notebook 03 & 04."""
        table = pd.read_parquet(table_path)
        table["date"] = pd.to_datetime(table["date"])
        train = table[table["split"] == "train"]
        val = table[table["split"] == "val"]

        if train.empty or val.empty:
            raise ValueError("model_table.parquet must contain non-empty 'train' and 'val' splits.")

        # 1. Exact typical median river discharge by (district, month) from train (Notebook 03 Cell 10)
        typical_series = (
            train.groupby(["district", train["date"].dt.month])["discharge"].median()
        )
        typical_json = {f"{d}|{int(m)}": float(v) for (d, m), v in typical_series.items()}

        # 2. Exact climatology probabilities from train (Notebook 04 Cell 4)
        overall_rate = float(train["target"].mean())
        clim_series = (
            train.groupby(["district", train["date"].dt.month])["target"].mean()
        )
        clim_json = {
            "overall_rate": overall_rate,
            "by_district_month": {f"{d}|{int(m)}": float(v) for (d, m), v in clim_series.items()},
        }

        # 3. Exact IsotonicRegression calibration fitted on val (Notebook 04 Cell 8)
        raw_val = model.predict_proba(val[FEATURES])[:, 1]
        calibrator = IsotonicRegression(out_of_bounds="clip")
        calibrator.fit(raw_val, val["target"])
        prob_val = calibrator.predict(raw_val)

        # 4. Exact CSI operating threshold on val (Notebook 04 Cell 10)
        cut = compute_best_threshold(val["target"], prob_val)

        # Persist derived inference artifacts in artifacts_dir
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(calibrator, self.artifacts_dir / "calibrator.joblib")
        (self.artifacts_dir / "typical_discharge.json").write_text(
            json.dumps(typical_json, indent=2), encoding="utf-8"
        )
        (self.artifacts_dir / "climatology.json").write_text(
            json.dumps(clim_json, indent=2), encoding="utf-8"
        )
        (self.artifacts_dir / "val_threshold.json").write_text(
            json.dumps({"threshold": cut, "horizon_days": HORIZON}, indent=2), encoding="utf-8"
        )

    def _load_model_artifacts(self) -> None:
        model_path = self.artifacts_dir / "flood_model.json"
        table_path = self.artifacts_dir / "model_table.parquet"
        calibrator_path = self.artifacts_dir / "calibrator.joblib"
        typical_path = self.artifacts_dir / "typical_discharge.json"
        threshold_path = self.artifacts_dir / "val_threshold.json"
        clim_path = self.artifacts_dir / "climatology.json"

        self.model = None
        self.calibrator = None
        self.typical_discharge = {}
        self.climatology_rates = {}
        self.overall_rate = None
        self.threshold = None
        self.load_error = None

        if not model_path.exists():
            self.load_error = (
                "Trained XGBoost artifact 'flood_model.json' is not present in backend/ml_artifacts/."
            )
            return

        try:
            model = XGBClassifier()
            model.load_model(model_path)

            # If derived artifacts are missing but model_table.parquet exists, compute them deterministically
            if (
                not calibrator_path.exists()
                or not typical_path.exists()
                or not threshold_path.exists()
            ):
                if table_path.exists():
                    self._derive_from_model_table(model, table_path)
                else:
                    self.load_error = (
                        "Found 'flood_model.json', but 'model_table.parquet' (or pre-derived "
                        "calibrator.joblib, typical_discharge.json, val_threshold.json) is missing "
                        "in backend/ml_artifacts/."
                    )
                    return

            self.calibrator = joblib.load(calibrator_path)
            raw_typical = json.loads(typical_path.read_text(encoding="utf-8"))
            self.typical_discharge = {
                (k.split("|")[0], int(k.split("|")[1])): float(v)
                for k, v in raw_typical.items()
            }
            thresh_obj = json.loads(threshold_path.read_text(encoding="utf-8"))
            self.threshold = float(thresh_obj["threshold"])

            if clim_path.exists():
                clim_obj = json.loads(clim_path.read_text(encoding="utf-8"))
                self.overall_rate = float(clim_obj.get("overall_rate", 0.0))
                self.climatology_rates = {
                    (k.split("|")[0], int(k.split("|")[1])): float(v)
                    for k, v in clim_obj.get("by_district_month", {}).items()
                }

            self.model = model
            self.load_error = None
        except Exception as exc:
            self.model = None
            self.load_error = f"Failed to load UP flood ML artifacts: {exc}"

    def reload(self) -> None:
        with self._lock:
            self._cache.clear()
            self._load_lookups()
            self._load_model_artifacts()

    def is_loaded(self) -> bool:
        return (
            self.model is not None
            and self.calibrator is not None
            and self.threshold is not None
            and len(self.typical_discharge) > 0
        )

    def supported_district_names(self) -> list[str]:
        return sorted(self.study_districts.keys())

    def status_summary(self) -> dict[str, Any]:
        loaded = self.is_loaded()
        return {
            "module": self.module_name,
            "status": "ready" if loaded else "awaiting_model",
            "region": self.target_region,
            "model_loaded": loaded,
            "algorithm": "XGBClassifier (14-district UP flood onset, 3-day horizon)",
            "calibration": "IsotonicRegression(out_of_bounds='clip')",
            "season_months": "June–October",
            "horizon_days": HORIZON,
            "features": FEATURES,
            "threshold": self.threshold,
            "supported_districts": self.supported_district_names(),
            "artifacts_dir": str(self.artifacts_dir),
            "message": (
                "Uttar Pradesh 3-day XGBoost flood prediction service is active."
                if loaded
                else (
                    self.load_error
                    or "Place flood_model.json and model_table.parquet from Kaggle outputs into backend/ml_artifacts/ to activate live ML predictions."
                )
            ),
        }

    def _model_info(self) -> dict[str, Any]:
        return {
            "algorithm": "XGBoost + Isotonic Calibration",
            "calibration": "IsotonicRegression",
            "season_months": "June–October",
            "horizon_days": HORIZON,
            "trained_districts_count": len(self.study_districts),
            "model_loaded": self.is_loaded(),
        }

    def _unavailable_response(
        self,
        *,
        district_input: str,
        canonical_district: str | None,
        study_group: str | None,
        forecast_date_str: str,
        reason: str,
        message: str,
        coordinates: dict[str, float] | None = None,
    ) -> dict[str, Any]:
        return {
            "module": self.module_name,
            "status": "unavailable",
            "reason": reason,
            "message": message,
            "is_official": False,
            "district_input": district_input,
            "canonical_district": canonical_district,
            "display_district": canonical_district.title() if canonical_district else None,
            "study_group": study_group,
            "forecast_date": forecast_date_str,
            "horizon_days": HORIZON,
            "probability": None,
            "raw_probability": None,
            "climatology_probability": None,
            "threshold": self.threshold,
            "threshold_exceeded": None,
            "risk_level": "unavailable",
            "features": None,
            "coordinates": coordinates,
            "model_info": self._model_info(),
            "supported_districts": self.supported_district_names(),
            "disclaimer": DISCLAIMER_TEXT,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _fetch_district_daily_series(
        self,
        district: str,
        target_date: date,
    ) -> pd.DataFrame:
        """Fetch continuous May-01 (or 60d trailing) through target_date daily weather + river series."""
        meta = self.study_districts[district]
        season_start = date(target_date.year, 5, 1)
        today = _ist_today()

        # Fetch from May 1 of target year to ensure exact rain_30d & EWMA rain_api parity with Notebook 03
        # Cap end_date to min(target_date, today + 3d)
        start_str = season_start.isoformat()
        end_str = target_date.isoformat()

        async with httpx.AsyncClient(timeout=20.0) as client:
            if target_date <= today - timedelta(days=7):
                # Historical date completely covered by Open-Meteo ERA5 archive
                w_resp = await client.get(
                    ARCHIVE_URL,
                    params={
                        "latitude": meta["lat"],
                        "longitude": meta["lon"],
                        "start_date": start_str,
                        "end_date": end_str,
                        "daily": "precipitation_sum",
                        "hourly": "soil_moisture_0_to_7cm",
                        "models": "era5",
                        "timezone": "Asia/Kolkata",
                    },
                )
                w_resp.raise_for_status()
                w_json = w_resp.json()

                f_resp = await client.get(
                    FLOOD_URL,
                    params={
                        "latitude": meta["river_lat"],
                        "longitude": meta["river_lon"],
                        "start_date": start_str,
                        "end_date": end_str,
                        "daily": "river_discharge",
                    },
                )
                f_resp.raise_for_status()
                f_json = f_resp.json()

                soil_df = pd.DataFrame(w_json["hourly"])
                soil_df["date"] = pd.to_datetime(soil_df["time"]).dt.date
                soil_mean = soil_df.groupby("date")["soil_moisture_0_to_7cm"].mean()

                daily = pd.DataFrame(
                    {
                        "date": pd.to_datetime(w_json["daily"]["time"]),
                        "precip_mm": w_json["daily"]["precipitation_sum"],
                    }
                )
                daily["soil_moisture"] = daily["date"].dt.date.map(soil_mean)
                flow = pd.Series(
                    f_json["daily"]["river_discharge"],
                    index=pd.to_datetime(f_json["daily"]["time"]),
                )
                daily["discharge"] = flow.reindex(daily["date"]).values
            else:
                # Near-present / live forecast window: combine ERA5 archive (May 1 .. today-7)
                # + Open-Meteo Forecast past_days=45 + Flood API past_days=45
                archive_end = max(season_start, today - timedelta(days=6))
                fc_past_days = min(92, max(35, (today - season_start).days + 1))

                w_fc_req = client.get(
                    FORECAST_URL,
                    params={
                        "latitude": meta["lat"],
                        "longitude": meta["lon"],
                        "past_days": fc_past_days,
                        "forecast_days": 4,
                        "daily": "precipitation_sum",
                        "hourly": "soil_moisture_0_to_7cm",
                        "timezone": "Asia/Kolkata",
                    },
                )
                f_fc_req = client.get(
                    FLOOD_URL,
                    params={
                        "latitude": meta["river_lat"],
                        "longitude": meta["river_lon"],
                        "past_days": fc_past_days,
                        "forecast_days": 4,
                        "daily": "river_discharge",
                    },
                )

                if archive_end >= season_start and (today - season_start).days > fc_past_days:
                    w_arc_req = client.get(
                        ARCHIVE_URL,
                        params={
                            "latitude": meta["lat"],
                            "longitude": meta["lon"],
                            "start_date": start_str,
                            "end_date": archive_end.isoformat(),
                            "daily": "precipitation_sum",
                            "hourly": "soil_moisture_0_to_7cm",
                            "models": "era5",
                            "timezone": "Asia/Kolkata",
                        },
                    )
                    w_arc_resp, w_fc_resp, f_fc_resp = await _gather_three(
                        w_arc_req, w_fc_req, f_fc_req
                    )
                    w_arc_resp.raise_for_status()
                    w_arc_json = w_arc_resp.json()
                    arc_soil = pd.DataFrame(w_arc_json["hourly"])
                    arc_soil["date"] = pd.to_datetime(arc_soil["time"]).dt.date
                    arc_soil_mean = arc_soil.groupby("date")["soil_moisture_0_to_7cm"].mean()
                    arc_daily = pd.DataFrame(
                        {
                            "date": pd.to_datetime(w_arc_json["daily"]["time"]),
                            "precip_mm": w_arc_json["daily"]["precipitation_sum"],
                        }
                    )
                    arc_daily["soil_moisture"] = arc_daily["date"].dt.date.map(arc_soil_mean)
                else:
                    w_fc_resp, f_fc_resp = await _gather_two(w_fc_req, f_fc_req)
                    arc_daily = pd.DataFrame(columns=["date", "precip_mm", "soil_moisture"])

                w_fc_resp.raise_for_status()
                f_fc_resp.raise_for_status()
                w_fc_json = w_fc_resp.json()
                f_fc_json = f_fc_resp.json()

                fc_soil = pd.DataFrame(w_fc_json["hourly"])
                fc_soil["date"] = pd.to_datetime(fc_soil["time"]).dt.date
                fc_soil_mean = fc_soil.groupby("date")["soil_moisture_0_to_7cm"].mean()

                fc_daily = pd.DataFrame(
                    {
                        "date": pd.to_datetime(w_fc_json["daily"]["time"]),
                        "precip_mm": w_fc_json["daily"]["precipitation_sum"],
                    }
                )
                fc_daily["soil_moisture"] = fc_daily["date"].dt.date.map(fc_soil_mean)

                if not arc_daily.empty:
                    daily = (
                        pd.concat([arc_daily, fc_daily], ignore_index=True)
                        .dropna(subset=["precip_mm", "soil_moisture"])
                        .drop_duplicates(subset=["date"], keep="last")
                        .sort_values("date")
                        .reset_index(drop=True)
                    )
                else:
                    daily = fc_daily.sort_values("date").reset_index(drop=True)

                # Discharge covers season_start..target_date (use Flood API start/end if older than past_days)
                flow_series = pd.Series(
                    f_fc_json["daily"]["river_discharge"],
                    index=pd.to_datetime(f_fc_json["daily"]["time"]),
                )
                if (today - season_start).days > fc_past_days:
                    f_arc_resp = await client.get(
                        FLOOD_URL,
                        params={
                            "latitude": meta["river_lat"],
                            "longitude": meta["river_lon"],
                            "start_date": start_str,
                            "end_date": archive_end.isoformat(),
                            "daily": "river_discharge",
                        },
                    )
                    f_arc_resp.raise_for_status()
                    f_arc_json = f_arc_resp.json()
                    arc_flow = pd.Series(
                        f_arc_json["daily"]["river_discharge"],
                        index=pd.to_datetime(f_arc_json["daily"]["time"]),
                    )
                    flow_series = pd.concat([arc_flow, flow_series])
                    flow_series = flow_series[~flow_series.index.duplicated(keep="last")]

                daily["discharge"] = flow_series.reindex(daily["date"]).values

        daily.insert(0, "district", district)
        daily = daily[daily["date"] <= pd.Timestamp(target_date)].copy()
        return daily

    async def predict_district(
        self,
        district_input: str,
        forecast_date_str: str | None = None,
    ) -> dict[str, Any]:
        target_date = _ist_today()
        if forecast_date_str and forecast_date_str.strip():
            try:
                target_date = date.fromisoformat(forecast_date_str.strip()[:10])
            except ValueError:
                return self._unavailable_response(
                    district_input=district_input,
                    canonical_district=normalize_district_name(district_input),
                    study_group=None,
                    forecast_date_str=forecast_date_str,
                    reason="invalid_date",
                    message="forecast_date must be in YYYY-MM-DD format.",
                )

        date_iso = target_date.isoformat()
        canonical = normalize_district_name(district_input)
        if not canonical or canonical not in self.study_districts:
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=None,
                forecast_date_str=date_iso,
                reason="unsupported_district",
                message=(
                    f"Flood prediction is only available for the 14 trained Uttar Pradesh study districts "
                    f"({', '.join(d.title() for d in self.supported_district_names())}). "
                    f"'{district_input}' is outside the model's geographic scope."
                ),
            )

        meta = self.study_districts[canonical]
        coords = {
            "district_lat": meta["lat"],
            "district_lon": meta["lon"],
            "river_lat": meta["river_lat"],
            "river_lon": meta["river_lon"],
        }

        if not (SEASON_MONTHS[0] <= target_date.month <= SEASON_MONTHS[1]):
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="outside_monsoon_season",
                message=(
                    f"The UP flood-onset XGBoost model only generates predictions during the June–October "
                    f"monsoon season (selected date: {date_iso})."
                ),
                coordinates=coords,
            )

        if not self.is_loaded():
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="model_artifacts_missing",
                message=(
                    self.load_error
                    or "Trained flood model artifacts are not loaded on the FastAPI ML service."
                ),
                coordinates=coords,
            )

        # Central deterministic cache check
        cache_key = (canonical, date_iso)
        now_ts = time.monotonic()
        with self._lock:
            cached = self._cache.get(cache_key)
            if cached and (now_ts - cached[0]) < self.cache_ttl_seconds:
                return dict(cached[1])

        try:
            daily = await self._fetch_district_daily_series(canonical, target_date)
        except Exception as exc:
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="open_meteo_fetch_failed",
                message=f"Unable to retrieve required Open-Meteo rainfall/soil/river data: {exc}",
                coordinates=coords,
            )

        featured = build_features(daily)
        row_df = featured[featured["date"] == pd.Timestamp(target_date)]
        if row_df.empty:
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="missing_input_data",
                message=f"Open-Meteo did not return observations/forecast for {canonical.title()} on {date_iso}.",
                coordinates=coords,
            )

        typical_val = self.typical_discharge.get((canonical, target_date.month))
        if typical_val is None or typical_val <= 0:
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="missing_climatology",
                message=f"No training discharge climatology found for {canonical.title()} in month {target_date.month}.",
                coordinates=coords,
            )

        row_df = row_df.copy()
        row_df["discharge_anomaly"] = row_df["discharge"] / typical_val

        missing_cols = [c for c in FEATURES if pd.isna(row_df[c].iloc[0])]
        if missing_cols:
            return self._unavailable_response(
                district_input=district_input,
                canonical_district=canonical,
                study_group=meta["group"],
                forecast_date_str=date_iso,
                reason="missing_input_data",
                message=(
                    f"Insufficient trailing history or missing Open-Meteo variables for {canonical.title()} "
                    f"on {date_iso}: {', '.join(missing_cols)}."
                ),
                coordinates=coords,
            )

        assert self.model is not None and self.calibrator is not None and self.threshold is not None
        X = row_df[FEATURES].astype(float)
        raw_prob = float(self.model.predict_proba(X)[:, 1][0])
        cal_prob = float(self.calibrator.predict(np.array([raw_prob]))[0])
        threshold_exceeded = bool(cal_prob >= self.threshold)

        clim_prob = self.climatology_rates.get((canonical, target_date.month), self.overall_rate)
        if threshold_exceeded:
            risk_level = "elevated"
        elif clim_prob is not None and cal_prob > clim_prob:
            risk_level = "moderate"
        else:
            risk_level = "low"

        feature_snapshot = {k: round(float(X[k].iloc[0]), 4) for k in FEATURES}

        result = {
            "module": self.module_name,
            "status": "available",
            "reason": None,
            "message": (
                f"Calibrated 3-day flood-onset probability for {canonical.title()} ({date_iso}) "
                f"is {cal_prob * 100:.1f}%."
            ),
            "is_official": False,
            "district_input": district_input,
            "canonical_district": canonical,
            "display_district": canonical.title(),
            "study_group": meta["group"],
            "forecast_date": date_iso,
            "horizon_days": HORIZON,
            "probability": round(cal_prob, 6),
            "raw_probability": round(raw_prob, 6),
            "climatology_probability": round(clim_prob, 6) if clim_prob is not None else None,
            "threshold": round(self.threshold, 6),
            "threshold_exceeded": threshold_exceeded,
            "risk_level": risk_level,
            "features": feature_snapshot,
            "coordinates": coords,
            "model_info": self._model_info(),
            "supported_districts": self.supported_district_names(),
            "disclaimer": DISCLAIMER_TEXT,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        with self._lock:
            self._cache[cache_key] = (now_ts, dict(result))

        return result

    async def predict_regional(self, forecast_date_str: str | None = None) -> dict[str, Any]:
        import asyncio

        date_iso = (forecast_date_str or _ist_today().isoformat())[:10]
        names = self.supported_district_names()
        results = await asyncio.gather(
            *(self.predict_district(d, date_iso) for d in names)
        )
        return {
            "module": self.module_name,
            "forecast_date": date_iso,
            "model_loaded": self.is_loaded(),
            "is_official": False,
            "disclaimer": DISCLAIMER_TEXT,
            "districts": list(results),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


async def _gather_two(a: Any, b: Any) -> tuple[Any, Any]:
    import asyncio

    return await asyncio.gather(a, b)


async def _gather_three(a: Any, b: Any, c: Any) -> tuple[Any, Any, Any]:
    import asyncio

    return await asyncio.gather(a, b, c)


flood_predictor = UttarPradeshFloodPredictor()
