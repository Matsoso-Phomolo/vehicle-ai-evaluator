# Vehicle AI Evaluator

Vehicle AI Evaluator is a professional AI-powered vehicle evaluation platform built around the UCI Car Evaluation dataset. It keeps the original academic Naive Bayes model, but places it inside a maintainable engineering structure with a FastAPI backend, service-layer architecture, explainable output, analytics, tests, and a modern dashboard frontend.

The legacy `car.py` and `car_gui.py` files remain in the parent folder as the original CLI and Tkinter versions.

## System Overview

The platform predicts whether a vehicle is:

- `unacc` - unacceptable
- `acc` - acceptable
- `good` - good
- `vgood` - very good

The prediction uses these categorical inputs:

- `buying`
- `maint`
- `doors`
- `persons`
- `lug_boot`
- `safety`

## Architecture

```text
vehicle-ai-evaluator/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── schemas.py
│   ├── model_service.py
│   ├── explanation_service.py
│   ├── metrics_service.py
│   └── utils.py
├── data/
│   └── car.data
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── reports/
├── tests/
│   └── test_predictions.py
├── requirements.txt
├── README.md
└── run.py
```

## Setup

### Windows

```powershell
cd vehicle-ai-evaluator
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

If `python` points to MSYS2, for example `C:\msys64\mingw64\bin\python.exe`, use the Windows Python launcher instead:

```powershell
py -3.11 -m pip install -r requirements.txt
py -3.11 -m pytest tests -p no:cacheprovider
py -3.11 -m uvicorn app.main:app --reload
```

If `py` is not recognized, install Python 3.11 from python.org and enable the Python Launcher during installation.

You can also use the helper scripts:

```powershell
test_windows.bat
run_windows.bat
```

### Linux

```bash
cd vehicle-ai-evaluator
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## Run The Backend And Frontend

```powershell
cd vehicle-ai-evaluator
uvicorn app.main:app --reload
```

On Windows, if `python` resolves to MSYS2, run:

```powershell
py -3.11 -m uvicorn app.main:app --reload
```

Open the dashboard:

```text
http://127.0.0.1:8000/frontend
```

Open the API documentation:

```text
http://127.0.0.1:8000/docs
```

You can also run:

```powershell
python run.py
```

## API Documentation

### GET /

Returns system status and useful links.

### GET /health

Returns backend health, model status, dataset status, dataset path, and row count.

### POST /predict

Request:

```json
{
  "buying": "low",
  "maint": "med",
  "doors": "3",
  "persons": "2",
  "lug_boot": "small",
  "safety": "med"
}
```

Response:

```json
{
  "prediction": "unacc",
  "confidence": 98.5,
  "probabilities": {
    "unacc": 98.5,
    "acc": 0.3,
    "good": 1.19,
    "vgood": 0.01
  },
  "explanation": {
    "main_factors": ["safety=med", "persons=2", "buying=low"],
    "reason": "The model classified this vehicle as unacceptable because the selected input values are more strongly associated with unacceptable outcomes.",
    "comparison": "The selected class was unacc at 98.50%, while the second highest class was acc at 0.30%.",
    "naive_bayes_summary": "The model calculates P(C|X) for each class and selects the class with the highest probability."
  }
}
```

### GET /metrics

Returns:

- accuracy
- class distribution
- train size
- test size
- feature categories
- feature value counts

### GET /dataset/summary

Returns:

- total rows
- feature names
- class counts
- allowed values

## Dataset Explanation

The project uses `data/car.data`, copied from the UCI Car Evaluation dataset. Each row has six vehicle attributes and one class label:

```text
buying,maint,doors,persons,lug_boot,safety,class
```

Example:

```text
vhigh,vhigh,2,2,small,low,unacc
```

## Naive Bayes Explanation

Naive Bayes is based on Bayes theorem:

```text
P(C|X) = P(X|C) * P(C) / P(X)
```

For classification, the model compares classes using:

```text
P(C|X) proportional to P(C) * P(x1|C) * P(x2|C) * ... * P(xn|C)
```

The important classroom concepts are:

- Prior probability: how common each class is in the training data.
- Conditional probability: how common an input value is within a class.
- Conditional independence: Naive Bayes treats each input feature as independent given the class.
- Normalization: raw class scores are converted into comparable probabilities that sum to 100%.

## How Prediction Works

1. The dataset is loaded once.
2. Categorical features are encoded with `OrdinalEncoder`.
3. The dataset is split into training and test sets.
4. `CategoricalNB` is trained once.
5. The API validates incoming categories.
6. The model calculates probabilities for all four classes.
7. The class with the highest probability is returned.
8. The explanation service summarizes the main factors and compares the top two classes.

## Dashboard Features

- Sidebar navigation
- Dark and light mode toggle
- Prediction form
- Result card
- Animated probability bars
- Explanation panel
- Dataset analytics section
- Model metrics section
- Prediction history stored in browser `localStorage`
- Printable prediction report export

## Screenshots

Add screenshots here after running the dashboard:

```text
reports/dashboard-screenshot.png
reports/prediction-report-screenshot.png
```

## Tests

```powershell
cd vehicle-ai-evaluator
python -m pytest tests -p no:cacheprovider
```

On Windows, if `python` resolves to MSYS2, run:

```powershell
py -3.11 -m pytest tests -p no:cacheprovider
```

The tests verify:

- health endpoint
- valid prediction response
- invalid category handling
- probabilities sum approximately to 100

## Future Improvements

- Add model versioning.
- Persist prediction history in a database.
- Add authentication for hosted deployments.
- Add CI testing with GitHub Actions.
- Add downloadable server-side reports.
- Compare Naive Bayes with decision trees or random forests as optional extensions.
