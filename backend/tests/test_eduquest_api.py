"""EduQuest backend E2E tests - covers auth, courses, lessons, resources,
files, activities, submissions, grading, gamification & leaderboard."""
import os, io, uuid, time
import requests

BASE = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE:
    # fallback read frontend .env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE = line.split('=',1)[1].strip().rstrip('/')
API = f"{BASE}/api"

ADMIN = {"email": "admin@eduquest.com", "password": "admin123"}
U = uuid.uuid4().hex[:8]
STUDENT = {"name": f"TEST Stu {U}", "email": f"test_stu_{U}@example.com", "password": "Secret123!", "role": "student"}
STUDENT2 = {"name": f"TEST Stu2 {U}", "email": f"test_stu2_{U}@example.com", "password": "Secret123!", "role": "student"}

state = {}

def _h(tok): return {"Authorization": f"Bearer {tok}"}

# ---------- Auth ----------
def test_01_login_admin():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and d["user"]["role"] == "teacher"
    state["teacher_token"] = d["token"]
    state["teacher_id"] = d["user"]["id"]

def test_02_register_student():
    r = requests.post(f"{API}/auth/register", json=STUDENT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["user"]["role"] == "student" and d["user"]["xp"] == 0
    state["student_token"] = d["token"]
    state["student_id"] = d["user"]["id"]
    # cookie set
    assert "access_token" in r.cookies or any("access_token" in c.name for c in r.cookies)

def test_03_register_duplicate_fails():
    r = requests.post(f"{API}/auth/register", json=STUDENT)
    assert r.status_code == 400

def test_04_me_bearer():
    r = requests.get(f"{API}/auth/me", headers=_h(state["student_token"]))
    assert r.status_code == 200 and r.json()["email"] == STUDENT["email"].lower()

def test_05_me_cookie():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200
    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 200 and r2.json()["role"] == "teacher"

def test_06_logout_clears_cookie():
    s = requests.Session()
    s.post(f"{API}/auth/login", json=ADMIN)
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 401

def test_07_unauth_me():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401

# ---------- Courses ----------
def test_10_create_course_teacher():
    r = requests.post(f"{API}/courses", headers=_h(state["teacher_token"]),
                      json={"title": f"TEST Course {U}", "description": "D", "subject": "Math", "cover_color": "#FFE156"})
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["teacher_id"] == state["teacher_id"]
    state["course_id"] = c["id"]

def test_11_create_course_student_forbidden():
    r = requests.post(f"{API}/courses", headers=_h(state["student_token"]),
                      json={"title": "X", "description": "D", "subject": "S"})
    assert r.status_code == 403

def test_12_list_courses_has_enrollment_fields():
    r = requests.get(f"{API}/courses", headers=_h(state["student_token"]))
    assert r.status_code == 200
    found = [c for c in r.json() if c["id"] == state["course_id"]]
    assert found and "student_count" in found[0] and "is_enrolled" in found[0]
    assert found[0]["is_enrolled"] is False

def test_13_enroll_student():
    r = requests.post(f"{API}/courses/{state['course_id']}/enroll", headers=_h(state["student_token"]))
    assert r.status_code == 200 and r.json().get("ok")
    # 2nd call returns already
    r2 = requests.post(f"{API}/courses/{state['course_id']}/enroll", headers=_h(state["student_token"]))
    assert r2.status_code == 200 and r2.json().get("already") is True

def test_14_teacher_cannot_enroll():
    r = requests.post(f"{API}/courses/{state['course_id']}/enroll", headers=_h(state["teacher_token"]))
    assert r.status_code == 403

def test_15_get_course_flags():
    r = requests.get(f"{API}/courses/{state['course_id']}", headers=_h(state["teacher_token"]))
    assert r.status_code == 200
    d = r.json()
    assert d["is_owner"] is True
    r2 = requests.get(f"{API}/courses/{state['course_id']}", headers=_h(state["student_token"]))
    assert r2.json()["is_enrolled"] is True and r2.json()["is_owner"] is False

def test_16_my_courses():
    rt = requests.get(f"{API}/courses/mine", headers=_h(state["teacher_token"])).json()
    assert any(c["id"] == state["course_id"] for c in rt)
    rs = requests.get(f"{API}/courses/mine", headers=_h(state["student_token"])).json()
    assert any(c["id"] == state["course_id"] for c in rs)

# ---------- Lessons ----------
def test_20_create_lesson():
    r = requests.post(f"{API}/courses/{state['course_id']}/lessons", headers=_h(state["teacher_token"]),
                      json={"title": "L1", "content": "# hi", "order": 1})
    assert r.status_code == 200
    state["lesson_id"] = r.json()["id"]
    lst = requests.get(f"{API}/courses/{state['course_id']}/lessons", headers=_h(state["student_token"])).json()
    assert any(l["id"] == state["lesson_id"] for l in lst)

def test_21_delete_lesson():
    r = requests.delete(f"{API}/lessons/{state['lesson_id']}", headers=_h(state["teacher_token"]))
    assert r.status_code == 200

# ---------- Files & Resources ----------
def test_30_upload_file():
    files = {"file": ("hello.txt", io.BytesIO(b"hello world"), "text/plain")}
    r = requests.post(f"{API}/files/upload", headers=_h(state["teacher_token"]), files=files)
    assert r.status_code == 200, r.text
    state["file_id"] = r.json()["id"]

def test_31_get_file_stream():
    r = requests.get(f"{API}/files/{state['file_id']}")
    assert r.status_code == 200 and r.content == b"hello world"

def test_32_resource_link():
    r = requests.post(f"{API}/courses/{state['course_id']}/resources", headers=_h(state["teacher_token"]),
                      json={"title": "Docs", "type": "link", "url": "https://example.com"})
    assert r.status_code == 200

def test_33_resource_file():
    r = requests.post(f"{API}/courses/{state['course_id']}/resources", headers=_h(state["teacher_token"]),
                      json={"title": "File", "type": "file", "file_id": state["file_id"]})
    assert r.status_code == 200

# ---------- Activities ----------
def test_40_create_assignment():
    r = requests.post(f"{API}/courses/{state['course_id']}/activities", headers=_h(state["teacher_token"]),
                      json={"title": "A1", "description": "do it", "type": "assignment", "max_points": 100, "xp_reward": 50})
    assert r.status_code == 200
    state["assignment_id"] = r.json()["id"]

def test_41_create_quiz():
    r = requests.post(f"{API}/courses/{state['course_id']}/activities", headers=_h(state["teacher_token"]),
                      json={"title": "Q1", "description": "q", "type": "quiz", "max_points": 100, "xp_reward": 50,
                            "quiz_questions": [
                                {"question": "2+2?", "options": ["3","4","5"], "correct_index": 1},
                                {"question": "Cap FR?", "options": ["Paris","Rome"], "correct_index": 0},
                            ]})
    assert r.status_code == 200
    state["quiz_id"] = r.json()["id"]

def test_42_quiz_without_questions_fails():
    r = requests.post(f"{API}/courses/{state['course_id']}/activities", headers=_h(state["teacher_token"]),
                      json={"title":"Bad","description":"","type":"quiz"})
    assert r.status_code == 400

def test_43_list_activities_hides_correct_index_for_student():
    r = requests.get(f"{API}/courses/{state['course_id']}/activities", headers=_h(state["student_token"]))
    assert r.status_code == 200
    quiz = next(a for a in r.json() if a["id"] == state["quiz_id"])
    for q in quiz["quiz_questions"]:
        assert "correct_index" not in q, "correct_index leaked to student!"

def test_44_teacher_sees_correct_index():
    r = requests.get(f"{API}/courses/{state['course_id']}/activities", headers=_h(state["teacher_token"]))
    quiz = next(a for a in r.json() if a["id"] == state["quiz_id"])
    assert "correct_index" in quiz["quiz_questions"][0]

# ---------- Submissions ----------
def test_50_submit_assignment():
    r = requests.post(f"{API}/activities/{state['assignment_id']}/submit-assignment",
                      headers=_h(state["student_token"]),
                      json={"activity_id": state["assignment_id"], "text_response": "my answer"})
    assert r.status_code == 200
    state["sub_id"] = r.json()["id"]
    assert r.json()["status"] == "submitted"

def test_51_submit_quiz_autograde_100():
    r = requests.post(f"{API}/activities/{state['quiz_id']}/submit-quiz",
                      headers=_h(state["student_token"]),
                      json={"activity_id": state["quiz_id"], "answers": [1, 0]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["percent"] == 100 and d["score"] == 100 and d["xp_awarded"] == 50

def test_52_quiz_bad_answer_count():
    r = requests.post(f"{API}/activities/{state['quiz_id']}/submit-quiz",
                      headers=_h(state["student_token"]),
                      json={"activity_id": state["quiz_id"], "answers": [1]})
    assert r.status_code == 400

def test_53_course_submissions_enriched():
    r = requests.get(f"{API}/courses/{state['course_id']}/submissions", headers=_h(state["teacher_token"]))
    assert r.status_code == 200
    subs = r.json()
    assert any("activity_title" in s and "max_points" in s for s in subs)

def test_54_grade_assignment_adds_xp():
    # get xp before
    me1 = requests.get(f"{API}/auth/me", headers=_h(state["student_token"])).json()
    xp_before = me1["xp"]
    r = requests.post(f"{API}/submissions/{state['sub_id']}/grade", headers=_h(state["teacher_token"]),
                      json={"score": 100, "feedback": "great"})
    assert r.status_code == 200
    me2 = requests.get(f"{API}/auth/me", headers=_h(state["student_token"])).json()
    assert me2["xp"] > xp_before

def test_55_my_submissions():
    r = requests.get(f"{API}/me/submissions", headers=_h(state["student_token"]))
    assert r.status_code == 200 and len(r.json()) >= 2
    assert all("activity_title" in s for s in r.json())

# ---------- Gamification ----------
def test_60_my_stats_badges():
    r = requests.get(f"{API}/me/stats", headers=_h(state["student_token"]))
    assert r.status_code == 200, r.text
    d = r.json()
    assert "xp" in d and "level" in d and "progress_percent" in d
    badge_ids = {b["id"]: b for b in d["badges"]}
    assert badge_ids["first_enroll"]["earned"] is True
    assert badge_ids["first_submission"]["earned"] is True
    assert badge_ids["quiz_master"]["earned"] is True  # scored 100%

def test_61_leaderboard_has_me_flag():
    r = requests.get(f"{API}/leaderboard", headers=_h(state["student_token"]))
    assert r.status_code == 200
    lb = r.json()
    mine = [x for x in lb if x["is_me"]]
    assert mine and mine[0]["id"] == state["student_id"]
    # sorted desc
    xps = [x["xp"] for x in lb]
    assert xps == sorted(xps, reverse=True)

def test_62_submit_without_enrollment_forbidden():
    # register second student, don't enroll
    r = requests.post(f"{API}/auth/register", json=STUDENT2)
    assert r.status_code == 200
    tok = r.json()["token"]
    r2 = requests.post(f"{API}/activities/{state['assignment_id']}/submit-assignment",
                       headers=_h(tok),
                       json={"activity_id": state["assignment_id"], "text_response": "x"})
    assert r2.status_code == 403

# ---------- Cleanup ----------
def test_99_cleanup():
    r = requests.delete(f"{API}/courses/{state['course_id']}", headers=_h(state["teacher_token"]))
    assert r.status_code == 200
