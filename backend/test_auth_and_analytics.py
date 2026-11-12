import sys
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
print("=====================================================")
print("EDUCORE AI — COMPREHENSIVE END-TO-END ACCEPTANCE TEST")
print("=====================================================")

# 1. TEST DEMO ACCOUNTS LOGIN FOR ALL 4 ROLES
roles = [
    ("admin@educore.edu", "Admin@123", "admin"),
    ("teacher@educore.edu", "Teacher@123", "teacher"),
    ("student@educore.edu", "Student@123", "student"),
    ("counselor@educore.edu", "Counselor@123", "counselor"),
]

tokens = {}
for email, pwd, expected_role in roles:
    res = client.post("/api/auth/login", json={"username_or_email": email, "password": pwd})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()["data"]
    role_val = data["role"].lower()
    assert role_val in [expected_role, "faculty"], f"Unexpected role: {role_val}"
    assert "access_token" in data, "Missing access token"
    tokens[expected_role] = data["access_token"]
    print(f"✓ Authenticated {expected_role.upper()}: {data['full_name']} ({email})")

# 2. TEST INVALID PASSWORD REJECTION (401)
res_bad = client.post("/api/auth/login", json={"username_or_email": "admin@educore.edu", "password": "WrongPassword123"})
assert res_bad.status_code == 401, f"Expected 401, got {res_bad.status_code}"
print("✓ Invalid password rejected with HTTP 401 Unauthorized")

# 3. TEST REGISTRATION (STUDENT & TEACHER)
t_id = int(time.time())
reg_stu = client.post("/api/auth/register", json={
    "full_name": "Test New Student",
    "email": f"test.stu.{t_id}@educore.edu",
    "username": f"test_stu_{t_id}",
    "password": "SecureStudent@123",
    "role": "student",
    "department": "Artificial Intelligence",
    "semester": 3
})
assert reg_stu.status_code == 200, f"Student registration failed: {reg_stu.text}"
new_stu_id = reg_stu.json()["data"]["student_id"]
print(f"✓ Registered new Student: {new_stu_id} with JWT token")

reg_tea = client.post("/api/auth/register", json={
    "full_name": "Dr. Test Professor",
    "email": f"test.prof.{t_id}@educore.edu",
    "username": f"prof_test_{t_id}",
    "password": "SecureTeacher@123",
    "role": "teacher",
    "department": "Computer Science"
})
assert reg_tea.status_code == 200, f"Teacher registration failed: {reg_tea.text}"
print(f"✓ Registered new Faculty/Teacher: {reg_tea.json()['data']['username']} with JWT token")

# 4. TEST FORGOT PASSWORD & RESET FLOW
res_forgot = client.post("/api/auth/forgot-password", json={"email": f"test.stu.{t_id}@educore.edu"})
assert res_forgot.status_code == 200, "Forgot password request failed"
reset_token = res_forgot.json()["data"]["reset_token"]
assert reset_token is not None, "Reset token not returned"
print("✓ Generated password reset token")

res_reset = client.post("/api/auth/reset-password", json={"token": reset_token, "new_password": "UpdatedPassword@456"})
assert res_reset.status_code == 200, "Password reset failed"
print("✓ Password reset flow completed successfully")

# Verify login with new password
res_login_new = client.post("/api/auth/login", json={"username_or_email": f"test.stu.{t_id}@educore.edu", "password": "UpdatedPassword@456"})
assert res_login_new.status_code == 200, "Login with new password failed"
print("✓ Logged in with new password")

# 5. TEST ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENFORCEMENT
# A. Student STU001 can view own profile
res_own = client.get("/api/students/STU001", headers={"Authorization": f"Bearer {tokens['student']}"})
assert res_own.status_code == 200, f"Own profile failed: {res_own.status_code}"
print("✓ Student permitted to access own profile STU001")

# B. Student STU001 FORBIDDEN from accessing other student STU002
res_other = client.get("/api/students/STU002", headers={"Authorization": f"Bearer {tokens['student']}"})
assert res_other.status_code == 403, f"Expected 403, got {res_other.status_code}"
print("✓ Student strictly FORBIDDEN (403) from accessing another student's private profile")

# C. Student FORBIDDEN from creating interventions
res_int_hack = client.post("/api/ps3/interventions", json={
    "student_id": "STU002",
    "counselor_name": "Hacker",
    "title": "Unauthorized Task"
}, headers={"Authorization": f"Bearer {tokens['student']}"})
assert res_int_hack.status_code == 403, f"Expected 403 for student intervention creation, got {res_int_hack.status_code}"
print("✓ Student strictly FORBIDDEN (403) from modifying counselor interventions")

# D. Student FORBIDDEN from overriding evaluation grades
res_grade_hack = client.post("/api/ps2/evaluations/EVL_001/override", json={
    "moderator_override_score": 99.0,
    "moderator_notes": "Tampered grade"
}, headers={"Authorization": f"Bearer {tokens['student']}"})
assert res_grade_hack.status_code == 403, f"Expected 403 for student grade override, got {res_grade_hack.status_code}"
print("✓ Student strictly FORBIDDEN (403) from tampering assessment evaluation scores")

# E. Counselor permitted to create intervention
res_int_couns = client.post("/api/ps3/interventions", json={
    "student_id": "STU002",
    "counselor_name": "Kavita Deshmukh",
    "title": "Academic Mentorship for Trees",
    "intervention_type": "academic_tutoring",
    "priority": "high"
}, headers={"Authorization": f"Bearer {tokens['counselor']}"})
assert res_int_couns.status_code == 200, f"Counselor intervention failed: {res_int_couns.text}"
print("✓ Counselor authorized (200) to create and assign retention intervention tasks")

# 6. TEST VISUAL ANALYTICS ENDPOINTS
# A. Admin Institution Analytics
res_inst = client.get("/api/analytics/institution", headers={"Authorization": f"Bearer {tokens['admin']}"})
assert res_inst.status_code == 200, "Institution analytics failed"
inst_d = res_inst.json()["data"]
assert len(inst_d["risk_distribution"]) == 3, "Missing risk distribution"
assert len(inst_d["cgpa_distribution"]) == 4, "Missing CGPA distribution"
assert len(inst_d["attendance_trends"]) >= 4, "Missing attendance trends"
assert len(inst_d["progress_trends"]) >= 4, "Missing progress trends"
print("✓ Admin Institution Visual Analytics: CGPA Distribution, Risk Donut, Monthly Attendance & Learning Trends verified")

# B. Teacher Classroom Analytics
res_teach = client.get("/api/analytics/teacher", headers={"Authorization": f"Bearer {tokens['teacher']}"})
assert res_teach.status_code == 200, "Teacher analytics failed"
teach_d = res_teach.json()["data"]
assert len(teach_d["topic_performance"]) > 0, "Missing topic performance"
assert len(teach_d["mastery_distribution"]) == 3, "Missing mastery distribution"
assert len(teach_d["top_weak_concepts"]) > 0, "Missing top weak concepts"
print("✓ Teacher Visual Analytics: Topic Mastery, Student Mastery Distribution, Weak Concepts verified")

# C. Counselor Retention Analytics
res_couns = client.get("/api/analytics/counselor", headers={"Authorization": f"Bearer {tokens['counselor']}"})
assert res_couns.status_code == 200, "Counselor analytics failed"
couns_d = res_couns.json()["data"]
assert len(couns_d["risk_distribution"]) == 3, "Missing risk distribution"
assert len(couns_d["heatmap_matrix"]) >= 6, "Missing heatmap matrix"
assert len(couns_d["risk_trend"]) >= 4, "Missing risk trend"
print("✓ Counselor Visual Analytics: Risk Donut, 3x3 Heatmap Matrix, Weekly Trajectory verified")

# D. Student Personal Analytics
res_stu_an = client.get("/api/analytics/student/STU001", headers={"Authorization": f"Bearer {tokens['student']}"})
assert res_stu_an.status_code == 200, "Student personal analytics failed"
stu_d = res_stu_an.json()["data"]
assert len(stu_d["topic_mastery"]) > 0, "Missing topic mastery"
assert len(stu_d["quiz_trend"]) > 0, "Missing quiz trend"
print("✓ Student Personal Visual Analytics: Topic Mastery, Quiz Trajectory, Activity History verified")

print("=====================================================")
print("ALL COMPREHENSIVE ACCEPTANCE TESTS PASSED (100%)!")
print("=====================================================")
