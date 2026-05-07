from typing import Dict, List

from pydantic import BaseModel, ConfigDict, Field


class PredictionRequest(BaseModel):
    buying: str = Field(..., examples=["low"])
    maint: str = Field(..., examples=["med"])
    doors: str = Field(..., examples=["3"])
    persons: str = Field(..., examples=["2"])
    lug_boot: str = Field(..., examples=["small"])
    safety: str = Field(..., examples=["med"])


class ExplanationResponse(BaseModel):
    main_factors: List[str]
    reason: str
    comparison: str
    naive_bayes_summary: str


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    explanation: ExplanationResponse


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
    dataset_loaded: bool
    dataset_path: str
    total_rows: int


class MetricsResponse(BaseModel):
    accuracy: float
    class_distribution: Dict[str, int]
    train_size: int
    test_size: int
    feature_categories: Dict[str, List[str]]
    feature_value_counts: Dict[str, Dict[str, int]]


class DatasetSummaryResponse(BaseModel):
    total_rows: int
    feature_names: List[str]
    class_counts: Dict[str, int]
    allowed_values: Dict[str, List[str]]
