import sys
sys.path.insert(0, 'backend')
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path('d:/Razorpay project')
PROCESSED_DIR = BASE_DIR / 'data' / 'processed'
MODELS_DIR = BASE_DIR / 'models'

print('=== FORECASTER ===')
df = pd.read_csv(PROCESSED_DIR / 'risk_events.csv')
from app.ml.models.forecaster import Forecaster
model = Forecaster()
model.load(str(MODELS_DIR / 'forecaster.pkl'))
print(f'Model loaded, last_scores length: {len(model.last_scores)}')
print(f'Last 10 scores: {model.last_scores[-10:]}')

result = model.predict(current_risk=50.0, horizons=[7, 30, 90])
for k, v in result.items():
    print(f'  {k}: score={v["score"]}, ci={v["ci"]}')