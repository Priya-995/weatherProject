"""Modular Future Flood Prediction Integration Slot.

Reserved for integrating the separately trained Uttar Pradesh flood-prediction
machine learning model and feature-engineering pipeline when provided.
No synthetic or placeholder flood predictions are generated here.
"""

from typing import Protocol


class FloodPredictionInput:
    district: str
    rainfall_mm_24h: float
    rainfall_mm_72h: float
    river_basin: str | None = None


class FloodPredictionProvider(Protocol):
    def is_loaded(self) -> bool: ...
    def status_summary(self) -> dict[str, str]: ...


class PendingUttarPradeshFloodModule:
    module_name = "uttar_pradesh_flood_prediction"
    target_region = "Uttar Pradesh"

    def is_loaded(self) -> bool:
        return False

    def status_summary(self) -> dict[str, str]:
        return {
            "module": self.module_name,
            "status": "awaiting_model",
            "region": self.target_region,
            "message": (
                "Modular UP flood prediction adapter is ready. "
                "Drop the trained artifact (.joblib/.pkl) and feature pipeline here to activate."
            ),
        }


flood_predictor = PendingUttarPradeshFloodModule()
