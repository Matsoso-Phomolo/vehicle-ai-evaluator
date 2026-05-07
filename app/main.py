from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import APP_NAME, APP_VERSION, DATA_PATH
from .explanation_service import explanation_service
from .metrics_service import metrics_service
from .model_service import model_service
from .schemas import (
    DatasetSummaryResponse,
    HealthResponse,
    MetricsResponse,
    PredictionRequest,
    PredictionResponse,
)
from .utils import request_to_dict, round_percentages, validate_input_values

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Professional AI-powered vehicle evaluation platform using a Naive Bayes classifier.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = DATA_PATH.parents[1] / "frontend"
if frontend_dir.exists():
    app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
def system_status() -> dict:
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "frontend": "/frontend",
    }


@app.get("/health", response_model=HealthResponse)
def health() -> dict:
    return {
        "status": "healthy",
        "model_loaded": model_service.is_loaded,
        "dataset_loaded": model_service.dataset_loaded,
        "dataset_path": str(DATA_PATH),
        "total_rows": len(model_service.artifacts.dataset),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> dict:
    values = request_to_dict(request)
    validate_input_values(values)

    result = model_service.prediction_result(values)
    explanation = explanation_service.build_explanation(values, result)

    return {
        "prediction": result["prediction"],
        "confidence": round(result["confidence"] * 100, 2),
        "probabilities": round_percentages(result["probabilities"]),
        "explanation": explanation,
    }


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> dict:
    return metrics_service.get_metrics()


@app.get("/dataset/summary", response_model=DatasetSummaryResponse)
def dataset_summary() -> dict:
    return metrics_service.dataset_summary()
