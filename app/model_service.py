from dataclasses import dataclass

import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import CategoricalNB
from sklearn.preprocessing import OrdinalEncoder

from .config import ALLOWED_VALUES, DATA_PATH, FEATURE_NAMES, RANDOM_STATE, TARGET_NAME, TEST_SIZE


@dataclass
class ModelArtifacts:
    dataset: pd.DataFrame
    model: CategoricalNB
    encoder: OrdinalEncoder
    label_lookup: list
    accuracy: float
    train_size: int
    test_size: int


class ModelService:
    def __init__(self) -> None:
        self.artifacts = self._load_and_train()

    @property
    def is_loaded(self) -> bool:
        return self.artifacts is not None

    @property
    def dataset_loaded(self) -> bool:
        return DATA_PATH.exists() and not self.artifacts.dataset.empty

    def _load_and_train(self) -> ModelArtifacts:
        if not DATA_PATH.exists():
            raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

        dataset = pd.read_csv(DATA_PATH, header=None)
        dataset.columns = [*FEATURE_NAMES, TARGET_NAME]

        features = dataset[FEATURE_NAMES]
        labels = dataset[TARGET_NAME]

        encoder = OrdinalEncoder(categories=[ALLOWED_VALUES[name] for name in FEATURE_NAMES])
        encoded_features = encoder.fit_transform(features)

        encoded_labels, label_lookup = pd.factorize(labels)

        x_train, x_test, y_train, y_test = train_test_split(
            encoded_features,
            encoded_labels,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE,
        )

        model = CategoricalNB()
        model.fit(x_train, y_train)

        predictions = model.predict(x_test)
        accuracy = accuracy_score(y_test, predictions)

        return ModelArtifacts(
            dataset=dataset,
            model=model,
            encoder=encoder,
            label_lookup=list(label_lookup),
            accuracy=float(accuracy),
            train_size=len(x_train),
            test_size=len(x_test),
        )

    def validate(self, values: dict) -> dict:
        errors = {}
        for feature, value in values.items():
            allowed = ALLOWED_VALUES[feature]
            if value not in allowed:
                errors[feature] = f"Invalid value '{value}'. Allowed values: {', '.join(allowed)}"
        return errors

    def _encode_input(self, values: dict):
        user_data = pd.DataFrame([[values[name] for name in FEATURE_NAMES]], columns=FEATURE_NAMES)
        return self.artifacts.encoder.transform(user_data)

    def predict(self, values: dict) -> str:
        encoded = self._encode_input(values)
        prediction = self.artifacts.model.predict(encoded)[0]
        return self.artifacts.label_lookup[prediction]

    def predict_proba(self, values: dict) -> dict:
        encoded = self._encode_input(values)
        probabilities = self.artifacts.model.predict_proba(encoded)[0]
        return {
            self.artifacts.label_lookup[index]: float(probability)
            for index, probability in enumerate(probabilities)
        }

    def prediction_result(self, values: dict) -> dict:
        probabilities = self.predict_proba(values)
        prediction = max(probabilities, key=probabilities.get)
        confidence = probabilities[prediction]
        ranked = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)

        return {
            "prediction": prediction,
            "confidence": confidence,
            "probabilities": probabilities,
            "ranked_probabilities": ranked,
        }


model_service = ModelService()
