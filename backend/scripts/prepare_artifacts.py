"""Artifact preparation & verification CLI for UP 3-Day Flood Prediction.

Usage:
    # When flood_model.json and model_table.parquet are placed in backend/ml_artifacts/:
    backend/.venv/bin/python backend/scripts/prepare_artifacts.py

This extracts and caches:
- calibrator.joblib (IsotonicRegression fitted on val split)
- typical_discharge.json (median discharge by district, month from train split)
- climatology.json (mean flood onset rate by district, month from train split)
- val_threshold.json (CSI-maximizing probability cut from val split)
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.flood_predictor import UttarPradeshFloodPredictor  # noqa: E402


def main() -> int:
    predictor = UttarPradeshFloodPredictor()
    summary = predictor.status_summary()
    print(f"Artifacts dir: {summary['artifacts_dir']}")
    print(f"Model loaded:  {summary['model_loaded']}")
    print(f"Status:        {summary['status']}")
    print(f"Message:       {summary['message']}")
    if summary["model_loaded"]:
        print(f"CSI threshold: {summary['threshold']:.6f}")
        print(f"Districts:     {len(summary['supported_districts'])}")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
