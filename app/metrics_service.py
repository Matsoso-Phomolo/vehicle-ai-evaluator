from .config import ALLOWED_VALUES, FEATURE_NAMES, TARGET_NAME
from .model_service import model_service


class MetricsService:
    def get_metrics(self) -> dict:
        dataset = model_service.artifacts.dataset
        return {
            "accuracy": round(model_service.artifacts.accuracy * 100, 2),
            "class_distribution": self.class_distribution(),
            "train_size": model_service.artifacts.train_size,
            "test_size": model_service.artifacts.test_size,
            "feature_categories": ALLOWED_VALUES,
            "feature_value_counts": self.feature_value_counts(),
        }

    def dataset_summary(self) -> dict:
        dataset = model_service.artifacts.dataset
        return {
            "total_rows": int(len(dataset)),
            "feature_names": FEATURE_NAMES,
            "class_counts": self.class_distribution(),
            "allowed_values": ALLOWED_VALUES,
        }

    def class_distribution(self) -> dict:
        dataset = model_service.artifacts.dataset
        return {label: int(count) for label, count in dataset[TARGET_NAME].value_counts().to_dict().items()}

    def feature_value_counts(self) -> dict:
        dataset = model_service.artifacts.dataset
        counts = {}
        for feature in FEATURE_NAMES:
            counts[feature] = {
                value: int(count)
                for value, count in dataset[feature].value_counts().sort_index().to_dict().items()
            }
        return counts


metrics_service = MetricsService()
