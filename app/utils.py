from fastapi import HTTPException, status

from .config import ALLOWED_VALUES, FEATURE_NAMES


def request_to_dict(request) -> dict:
    return {feature: getattr(request, feature) for feature in FEATURE_NAMES}


def validate_input_values(values: dict) -> None:
    errors = {}
    for feature, value in values.items():
        allowed = ALLOWED_VALUES[feature]
        if value not in allowed:
            errors[feature] = {
                "received": value,
                "allowed_values": allowed,
            }

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Invalid input category. Use one of the allowed values.",
                "errors": errors,
            },
        )


def round_percentages(probabilities: dict) -> dict:
    return {label: round(float(probability) * 100, 2) for label, probability in probabilities.items()}
