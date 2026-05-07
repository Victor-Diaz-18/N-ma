"""NUMA backend tests for NEW endpoints + sample course seed.
Covers:
- GET /api/me/upcoming (student): unsubmitted activities of enrolled courses, sorted, max 10, includes course meta.
- GET /api/activities/{id} (student): quiz_questions hides correct_index BEFORE submit, reveals AFTER submit.
- Sample course 'Plantas Medicinales 101' seeded with 3 lessons / 2 resources / 1 quiz (4q) / 1 assignment.
- Spanish/localized BADGES check (Primeros Pasos, Maestro del Quiz, Erudito).
- Quiz answers [1,2,3,1] => 100% (4/4).
- Quick regression on previously working endpoints.
"""
import os
import uuid
import pytest
import requests

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@eduquest.com", "password": "admin123"}
U = uuid.uuid4().hex[:8]
STUDENT = {
    "name": f"TEST Numa Stu {U}",
    "email": f"test_numa_stu_{U}@example.com",
    "password": "Secret123!",
    "role": "student",
}

state: dict = {}


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- bootstrap ----------
def test_00_admin_login_and_seed_present():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    d = r.json()
    state["teacher_token"] = d["token"]
    state["teacher_id"] = d["user"]["id"]


def test_01_register_student():
    r = requests.post(f"{API}/auth/register", json=STUDENT)
    assert r.status_code == 200, r.text
    d = r.json()
    state["student_token"] = d["token"]
    state["student_id"] = d["user"]["id"]


def test_02_sample_course_exists_with_expected_structure():
    """The seeded course 'Plantas Medicinales 101' must exist with 3 lessons, 2 resources,
    1 quiz (4 questions), 1 assignment."""
    r = requests.get(f"{API}/courses", headers=_h(state["teacher_token"]))
    assert r.status_code == 200
    courses = r.json()
    target = [c for c in courses if c["title"] == "Plantas Medicinales 101"]
    assert len(target) >= 1, "Seeded course 'Plantas Medicinales 101' not found"
    course = target[0]
    state["sample_course_id"] = course["id"]
    assert course["subject"] == "Botánica"
    assert course["cover_color"] == "#8BC34A"

    # lessons (3)
    r = requests.get(
        f"{API}/courses/{course['id']}/lessons",
        headers=_h(state["teacher_token"]),
    )
    assert r.status_code == 200
    lessons = r.json()
    assert len(lessons) == 3, f"expected 3 lessons, got {len(lessons)}"

    # resources (2)
    r = requests.get(
        f"{API}/courses/{course['id']}/resources",
        headers=_h(state["teacher_token"]),
    )
    assert r.status_code == 200
    resources = r.json()
    assert len(resources) == 2, f"expected 2 resources, got {len(resources)}"

    # activities: 1 quiz with 4 questions + 1 assignment
    r = requests.get(
        f"{API}/courses/{course['id']}/activities",
        headers=_h(state["teacher_token"]),
    )
    assert r.status_code == 200
    activities = r.json()
    quizzes = [a for a in activities if a["type"] == "quiz"]
    assignments = [a for a in activities if a["type"] == "assignment"]
    assert len(quizzes) == 1, f"expected 1 quiz, got {len(quizzes)}"
    assert len(assignments) == 1, f"expected 1 assignment, got {len(assignments)}"
    qz = quizzes[0]
    assert len(qz["quiz_questions"]) == 4, "quiz should have 4 questions"
    state["quiz_id"] = qz["id"]
    state["assignment_id"] = assignments[0]["id"]


# ---------- /me/upcoming ----------
def test_03_upcoming_empty_when_not_enrolled():
    r = requests.get(f"{API}/me/upcoming", headers=_h(state["student_token"]))
    assert r.status_code == 200, r.text
    assert r.json() == [], "Upcoming should be empty before enrollment"


def test_04_enroll_student_in_sample_course():
    r = requests.post(
        f"{API}/courses/{state['sample_course_id']}/enroll",
        headers=_h(state["student_token"]),
    )
    assert r.status_code == 200, r.text


def test_05_upcoming_lists_quiz_and_assignment_with_course_meta():
    r = requests.get(f"{API}/me/upcoming", headers=_h(state["student_token"]))
    assert r.status_code == 200, r.text
    items = r.json()
    assert isinstance(items, list)
    # both activities of the seeded course should appear (no submissions yet)
    ids = {i["id"] for i in items}
    assert state["quiz_id"] in ids
    assert state["assignment_id"] in ids
    # Each item must include course_title and course_color
    for it in items:
        assert it["course_title"] == "Plantas Medicinales 101"
        assert it["course_color"] == "#8BC34A"
        assert "type" in it and it["type"] in ("quiz", "assignment")
        assert "due_date" in it  # present (may be None)
        assert "xp_reward" in it
    # Max 10
    assert len(items) <= 10


def test_06_upcoming_sorted_due_date_asc_nulls_last():
    """Create extra activities under the seeded course with various due_dates and verify ordering."""
    teacher_h = _h(state["teacher_token"])
    course_id = state["sample_course_id"]
    payloads = [
        {"title": f"TEST Z late {U}", "description": "x", "type": "assignment",
         "due_date": "2030-12-31T00:00:00Z", "max_points": 100, "xp_reward": 10},
        {"title": f"TEST A early {U}", "description": "x", "type": "assignment",
         "due_date": "2026-02-01T00:00:00Z", "max_points": 100, "xp_reward": 10},
        {"title": f"TEST M mid {U}", "description": "x", "type": "assignment",
         "due_date": "2027-06-15T00:00:00Z", "max_points": 100, "xp_reward": 10},
    ]
    created = []
    for p in payloads:
        r = requests.post(f"{API}/courses/{course_id}/activities", json=p, headers=teacher_h)
        assert r.status_code == 200, r.text
        created.append(r.json()["id"])
    state["created_activity_ids"] = created

    r = requests.get(f"{API}/me/upcoming", headers=_h(state["student_token"]))
    assert r.status_code == 200
    items = r.json()
    # extract due_dates in returned order
    dues = [i.get("due_date") for i in items]
    # All non-null due dates must come before any null, and non-nulls must be ascending
    non_null = [d for d in dues if d is not None]
    nulls = [d for d in dues if d is None]
    assert non_null == sorted(non_null), f"non-null due dates not sorted asc: {non_null}"
    # nulls must all sit at the end
    if nulls:
        first_null_idx = dues.index(None)
        assert all(d is None for d in dues[first_null_idx:]), "nulls not last"
    # max 10
    assert len(items) <= 10


# ---------- quiz correct_index visibility ----------
def test_07_get_activity_hides_correct_index_before_submit():
    r = requests.get(
        f"{API}/activities/{state['quiz_id']}", headers=_h(state["student_token"])
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["type"] == "quiz"
    assert data.get("my_submission") in (None, {})
    for q in data["quiz_questions"]:
        assert "correct_index" not in q, "correct_index leaked before submission!"
        assert "question" in q and "options" in q


def test_08_quiz_answers_1_2_3_1_yields_100_percent():
    r = requests.post(
        f"{API}/activities/{state['quiz_id']}/submit-quiz",
        json={"activity_id": state["quiz_id"], "answers": [1, 2, 3, 1]},
        headers=_h(state["student_token"]),
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["correct_count"] == 4
    assert d["total_count"] == 4
    assert d["percent"] == 100
    assert d["score"] == 100


def test_09_get_activity_reveals_correct_index_after_submit():
    r = requests.get(
        f"{API}/activities/{state['quiz_id']}", headers=_h(state["student_token"])
    )
    assert r.status_code == 200
    data = r.json()
    assert data.get("my_submission") is not None, "my_submission should be attached"
    expected = [1, 2, 3, 1]
    for i, q in enumerate(data["quiz_questions"]):
        assert "correct_index" in q, f"Q{i}: correct_index NOT revealed after submission"
        assert q["correct_index"] == expected[i]


def test_10_upcoming_excludes_submitted_quiz():
    r = requests.get(f"{API}/me/upcoming", headers=_h(state["student_token"]))
    assert r.status_code == 200
    ids = {i["id"] for i in r.json()}
    assert state["quiz_id"] not in ids, "submitted quiz should not appear in upcoming"
    # assignment still present
    assert state["assignment_id"] in ids


# ---------- localized BADGES ----------
def test_11_me_stats_badges_localized_spanish():
    r = requests.get(f"{API}/me/stats", headers=_h(state["student_token"]))
    assert r.status_code == 200
    stats = r.json()
    badge_names = {b["name"] for b in stats["badges"]}
    expected_any = {"Primeros Pasos", "Maestro del Quiz", "Erudito"}
    missing = expected_any - badge_names
    assert not missing, (
        f"Spanish badge names missing: {missing}. Got names: {badge_names}"
    )


# ---------- regression sanity on previously-working endpoints ----------
def test_12_regression_leaderboard_and_my_stats_and_my_submissions():
    h = _h(state["student_token"])
    r1 = requests.get(f"{API}/leaderboard", headers=h)
    assert r1.status_code == 200 and isinstance(r1.json(), list)
    # student appears with is_me True
    me_rows = [u for u in r1.json() if u.get("id") == state["student_id"]]
    assert me_rows and me_rows[0]["is_me"] is True

    r2 = requests.get(f"{API}/me/stats", headers=h)
    assert r2.status_code == 200
    s = r2.json()
    assert s["xp"] >= 80, f"expected XP>=80 after 100% quiz with reward 80, got {s['xp']}"
    assert s["level"] >= 1
    assert s["submissions_count"] >= 1
    assert s["courses_enrolled"] >= 1

    r3 = requests.get(f"{API}/me/submissions", headers=h)
    assert r3.status_code == 200
    subs = r3.json()
    assert any(sub["activity_id"] == state["quiz_id"] for sub in subs)


def test_13_regression_assignment_submit_and_grade():
    # student submits assignment
    r = requests.post(
        f"{API}/activities/{state['assignment_id']}/submit-assignment",
        json={"activity_id": state["assignment_id"], "text_response": "TEST_ Mi botiquín verde response"},
        headers=_h(state["student_token"]),
    )
    assert r.status_code == 200, r.text
    sub = r.json()
    sub_id = sub["id"]

    # teacher grades it
    r2 = requests.post(
        f"{API}/submissions/{sub_id}/grade",
        json={"score": 95, "feedback": "Excelente trabajo"},
        headers=_h(state["teacher_token"]),
    )
    assert r2.status_code == 200, r2.text

    # course submissions endpoint visible to teacher
    r3 = requests.get(
        f"{API}/courses/{state['sample_course_id']}/submissions",
        headers=_h(state["teacher_token"]),
    )
    assert r3.status_code == 200
    assert any(s["id"] == sub_id for s in r3.json())


def test_14_regression_courses_get_and_role_guards():
    # student can list /courses
    r = requests.get(f"{API}/courses", headers=_h(state["student_token"]))
    assert r.status_code == 200
    # student cannot create a course
    r2 = requests.post(
        f"{API}/courses",
        json={"title": "TEST nope", "description": "x", "subject": "x"},
        headers=_h(state["student_token"]),
    )
    assert r2.status_code == 403


# ---------- cleanup ----------
def test_99_cleanup_extra_activities():
    th = _h(state["teacher_token"])
    for aid in state.get("created_activity_ids", []):
        requests.delete(f"{API}/activities/{aid}", headers=th)
