def test_challenge_catalog_flow(
    client,
    auth_headers,
):
    # -----------------------------------------------------
    # 1. FILTERED CHALLENGE LIST
    # -----------------------------------------------------

    response = client.get(
        "/api/challenges?domain=AI/ML",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


    # -----------------------------------------------------
    # 2. CHALLENGE DETAIL
    # -----------------------------------------------------

    challenge_id = 1

    response = client.get(
        f"/api/challenges/{challenge_id}",
        headers=auth_headers,
    )

    assert response.status_code in [200, 404]


    # -----------------------------------------------------
    # 3. ENROLLMENT
    # -----------------------------------------------------

    if response.status_code == 200:
        enrollment_response = client.post(
            f"/api/challenges/{challenge_id}/enroll",
            headers=auth_headers,
        )

        # 201 = newly enrolled
        # 400 = already enrolled from previous test/run
        assert enrollment_response.status_code in [201, 400]


def test_recommended_challenges(
    client,
    auth_headers,
):
    response = client.get(
        "/api/challenges/recommended?limit=5",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    assert len(response.json()) <= 5


def test_recommended_challenges_requires_auth(
    client,
):
    response = client.get(
        "/api/challenges/recommended"
    )

    assert response.status_code == 401


def test_enrollment_requires_auth(
    client,
):
    response = client.post(
        "/api/challenges/1/enroll"
    )

    assert response.status_code == 401