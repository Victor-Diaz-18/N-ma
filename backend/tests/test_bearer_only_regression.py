"""
NUMA backend Bearer-only regression test (iteration 3).

Goal: Verify ALL existing endpoints still work using ONLY the
`Authorization: Bearer <token>` header (no cookies). The frontend's axios
instance no longer sends `withCredentials=true`, so the backend must not
rely on cookies.

Also verifies:
  - CORS preflight (OPTIONS) + POST works for cross-origin requests.
  - /api/activities/{id} hides quiz correct_index before submission,
    reveals after submission.
  - Sample course "Plantas Medicinales 101" is seeded with 3 lessons,
    2 resources, 1 quiz, 1 assignment.
  - BADGES list returns Spanish names with green-ish colors.
  - /api/me/upcoming returns unsubmitted activities for enrolled
    courses, sorted by due_date.
"""

import os
import uuid
import pytest
import requests
from pathlib import Path

# Load REACT_APP_BACKEND_URL from frontend/.env if not already in env
if "REACT_APP_BACKEND_URL" not in os.environ:
    fe_env = Path("/app/frontend/.env")
    if fe_env.exists():
        for line in fe_env.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                os.environ["REACT_APP_BACKEND_URL"] = line.split("=", 1)[1].strip()
                break

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@eduquest.com"
ADMIN_PASS = "admin123"


# ----------------- helpers / fixtures -----------------

def _bearer_session(token: str) -> requests.Session:
    """Fresh session: only Authorization header, no cookies."""
    s = requests.Session()
    s.headers.update({
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    # Make sure no cookies sneak through
    s.cookies.clear()
    return s


@pytest.fixture(scope="session")
def teacher_token():
    # Use a plain requests.post (no Session) so no cookies are persisted.
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
                      timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert token, f"login body missing token: {body}"
    return token


@pytest.fixture(scope="session")
def teacher_client(teacher_token):
    return _bearer_session(teacher_token)


@pytest.fixture(scope="session")
def student():
    """Register a fresh student; return (token, user_id, email)."""
    email = f"TEST_numa_stu_{uuid.uuid4().hex[:8]}@example.com"
    password = "Secret123!"
    r = requests.post(f"{API}/auth/register",
                      json={"name": "Test Student",
                            "email": email,
                            "password": password,
                            "role": "student"},
                      timeout=15)
    assert r.status_code in (200, 201), f"register: {r.status_code} {r.text}"
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert token, f"register body missing token: {body}"
    user_id = body["user"]["id"]
    return {"token": token, "id": user_id, "email": email, "password": password}


@pytest.fixture(scope="session")
def student_client(student):
    return _bearer_session(student["token"])


# ----------------- 1. Auth: Bearer-only works, no cookie used -----------------

def test_01_login_returns_token_in_body():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
                      timeout=15)
    assert r.status_code == 200
    body = r.json()
    token = body.get("access_token") or body.get("token")
    assert isinstance(token, str) and len(token) > 20, f"missing/short token: {body}"
    assert body.get("user", {}).get("email") == ADMIN_EMAIL
    assert body["user"]["role"] == "teacher"


def test_02_me_works_with_bearer_only_no_cookie(teacher_token):
    # Explicitly DO NOT send any cookie; only Authorization header.
    r = requests.get(
        f"{API}/auth/me",
        headers={"Authorization": f"Bearer {teacher_token}"},
        cookies={},  # explicit empty
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == ADMIN_EMAIL


def test_03_me_unauthorized_without_token():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401


def test_04_me_unauthorized_with_bad_token():
    r = requests.get(
        f"{API}/auth/me",
        headers={"Authorization": "Bearer not.a.jwt"},
        timeout=15,
    )
    assert r.status_code == 401


def test_05_register_returns_token_in_body(student):
    # student fixture asserted registration succeeded; verify shape
    assert student["token"]
    assert student["id"]
    # also confirm /me works with that token (Bearer only)
    r = requests.get(
        f"{API}/auth/me",
        headers={"Authorization": f"Bearer {student['token']}"},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.json()["role"] == "student"


# ----------------- 2. CORS preflight -----------------

def test_06_cors_preflight_options_login():
    # Simulate a browser preflight from a different origin
    r = requests.options(
        f"{API}/auth/login",
        headers={
            "Origin": "https://example.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
        timeout=15,
    )
    # Starlette/Fastapi CORSMiddleware returns 200 for valid preflight
    assert r.status_code in (200, 204), f"preflight status {r.status_code} body={r.text}"
    allow_origin = r.headers.get("access-control-allow-origin")
    allow_methods = (r.headers.get("access-control-allow-methods") or "").upper()
    allow_headers = (r.headers.get("access-control-allow-headers") or "").lower()
    assert allow_origin is not None, f"missing ACAO header: {dict(r.headers)}"
    assert "POST" in allow_methods or "*" in allow_methods
    assert "authorization" in allow_headers or "*" in allow_headers


def test_07_cors_post_with_origin_succeeds():
    r = requests.post(
        f"{API}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS},
        headers={"Origin": "https://example.com"},
        timeout=15,
    )
    assert r.status_code == 200
    # CORS header echoed back
    assert r.headers.get("access-control-allow-origin") is not None


# ----------------- 3. Sample course "Plantas Medicinales 101" -----------------

@pytest.fixture(scope="session")
def sample_course(teacher_client):
    r = teacher_client.get(f"{API}/courses")
    assert r.status_code == 200, r.text
    courses = r.json()
    match = [c for c in courses if c.get("title") == "Plantas Medicinales 101"]
    assert match, f"seed course 'Plantas Medicinales 101' missing. Got titles: {[c.get('title') for c in courses]}"
    return match[0]


def test_08_sample_course_structure(teacher_client, sample_course):
    cid = sample_course["id"]
    # Lessons
    r = teacher_client.get(f"{API}/courses/{cid}/lessons")
    assert r.status_code == 200
    lessons = r.json()
    assert len(lessons) == 3, f"expected 3 lessons, got {len(lessons)}"
    # Resources
    r = teacher_client.get(f"{API}/courses/{cid}/resources")
    assert r.status_code == 200
    resources = r.json()
    assert len(resources) == 2, f"expected 2 resources, got {len(resources)}"
    # Activities: 1 quiz + 1 assignment
    r = teacher_client.get(f"{API}/courses/{cid}/activities")
    assert r.status_code == 200
    acts = r.json()
    quizzes = [a for a in acts if a.get("type") == "quiz"]
    assignments = [a for a in acts if a.get("type") == "assignment"]
    assert len(quizzes) >= 1, "expected at least 1 quiz"
    assert len(assignments) >= 1, "expected at least 1 assignment"


# ----------------- 4. Quiz correct_index hidden BEFORE submission, revealed AFTER -----------------

def test_09_quiz_correct_index_hidden_then_revealed(teacher_client, student_client, student, sample_course):
    cid = sample_course["id"]
    # Find the quiz activity
    r = teacher_client.get(f"{API}/courses/{cid}/activities")
    assert r.status_code == 200
    acts = r.json()
    quiz = next((a for a in acts if a.get("type") == "quiz"), None)
    assert quiz is not None
    qid = quiz["id"]

    # Student enrolls
    r = student_client.post(f"{API}/courses/{cid}/enroll")
    assert r.status_code in (200, 201, 409), r.text  # 409 if already enrolled

    # BEFORE submission: GET /api/activities/{id} should hide correct_index
    r = student_client.get(f"{API}/activities/{qid}")
    assert r.status_code == 200, r.text
    body = r.json()
    questions = body.get("quiz_questions") or []
    assert questions, "quiz_questions missing in activity payload"
    for q in questions:
        assert "correct_index" not in q or q["correct_index"] is None, \
            f"correct_index leaked before submission: {q}"

    # Submit quiz with the documented correct answers [1,2,3,1] => expect 100%
    payload = {"activity_id": qid, "answers": [1, 2, 3, 1]}
    r = student_client.post(f"{API}/activities/{qid}/submit-quiz", json=payload)
    assert r.status_code in (200, 201), f"submit-quiz failed: {r.status_code} {r.text}"
    sub = r.json()
    score = sub.get("score") or sub.get("grade") or sub.get("percentage")
    assert score in (100, 100.0, "100", "100.0") or (isinstance(score, (int, float)) and score >= 99.0), \
        f"expected 100% on [1,2,3,1], got: {sub}"

    # AFTER submission: GET /api/activities/{id} should now include correct_index
    r = student_client.get(f"{API}/activities/{qid}")
    assert r.status_code == 200
    body = r.json()
    questions = body.get("quiz_questions") or []
    assert questions
    revealed = [q for q in questions if q.get("correct_index") is not None]
    assert len(revealed) == len(questions), \
        f"correct_index not revealed after submission: {questions}"
    revealed_idx = [q["correct_index"] for q in questions]
    assert revealed_idx == [1, 2, 3, 1], f"unexpected correct answers: {revealed_idx}"


# ----------------- 5. Courses listing, enrollment, grading, leaderboard, stats -----------------

def test_10_courses_listing_with_bearer(student_client):
    r = student_client.get(f"{API}/courses")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_11_my_courses_after_enroll(student_client):
    r = student_client.get(f"{API}/courses/mine")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1


def test_12_my_submissions(student_client):
    r = student_client.get(f"{API}/me/submissions")
    assert r.status_code == 200
    subs = r.json()
    assert isinstance(subs, list) and len(subs) >= 1  # quiz submission from test_09


def test_13_leaderboard(student_client):
    r = student_client.get(f"{API}/leaderboard")
    assert r.status_code == 200
    lb = r.json()
    assert isinstance(lb, list)


def test_14_stats_returns_spanish_badges(student_client):
    r = student_client.get(f"{API}/me/stats")
    assert r.status_code == 200, r.text
    body = r.json()
    badges = body.get("badges") or []
    assert badges, "stats.badges should not be empty (BADGES catalog should always be present)"
    names = {b.get("name") for b in badges}
    # Spec required Spanish names
    expected = {
        "Primeros Pasos",
        "Pionero",
        "Maestro del Quiz",
        "Estrella Naciente",
        "Erudito",
        "Polímata",
    }
    missing = expected - names
    assert not missing, f"Missing Spanish badge names: {missing}. Got: {names}"
    # Color sanity: at least some green-ish colors. Accept hex starting with #A5D, #C5E, #8BC, #2E8 etc.
    greenish_prefixes = ("#A5D", "#C5E", "#8BC", "#2E8")
    green_count = sum(1 for b in badges if str(b.get("color", "")).upper().startswith(greenish_prefixes))
    assert green_count >= 3, f"expected >=3 green-ish badges, got colors: {[b.get('color') for b in badges]}"


def test_15_teacher_grades_assignment(teacher_client, student_client, student, sample_course):
    cid = sample_course["id"]
    # Find assignment
    r = teacher_client.get(f"{API}/courses/{cid}/activities")
    acts = r.json()
    assignment = next((a for a in acts if a.get("type") == "assignment"), None)
    assert assignment is not None
    aid = assignment["id"]

    # Student submits assignment (file metadata only — file_id can be a dummy id)
    payload = {"activity_id": aid, "file_id": "dummy-file-id", "filename": "TEST_essay.txt"}
    r = student_client.post(f"{API}/activities/{aid}/submit-assignment", json=payload)
    assert r.status_code in (200, 201), f"submit-assignment failed: {r.status_code} {r.text}"
    sub = r.json()
    sub_id = sub.get("id")
    assert sub_id

    # Teacher grades
    r = teacher_client.post(f"{API}/submissions/{sub_id}/grade",
                            json={"score": 88, "feedback": "Bien hecho"})
    assert r.status_code in (200, 201), f"grade failed: {r.status_code} {r.text}"
    # Verify grade persisted by reading student's submissions
    r2 = student_client.get(f"{API}/me/submissions")
    assert r2.status_code == 200
    subs = r2.json()
    target = next((s for s in subs if s.get("id") == sub_id), None)
    assert target is not None, "graded submission not found in /me/submissions"
    assert target.get("score") in (88, 88.0), f"grade not persisted: {target}"


# ----------------- 6. /api/me/upcoming -----------------

def test_16_me_upcoming_returns_sorted_unsubmitted(teacher_client, student_client, student, sample_course):
    """Create 3 dated activities, submit one, expect the other two sorted by due_date."""
    cid = sample_course["id"]

    # Create 3 activities with explicit (out-of-order) due dates
    due_dates = [
        "2030-06-15T12:00:00Z",
        "2030-01-10T12:00:00Z",
        "2030-03-20T12:00:00Z",
    ]
    created_ids = []
    for i, dd in enumerate(due_dates):
        payload = {
            "course_id": cid,
            "title": f"TEST_upcoming_{i}_{uuid.uuid4().hex[:6]}",
            "type": "assignment",
            "description": "test",
            "due_date": dd,
            "points": 10,
        }
        r = teacher_client.post(f"{API}/courses/{cid}/activities", json=payload)
        assert r.status_code in (200, 201), f"create activity: {r.status_code} {r.text}"
        created_ids.append(r.json()["id"])

    try:
        # Submit the SECOND (earliest due) so it disappears from upcoming
        early_id = created_ids[1]
        r = student_client.post(
            f"{API}/activities/{early_id}/submit-assignment",
            json={"activity_id": early_id, "file_id": "x", "filename": "TEST_a.txt"},
        )
        assert r.status_code in (200, 201), r.text

        # GET upcoming
        r = student_client.get(f"{API}/me/upcoming")
        assert r.status_code == 200, r.text
        up = r.json()
        assert isinstance(up, list)

        # Filter to just the ones we created
        ours = [u for u in up if u.get("id") in created_ids]
        ours_ids = [u["id"] for u in ours]

        # Submitted one should NOT be present
        assert early_id not in ours_ids, "submitted activity should be filtered out of /me/upcoming"

        # The other two should be present, sorted by due_date ascending
        assert created_ids[2] in ours_ids and created_ids[0] in ours_ids
        # Verify ordering
        ours_due = [(u["id"], u.get("due_date")) for u in ours]
        # The two remaining: created_ids[2] (March) should come before created_ids[0] (June)
        idx_march = next(i for i, (cid_, _) in enumerate(ours_due) if cid_ == created_ids[2])
        idx_june = next(i for i, (cid_, _) in enumerate(ours_due) if cid_ == created_ids[0])
        assert idx_march < idx_june, f"upcoming not sorted by due_date asc: {ours_due}"

        # Each upcoming item should include course meta
        for u in ours:
            assert u.get("course_id") == cid
    finally:
        # cleanup created activities
        for aid in created_ids:
            try:
                teacher_client.delete(f"{API}/activities/{aid}")
            except Exception:
                pass


# ----------------- 7. logout shouldn't break Bearer flow -----------------

def test_17_logout_endpoint_responds(teacher_client):
    # Logout clears the cookie server-side but the Bearer token is stateless;
    # we just want to ensure the endpoint still responds 200.
    r = teacher_client.post(f"{API}/auth/logout")
    assert r.status_code in (200, 204)
