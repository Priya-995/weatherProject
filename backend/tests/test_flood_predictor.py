"""Automated tests verifying UP 3-day flood prediction parity, calibration, and strict unavailable handling."""

from __future__ import annotations

import asyncio
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from xgboost import XGBClassifier

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.flood_predictor import (  # noqa: E402
    FEATURES,
    UttarPradeshFloodPredictor,
    build_features,
    normalize_district_name,
)
import flood_service  # noqa: E402


def _make_sample_daily(district: str = "gonda", year: int = 2023) -> pd.DataFrame:
    dates = pd.date_range(f"{year}-05-01", f"{year}-08-20", freq="D")
    rng = np.random.default_rng(42)
    return pd.DataFrame(
        {
            "district": district,
            "date": dates,
            "precip_mm": rng.gamma(shape=1.4, scale=5.0, size=len(dates)),
            "soil_moisture": np.clip(0.25 + rng.normal(0, 0.04, size=len(dates)), 0.1, 0.45),
            "discharge": 2000.0 + np.linspace(0, 5000, len(dates)) + rng.normal(0, 150, size=len(dates)),
        }
    )


def test_aliases_and_feature_engineering() -> None:
    assert normalize_district_name("Allahabad") == "prayagraj"
    assert normalize_district_name("Ayodhya") == "faizabad"
    assert normalize_district_name("Barabanki") == "bara banki"
    assert normalize_district_name("Lakhimpur Kheri") == "kheri"
    assert normalize_district_name("Kanpur") == "kanpur nagar"

    df = _make_sample_daily("gonda", 2023)
    full = build_features(df)
    cutoff = pd.Timestamp("2023-08-10")
    truncated = build_features(df[df["date"] <= cutoff])

    r_full = full[full["date"] == cutoff].iloc[0]
    r_trunc = truncated[truncated["date"] == cutoff].iloc[0]
    for col in ["rain_1d", "rain_3d", "rain_7d", "rain_14d", "rain_30d", "rain_api", "soil_change_7d", "discharge_change_3d"]:
        assert np.isclose(r_full[col], r_trunc[col]), f"Leakage/mismatch in {col}"


def test_unavailable_states_without_artifacts() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        predictor = UttarPradeshFloodPredictor(artifacts_dir=Path(tmp))
        assert not predictor.is_loaded()

        # Unsupported district
        res_ahm = asyncio.run(predictor.predict_district("Ahmedabad", "2023-08-10"))
        assert res_ahm["status"] == "unavailable"
        assert res_ahm["reason"] == "unsupported_district"
        assert res_ahm["probability"] is None
        assert res_ahm["is_official"] is False

        # Outside monsoon season
        res_nov = asyncio.run(predictor.predict_district("Gonda", "2023-11-15"))
        assert res_nov["status"] == "unavailable"
        assert res_nov["reason"] == "outside_monsoon_season"
        assert res_nov["probability"] is None

        # Supported district + monsoon date, but model_artifacts_missing
        res_missing = asyncio.run(predictor.predict_district("Gonda", "2023-08-10"))
        assert res_missing["status"] == "unavailable"
        assert res_missing["reason"] == "model_artifacts_missing"
        assert res_missing["probability"] is None


def test_real_xgboost_calibration_and_fastapi_endpoints() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        rng = np.random.default_rng(0)

        # Build a synthetic training/val table strictly matching Notebook 03 schema to verify XGB+Isotonic pipeline
        rows = []
        for split, years in [("train", [2015, 2016]), ("val", [2017])]:
            for yr in years:
                d_df = build_features(_make_sample_daily("gonda", yr))
                d_df = d_df[d_df["date"].dt.month.between(6, 10)].dropna().copy()
                d_df["discharge_anomaly"] = d_df["discharge"] / 4000.0
                d_df["split"] = split
                d_df["target"] = (d_df["rain_7d"] > d_df["rain_7d"].quantile(0.8)).astype("int8")
                rows.append(d_df[["district", "date", "split", "target", *FEATURES]])

        table = pd.concat(rows, ignore_index=True)
        table.to_parquet(tmp_dir / "model_table.parquet", index=False)

        train = table[table["split"] == "train"]
        val = table[table["split"] == "val"]
        xgb = XGBClassifier(
            n_estimators=20,
            max_depth=3,
            learning_rate=0.1,
            eval_metric="aucpr",
            random_state=0,
        )
        xgb.fit(train[FEATURES], train["target"], eval_set=[(val[FEATURES], val["target"])], verbose=False)
        xgb.save_model(tmp_dir / "flood_model.json")

        predictor = UttarPradeshFloodPredictor(artifacts_dir=tmp_dir)
        assert predictor.is_loaded()
        assert predictor.threshold is not None
        assert (tmp_dir / "calibrator.joblib").exists()
        assert (tmp_dir / "typical_discharge.json").exists()
        assert (tmp_dir / "val_threshold.json").exists()

        # Run real Open-Meteo 2023-08-10 prediction for Gonda
        pred = asyncio.run(predictor.predict_district("Gonda", "2023-08-10"))
        assert pred["status"] == "available"
        assert pred["canonical_district"] == "gonda"
        assert 0.0 <= pred["probability"] <= 1.0
        assert pred["is_official"] is False
        assert list(pred["features"].keys()) == FEATURES

        # Verify FastAPI endpoints cleanly return unsupported/status
        client = TestClient(flood_service.app)
        st = client.get("/api/flood/status")
        assert st.status_code == 200
        assert len(st.json()["supported_districts"]) == 14

        unsup = client.get("/api/flood/predict", params={"district": "Lucknow", "forecast_date": "2023-08-10"})
        assert unsup.status_code == 200
        assert unsup.json()["status"] == "unavailable"
        assert unsup.json()["reason"] == "unsupported_district"


if __name__ == "__main__":
    test_aliases_and_feature_engineering()
    test_unavailable_states_without_artifacts()
    test_real_xgboost_calibration_and_fastapi_endpoints()
    print("ALL FLOOD ML TESTS PASSED")
