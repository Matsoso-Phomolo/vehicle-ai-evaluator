from .config import CLASS_DESCRIPTIONS, FEATURE_NAMES


class ExplanationService:
    def build_explanation(self, values: dict, prediction_result: dict) -> dict:
        prediction = prediction_result["prediction"]
        ranked = prediction_result["ranked_probabilities"]
        second_label, second_probability = ranked[1]
        selected_probability = ranked[0][1]

        main_factors = self._select_main_factors(values, prediction)
        selected_name = CLASS_DESCRIPTIONS.get(prediction, prediction)
        second_name = CLASS_DESCRIPTIONS.get(second_label, second_label)

        reason = (
            f"The model classified this vehicle as {selected_name} because the selected "
            f"input values, especially {', '.join(main_factors)}, are more strongly "
            f"associated with {selected_name} outcomes in the training data than with the other classes."
        )

        comparison = (
            f"The selected class was {prediction} at {selected_probability * 100:.2f}%, "
            f"while the second highest class was {second_label} at {second_probability * 100:.2f}%."
        )

        naive_bayes_summary = (
            "The model calculates P(C|X) for each class and selects the class with the highest probability. "
            "It uses prior probability for each class, conditional probability for each input value, "
            "the Naive Bayes conditional independence assumption, and normalization so the class "
            "probabilities can be compared."
        )

        return {
            "main_factors": main_factors,
            "reason": reason,
            "comparison": comparison,
            "naive_bayes_summary": naive_bayes_summary,
        }

    def _select_main_factors(self, values: dict, prediction: str) -> list:
        priority = {
            "unacc": ["safety", "persons", "buying"],
            "acc": ["safety", "persons", "maint"],
            "good": ["maint", "safety", "lug_boot"],
            "vgood": ["safety", "persons", "lug_boot"],
        }
        selected_features = priority.get(prediction, FEATURE_NAMES[:3])
        return [f"{feature}={values[feature]}" for feature in selected_features[:3]]


explanation_service = ExplanationService()
