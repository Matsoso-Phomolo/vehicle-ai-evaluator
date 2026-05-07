from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_works():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["model_loaded"] is True
    assert payload["dataset_loaded"] is True


def test_valid_prediction_returns_prediction_and_probabilities():
    response = client.post(
        "/predict",
        json={
            "buying": "low",
            "maint": "med",
            "doors": "3",
            "persons": "2",
            "lug_boot": "small",
            "safety": "med",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["prediction"] in {"unacc", "acc", "good", "vgood"}
    assert payload["confidence"] >= 0
    assert set(payload["probabilities"]) == {"unacc", "acc", "good", "vgood"}
    assert "explanation" in payload


def test_invalid_category_returns_proper_error():
    response = client.post(
        "/predict",
        json={
            "buying": "cheap",
            "maint": "med",
            "doors": "3",
            "persons": "2",
            "lug_boot": "small",
            "safety": "med",
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["detail"]["message"] == "Invalid input category. Use one of the allowed values."
    assert "buying" in payload["detail"]["errors"]


def test_probabilities_sum_to_about_100():
    response = client.post(
        "/predict",
        json={
            "buying": "vhigh",
            "maint": "high",
            "doors": "4",
            "persons": "more",
            "lug_boot": "big",
            "safety": "high",
        },
    )

    assert response.status_code == 200
    total_probability = sum(response.json()["probabilities"].values())
    assert 99.9 <= total_probability <= 100.1
