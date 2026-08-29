"""
Risk Forecaster — StatsForecast (AutoARIMA + AutoETS) for time-series risk prediction.
Trained on data/processed/risk_events.csv (aggregated daily risk scores).
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional

BASE_DIR = Path("d:/Razorpay project")


class Forecaster:
    """Time-series risk score forecaster using StatsForecast."""

    def __init__(self):
        self.model = None
        self.last_scores: list = []

    def train(self, df: pd.DataFrame, model_save_path: Optional[str] = None):
        """Train on daily aggregated risk scores — leakage-free with hold-out eval."""
        from statsforecast import StatsForecast
        from statsforecast.models import AutoARIMA, AutoETS
        from sklearn.metrics import mean_absolute_error

        # Aggregate to daily mean risk scores
        events = df.copy()
        events["timestamp"] = pd.to_datetime(events["timestamp"])
        events["risk_score"] = pd.to_numeric(events["risk_score"], errors="coerce").fillna(50)
        daily = events.groupby(events["timestamp"].dt.date)["risk_score"].mean().reset_index()
        daily.columns = ["ds", "y"]
        daily["ds"] = pd.to_datetime(daily["ds"])
        daily = daily.sort_values("ds").reset_index(drop=True)

        # StatsForecast requires a 'unique_id' column
        daily["unique_id"] = "enterprise_risk"

        # Store last scores for fallback
        self.last_scores = daily["y"].tolist()

        # ── Leakage-free evaluation: time-series split (last 14 days as hold-out) ──
        if len(daily) > 30:
            train_daily = daily.iloc[:-14].copy()
            test_daily = daily.iloc[-14:].copy()
            eval_model = StatsForecast(models=[AutoARIMA(season_length=7), AutoETS(season_length=7)], freq="D", n_jobs=1)
            eval_model.fit(train_daily[["unique_id", "ds", "y"]])
            try:
                pred = eval_model.predict(h=14, level=[80])
                # Extract point forecast
                col = "AutoARIMA" if "AutoARIMA" in pred.columns else pred.select_dtypes(include=[np.number]).columns[0]
                y_pred = pred[col].values[:len(test_daily)]
                y_true = test_daily["y"].values[:len(y_pred)]
                mae = mean_absolute_error(y_true, y_pred)
                print(f"  Forecaster hold-out (14d) MAE: {mae:.2f}  (leakage-free temporal split)")
            except Exception as e:
                print(f"  Forecaster hold-out eval skipped: {e}")

        # Train on full data for production
        self.model = StatsForecast(
            models=[AutoARIMA(season_length=7), AutoETS(season_length=7)],
            freq="D",
            n_jobs=1,
        )
        self.model.fit(daily[["unique_id", "ds", "y"]])
        print(f"  Forecaster trained on {len(daily)} daily observations")

        # Save
        save_path = model_save_path or str(BASE_DIR / "models" / "forecaster.pkl")
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "last_scores": self.last_scores,
            }, f)
        print(f"  Saved to {save_path}")
        return {"n_observations": len(daily)}

    def load(self, path: str):
        with open(path, "rb") as f:
            data = pickle.load(f)
        self.model = data["model"]
        self.last_scores = data.get("last_scores", [])

    def predict(self, current_risk: float, horizons: list = None) -> Dict:
        """Generate forecasts for specified horizons (in days)."""
        if horizons is None:
            horizons = [7, 30, 90]

        if self.model is None:
            return self._fallback_predict(current_risk, horizons)

        max_horizon = max(horizons)
        try:
            forecast_df = self.model.predict(h=max_horizon, level=[80, 95])

            result = {}
            for h in horizons:
                # Get the forecast at the specific horizon day
                row = forecast_df.iloc[min(h - 1, len(forecast_df) - 1)]

                # Extract point forecast (try AutoARIMA first, then AutoETS)
                point = None
                ci_lo = None
                ci_hi = None
                for model_name in ["AutoARIMA", "AutoETS"]:
                    if model_name in row.index:
                        point = float(row[model_name])
                        lo_col = f"{model_name}-lo-80"
                        hi_col = f"{model_name}-hi-80"
                        if lo_col in row.index:
                            ci_lo = float(row[lo_col])
                        if hi_col in row.index:
                            ci_hi = float(row[hi_col])
                        break

                if point is None:
                    # Fallback: use the first numeric column
                    numeric_cols = forecast_df.select_dtypes(include=[np.number]).columns
                    if len(numeric_cols) > 0:
                        point = float(row[numeric_cols[0]])

                if point is None:
                    point = current_risk * (1 + 0.01 * h)

                point = max(0, min(100, point))
                ci_lo = max(0, ci_lo if ci_lo is not None else point * 0.85)
                ci_hi = min(100, ci_hi if ci_hi is not None else point * 1.15)

                result[f"{h}_day"] = {
                    "score": round(point, 2),
                    "ci": [round(ci_lo, 2), round(ci_hi, 2)],
                }

            return result

        except Exception as e:
            print(f"  Forecaster prediction error: {e}")
            return self._fallback_predict(current_risk, horizons)

    def predict_series(self, horizon_days: int = 30) -> Dict:
        """Generate a full time series forecast."""
        if self.model is None:
            return self._fallback_series(horizon_days)

        try:
            forecast_df = self.model.predict(h=horizon_days, level=[80, 95])
            model_col = None
            for col in forecast_df.columns:
                if col in ["AutoARIMA", "AutoETS"]:
                    model_col = col
                    break
            if model_col is None:
                numeric_cols = forecast_df.select_dtypes(include=[np.number]).columns
                model_col = numeric_cols[0] if len(numeric_cols) > 0 else None

            if model_col:
                scores = forecast_df[model_col].clip(0, 100).tolist()
            else:
                scores = [50.0] * horizon_days

            return {
                "forecast_scores": [round(s, 2) for s in scores],
                "days": list(range(1, horizon_days + 1)),
            }
        except Exception:
            return self._fallback_series(horizon_days)

    def _fallback_predict(self, current_risk: float, horizons: list) -> Dict:
        result = {}
        for h in horizons:
            # Simple linear extrapolation with noise
            trend = 0.0
            if len(self.last_scores) > 7:
                recent = self.last_scores[-7:]
                trend = (recent[-1] - recent[0]) / 7

            predicted = current_risk + trend * h
            predicted = max(0, min(100, predicted))
            spread = h * 0.5
            result[f"{h}_day"] = {
                "score": round(predicted, 2),
                "ci": [round(max(0, predicted - spread), 2), round(min(100, predicted + spread), 2)],
            }
        return result

    def _fallback_series(self, horizon_days: int) -> Dict:
        if self.last_scores:
            last = self.last_scores[-1]
        else:
            last = 50.0
        scores = [round(max(0, min(100, last + np.random.normal(0, 2))), 2) for _ in range(horizon_days)]
        return {"forecast_scores": scores, "days": list(range(1, horizon_days + 1))}
