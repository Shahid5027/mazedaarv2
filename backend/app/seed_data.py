import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, Base, engine
from app.auth import get_password_hash
from app.models.entities import (
    Student, User, Course, Topic, LearningProgress, RemedialResource,
    Assessment, Submission, Evaluation, RiskPrediction, ActivitySnapshot, Intervention
)

def run_migrations():
    """Ensures all new schema columns exist in SQLite database without losing data."""
    with engine.connect() as conn:
        try:
            # Check users table columns
            columns = [col[1] for col in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "hashed_password" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
            if "reset_token" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)"))
            if "reset_token_expires" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP"))
            if "is_active" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            if "department" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(64)"))
            conn.commit()
        except Exception as e:
            print(f"Migration notice: {e}")

def update_user_passwords(db: Session):
    """Ensures all seeded and existing demo accounts have secure bcrypt password hashes."""
    demo_passwords = {
        "student_demo": "Student@123",
        "teacher_demo": "Teacher@123",
        "faculty_demo": "Teacher@123",
        "counselor_demo": "Counselor@123",
        "admin_demo": "Admin@123",
    }
    for username, pwd in demo_passwords.items():
        u = db.query(User).filter(User.username == username).first()
        if u and not u.hashed_password:
            u.hashed_password = get_password_hash(pwd)
            u.is_active = True
            if u.role == "student" and not u.department:
                u.department = "Computer Science"
            elif u.role in ["teacher", "faculty"] and not u.department:
                u.department = "Computer Science"
            elif not u.department:
                u.department = "Academic Affairs"
    db.commit()

def seed_database():
    run_migrations()
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # If data already exists, update user passwords and exit
    if db.query(Student).first():
        print("Database already contains data; verifying auth passwords...")
        update_user_passwords(db)
        db.close()
        return

    print("Seeding initial EDUCORE AI dataset...")

    # 1. Students (STU001 to STU010)
    students_data = [
        {"student_id": "STU001", "name": "Aarav Sharma", "email": "aarav.sharma@educore.edu", "department": "Computer Science", "semester": 4, "cgpa": 8.7, "attendance_pct": 92.5, "status": "active"},
        {"student_id": "STU002", "name": "Priya Patel", "email": "priya.patel@educore.edu", "department": "Artificial Intelligence", "semester": 4, "cgpa": 6.8, "attendance_pct": 71.0, "status": "at_risk"},
        {"student_id": "STU003", "name": "Rohan Verma", "email": "rohan.verma@educore.edu", "department": "Computer Science", "semester": 4, "cgpa": 5.4, "attendance_pct": 58.2, "status": "at_risk"},
        {"student_id": "STU004", "name": "Ananya Iyer", "email": "ananya.iyer@educore.edu", "department": "Data Science", "semester": 2, "cgpa": 9.3, "attendance_pct": 96.0, "status": "active"},
        {"student_id": "STU005", "name": "Kabir Mehta", "email": "kabir.mehta@educore.edu", "department": "Computer Science", "semester": 6, "cgpa": 7.4, "attendance_pct": 84.0, "status": "active"},
        {"student_id": "STU006", "name": "Sneha Roy", "email": "sneha.roy@educore.edu", "department": "Artificial Intelligence", "semester": 2, "cgpa": 6.1, "attendance_pct": 64.5, "status": "at_risk"},
        {"student_id": "STU007", "name": "Devansh Nair", "email": "devansh.nair@educore.edu", "department": "Electronics & CS", "semester": 6, "cgpa": 8.1, "attendance_pct": 89.0, "status": "active"},
        {"student_id": "STU008", "name": "Meera Joshi", "email": "meera.joshi@educore.edu", "department": "Computer Science", "semester": 4, "cgpa": 7.9, "attendance_pct": 88.5, "status": "active"},
        {"student_id": "STU009", "name": "Vikram Singh", "email": "vikram.singh@educore.edu", "department": "Data Science", "semester": 4, "cgpa": 4.9, "attendance_pct": 52.0, "status": "at_risk"},
        {"student_id": "STU010", "name": "Tanvi Gupta", "email": "tanvi.gupta@educore.edu", "department": "Artificial Intelligence", "semester": 6, "cgpa": 8.9, "attendance_pct": 94.0, "status": "active"},
    ]

    for s in students_data:
        db.add(Student(**s))
    db.commit()

    # 2. Users / Demo Roles
    users_data = [
        {"user_id": "USR_STU1", "username": "student_demo", "full_name": "Aarav Sharma", "email": "aarav.sharma@educore.edu", "role": "student", "student_id": "STU001", "hashed_password": get_password_hash("Student@123"), "is_active": True, "department": "Computer Science"},
        {"user_id": "USR_TEA1", "username": "teacher_demo", "full_name": "Prof. Rajesh Sengupta", "email": "r.sengupta@educore.edu", "role": "teacher", "student_id": None, "hashed_password": get_password_hash("Teacher@123"), "is_active": True, "department": "Computer Science"},
        {"user_id": "USR_FAC1", "username": "faculty_demo", "full_name": "Dr. Sunita Rao", "email": "s.rao@educore.edu", "role": "faculty", "student_id": None, "hashed_password": get_password_hash("Teacher@123"), "is_active": True, "department": "Artificial Intelligence"},
        {"user_id": "USR_CNS1", "username": "counselor_demo", "full_name": "Kavita Deshmukh", "email": "k.deshmukh@educore.edu", "role": "counselor", "student_id": None, "hashed_password": get_password_hash("Counselor@123"), "is_active": True, "department": "Student Welfare"},
        {"user_id": "USR_ADM1", "username": "admin_demo", "full_name": "Dean Academic Affairs", "email": "dean@educore.edu", "role": "admin", "student_id": None, "hashed_password": get_password_hash("Admin@123"), "is_active": True, "department": "Academic Affairs"},
    ]
    for u in users_data:
        db.add(User(**u))
    db.commit()

    # 3. Courses
    courses_data = [
        {
            "course_id": "CRS_CS201",
            "code": "CS201",
            "title": "Data Structures & Algorithms",
            "department": "Computer Science",
            "credits": 4,
            "instructor_name": "Prof. Rajesh Sengupta",
            "description": "Fundamental data representations, tree structures, dynamic programming, and algorithm analysis."
        },
        {
            "course_id": "CRS_AI301",
            "code": "AI301",
            "title": "Machine Learning Foundations",
            "department": "Artificial Intelligence",
            "credits": 4,
            "instructor_name": "Dr. Sunita Rao",
            "description": "Supervised learning, gradient descent, neural networks, regularisation, and model explainability."
        },
        {
            "course_id": "CRS_DB204",
            "code": "DB204",
            "title": "Database Systems & Design",
            "department": "Computer Science",
            "credits": 3,
            "instructor_name": "Dr. Anita Desai",
            "description": "Relational calculus, schema normalization, ACID transactions, and indexing strategies."
        }
    ]
    for c in courses_data:
        db.add(Course(**c))
    db.commit()

    # 4. Topics for CS201 & AI301 (PS1)
    topics_data = [
        {
            "topic_id": "TOP_TREES",
            "course_id": "CRS_CS201",
            "name": "Binary Trees & BST",
            "difficulty_level": "intermediate",
            "order_index": 1,
            "description": "Tree traversals (Inorder, Preorder, Postorder), AVL rotations, and balanced tree invariants.",
            "prerequisites": [],
            "concept_nodes": [
                {"id": "node_bt", "label": "Binary Tree Properties", "type": "root", "status": "mastered"},
                {"id": "node_bst", "label": "BST Search & Insertion", "type": "core", "status": "mastered"},
                {"id": "node_avl", "label": "Self-Balancing AVL Trees", "type": "advanced", "status": "remedial"}
            ]
        },
        {
            "topic_id": "TOP_GRAPHS",
            "course_id": "CRS_CS201",
            "name": "Graph Traversal & Shortest Paths",
            "difficulty_level": "advanced",
            "order_index": 2,
            "description": "Breadth-First Search (BFS), Depth-First Search (DFS), Dijkstra's algorithm, and topological ordering.",
            "prerequisites": ["TOP_TREES"],
            "concept_nodes": [
                {"id": "node_graph_rep", "label": "Adjacency Matrix & Lists", "type": "root", "status": "mastered"},
                {"id": "node_bfs_dfs", "label": "BFS / DFS Traversals", "type": "core", "status": "mastered"},
                {"id": "node_dijkstra", "label": "Dijkstra Priority Queue", "type": "advanced", "status": "remedial"}
            ]
        },
        {
            "topic_id": "TOP_DP",
            "course_id": "CRS_CS201",
            "name": "Dynamic Programming",
            "difficulty_level": "advanced",
            "order_index": 3,
            "description": "Memoization vs Tabulation, 0/1 Knapsack, Longest Common Subsequence, and recurrence relations.",
            "prerequisites": ["TOP_TREES"],
            "concept_nodes": [
                {"id": "node_recurrence", "label": "Optimal Substructure", "type": "root", "status": "mastered"},
                {"id": "node_memo", "label": "Top-Down Memoization", "type": "core", "status": "in_progress"},
                {"id": "node_knapsack", "label": "0/1 Knapsack Matrix", "type": "advanced", "status": "remedial"}
            ]
        },
        {
            "topic_id": "TOP_REGRESSION",
            "course_id": "CRS_AI301",
            "name": "Linear & Logistic Regression",
            "difficulty_level": "beginner",
            "order_index": 1,
            "description": "Gradient descent, mean squared error, cross-entropy loss, and decision boundary calibration.",
            "prerequisites": [],
            "concept_nodes": [
                {"id": "node_cost_func", "label": "Cost Function Minimization", "type": "root", "status": "mastered"},
                {"id": "node_grad_desc", "label": "Stochastic Gradient Descent", "type": "core", "status": "mastered"},
                {"id": "node_reg_l1_l2", "label": "L1 / L2 Regularization", "type": "advanced", "status": "in_progress"}
            ]
        },
        {
            "topic_id": "TOP_NEURAL_NETS",
            "course_id": "CRS_AI301",
            "name": "Neural Networks & Backpropagation",
            "difficulty_level": "advanced",
            "order_index": 2,
            "description": "Feedforward architecture, activation functions (ReLU, Sigmoid), chain rule, and loss gradient propagation.",
            "prerequisites": ["TOP_REGRESSION"],
            "concept_nodes": [
                {"id": "node_perceptron", "label": "Multi-layer Perceptron", "type": "root", "status": "mastered"},
                {"id": "node_activations", "label": "Activation Functions", "type": "core", "status": "mastered"},
                {"id": "node_backprop", "label": "Backpropagation Chain Rule", "type": "advanced", "status": "remedial"}
            ]
        }
    ]
    for t in topics_data:
        db.add(Topic(**t))
    db.commit()

    # 5. Learning Progress (PS1)
    progress_records = [
        {"progress_id": "PRG_001", "student_id": "STU001", "course_id": "CRS_CS201", "topic_id": "TOP_TREES", "topic_name": "Binary Trees & BST", "mastery_score": 88.0, "status": "mastered", "weak_concepts": [], "quiz_attempts_count": 3},
        {"progress_id": "PRG_002", "student_id": "STU001", "course_id": "CRS_CS201", "topic_id": "TOP_GRAPHS", "topic_name": "Graph Traversal & Shortest Paths", "mastery_score": 82.0, "status": "mastered", "weak_concepts": ["Dijkstra edge relaxation"], "quiz_attempts_count": 2},
        {"progress_id": "PRG_003", "student_id": "STU001", "course_id": "CRS_CS201", "topic_id": "TOP_DP", "topic_name": "Dynamic Programming", "mastery_score": 62.0, "status": "in_progress", "weak_concepts": ["Tabulation state transitions"], "quiz_attempts_count": 1},
        
        {"progress_id": "PRG_004", "student_id": "STU002", "course_id": "CRS_AI301", "topic_id": "TOP_REGRESSION", "topic_name": "Linear & Logistic Regression", "mastery_score": 58.0, "status": "in_progress", "weak_concepts": ["Regularization lambda tuning"], "quiz_attempts_count": 2},
        {"progress_id": "PRG_005", "student_id": "STU002", "course_id": "CRS_AI301", "topic_id": "TOP_NEURAL_NETS", "topic_name": "Neural Networks & Backpropagation", "mastery_score": 38.0, "status": "needs_remediation", "weak_concepts": ["Gradient vanishing", "Matrix calculus chain rule"], "quiz_attempts_count": 3},

        {"progress_id": "PRG_006", "student_id": "STU003", "course_id": "CRS_CS201", "topic_id": "TOP_TREES", "topic_name": "Binary Trees & BST", "mastery_score": 42.0, "status": "needs_remediation", "weak_concepts": ["Tree recursion base cases", "AVL double rotation"], "quiz_attempts_count": 4},
        {"progress_id": "PRG_007", "student_id": "STU003", "course_id": "CRS_CS201", "topic_id": "TOP_GRAPHS", "topic_name": "Graph Traversal & Shortest Paths", "mastery_score": 35.0, "status": "needs_remediation", "weak_concepts": ["Cycle detection in directed graphs", "Dijkstra negative weights"], "quiz_attempts_count": 2},

        {"progress_id": "PRG_008", "student_id": "STU004", "course_id": "CRS_CS201", "topic_id": "TOP_TREES", "topic_name": "Binary Trees & BST", "mastery_score": 96.0, "status": "mastered", "weak_concepts": [], "quiz_attempts_count": 2},
        {"progress_id": "PRG_009", "student_id": "STU004", "course_id": "CRS_CS201", "topic_id": "TOP_DP", "topic_name": "Dynamic Programming", "mastery_score": 91.0, "status": "mastered", "weak_concepts": [], "quiz_attempts_count": 2},
        {"progress_id": "PRG_010", "student_id": "STU009", "course_id": "CRS_CS201", "topic_id": "TOP_TREES", "topic_name": "Binary Trees & BST", "mastery_score": 30.0, "status": "needs_remediation", "weak_concepts": ["Pointers and tree structures", "Inorder traversal"], "quiz_attempts_count": 3},
    ]
    for p in progress_records:
        db.add(LearningProgress(**p))
    db.commit()

    # 6. Remedial Resources (PS1)
    remedial_data = [
        {
            "resource_id": "REM_001",
            "topic_id": "TOP_TREES",
            "title": "Mastering Tree Recursion & AVL Rotations with Visual Step-throughs",
            "resource_type": "interactive_doc",
            "estimated_minutes": 20,
            "language": "en",
            "content_summary": "Step-by-step breakdown of pointer manipulation during left-right and right-left AVL rotations with interactive diagrams.",
            "url": "https://educore.ai/learn/trees-remedial"
        },
        {
            "resource_id": "REM_002",
            "topic_id": "TOP_TREES",
            "title": "बाइनरी सर्च ट्री और रिकर्सन को समझें (BST Hindi Video Lecture)",
            "resource_type": "video",
            "estimated_minutes": 18,
            "language": "hi",
            "content_summary": "हिंदी में सरल व्याख्या: बाइनरी ट्री इनऑर्डर, प्रीऑर्डर और पोस्टऑर्डर ट्रैवर्सल।",
            "url": "https://educore.ai/learn/trees-hi"
        },
        {
            "resource_id": "REM_003",
            "topic_id": "TOP_NEURAL_NETS",
            "title": "Intuitive Backpropagation: Demystifying the Chain Rule Without Complex Notation",
            "resource_type": "interactive_doc",
            "estimated_minutes": 25,
            "language": "en",
            "content_summary": "Visual computational graph tracing showing exact error flow through weights, biases, and activation layers.",
            "url": "https://educore.ai/learn/backprop-visual"
        },
        {
            "resource_id": "REM_004",
            "topic_id": "TOP_DP",
            "title": "From Recursion to Memoization: The 5-Step DP Formulation Strategy",
            "resource_type": "practice_quiz",
            "estimated_minutes": 15,
            "language": "en",
            "content_summary": "Interactive micro-quizzes isolating base conditions, state variables, and lookup table initialization.",
            "url": "https://educore.ai/learn/dp-mastery"
        }
    ]
    for r in remedial_data:
        db.add(RemedialResource(**r))
    db.commit()

    # 7. PS2 Assessments
    assessments_data = [
        {
            "assessment_id": "ASM_DSA_01",
            "course_id": "CRS_CS201",
            "title": "Assignment 2: Subjective Analysis of Balanced Search Trees & Graph Shortest Paths",
            "description": "Analyze algorithmic complexity, edge-case behavior, and architectural tradeoffs between AVL trees and Red-Black trees, followed by Dijkstra proof.",
            "total_marks": 50.0,
            "due_date": datetime.datetime.utcnow() + datetime.timedelta(days=7),
            "created_by": "Prof. Rajesh Sengupta",
            "rubric": {
                "criteria": [
                    {"name": "Technical Accuracy", "max_points": 20, "description": "Correctness of algorithmic steps, invariants, and time complexity bounds."},
                    {"name": "Conceptual Depth", "max_points": 15, "description": "Clarity in comparing structural balancing mechanisms and rebalancing costs."},
                    {"name": "Edge Cases & Proofs", "max_points": 10, "description": "Consideration of duplicate keys, disconnected graphs, or degenerate tree shapes."},
                    {"name": "Clarity & Organization", "max_points": 5, "description": "Structure of technical explanation, formatting, and notation clarity."}
                ]
            },
            "questions": [
                {
                    "question_id": "Q1",
                    "prompt": "Compare AVL Trees vs Red-Black Trees in terms of lookup performance and insertion/deletion rotation frequency. Explain when an engineering team should choose one over the other.",
                    "max_marks": 25,
                    "reference_answer": "AVL trees are more strictly balanced than Red-Black trees (height difference factor at most 1 vs path length at most 2x). Lookup in AVL is faster O(log N) with smaller constant factor. However, RB trees require fewer rebalancing rotations during insertions/deletions (at most 2 rotations for insert, 3 for delete). Thus, read-heavy workloads favor AVL, while write-heavy systems (e.g. Linux kernel CFS scheduler, Java TreeMap) favor Red-Black trees."
                },
                {
                    "question_id": "Q2",
                    "prompt": "Explain Dijkstra's shortest path algorithm. Prove why it fails or produces incorrect shortest path distances when the graph contains negative edge weights.",
                    "max_marks": 25,
                    "reference_answer": "Dijkstra is a greedy algorithm maintaining a settled set of vertices. Once a vertex is extracted from the min-heap with minimal distance, Dijkstra assumes its shortest path is final. If a subsequent path includes negative edge weights, a shorter path to an already settled vertex could exist, violating the greedy invariant. Bellman-Ford or Johnson's algorithm must be used instead."
                }
            ]
        },
        {
            "assessment_id": "ASM_AI_01",
            "course_id": "CRS_AI301",
            "title": "Lab Evaluation: Gradient Descent & Neural Generalization Analysis",
            "description": "Formative subjective assessment on loss landscape convergence, vanishing gradients, and regularization techniques.",
            "total_marks": 40.0,
            "due_date": datetime.datetime.utcnow() + datetime.timedelta(days=12),
            "created_by": "Dr. Sunita Rao",
            "rubric": {
                "criteria": [
                    {"name": "Mathematical Rigor", "max_points": 15, "description": "Correct derivation of gradient updates and Jacobian-vector products."},
                    {"name": "Generalization Analysis", "max_points": 15, "description": "Clear diagnosis of overfitting vs underfitting, and bias-variance mitigation."},
                    {"name": "Practical Recommendations", "max_points": 10, "description": "Actionable solutions like batch normalization, residual connections, or Adam optimizer."}
                ]
            },
            "questions": [
                {
                    "question_id": "Q1",
                    "prompt": "Explain the vanishing gradient problem in deep neural networks using Sigmoid activation. How do ReLU and Residual Connections resolve this?",
                    "max_marks": 40,
                    "reference_answer": "Sigmoid derivative peaks at 0.25 and drops close to zero for large positive or negative inputs. By the chain rule across L layers, multiplying terms <= 0.25 exponentially decays the gradient toward the earliest layers, stopping learning. ReLU maintains a gradient of 1 for all positive inputs. Residual connections provide an identity gradient highway (grad = 1 + F'(x)), allowing uninterrupted backpropagation."
                }
            ]
        }
    ]
    for a in assessments_data:
        db.add(Assessment(**a))
    db.commit()

    # 8. PS2 Submissions & Evaluations
    submissions_data = [
        {
            "submission_id": "SUB_001",
            "assessment_id": "ASM_DSA_01",
            "student_id": "STU001",
            "file_name": "aarav_dsa_analysis.txt",
            "file_type": "txt",
            "submitted_text": "AVL trees have a balance factor of at most 1, making them more tightly balanced. As a result, lookups are slightly faster than in Red-Black trees. However, during inserts and deletions, AVL requires more rotations to maintain this tight constraint. For lookup-heavy systems like read caches, AVL is superior. Red-Black trees are preferable in standard library maps where write throughput matters.\n\nFor Dijkstra, the algorithm relies on the greedy property: once a node is finalized from the priority queue, no cheaper path can be found. A negative edge breaks this assumption because reaching an already finalized node through a negative weight edge would invalidate the recorded optimal distance.",
            "status": "evaluated"
        },
        {
            "submission_id": "SUB_002",
            "assessment_id": "ASM_DSA_01",
            "student_id": "STU002",
            "file_name": "priya_dsa_submission.txt",
            "file_type": "txt",
            "submitted_text": "AVL and Red Black trees are both self-balancing BSTs. AVL has faster search because it is more balanced. Red black tree is easier to balance. For Dijkstra, it finds the shortest path using a queue. If there is a negative weight, it can get stuck in a negative cycle or calculate wrong distances because it doesn't revisit nodes.",
            "status": "evaluated"
        },
        {
            "submission_id": "SUB_003",
            "assessment_id": "ASM_DSA_01",
            "student_id": "STU003",
            "file_name": "rohan_submission_draft.txt",
            "file_type": "txt",
            "submitted_text": "AVL trees do rotations when unbalanced. Red black trees use red and black colors. Dijkstra algorithm calculates distance between cities or nodes. Negative numbers make it confusing so it fails.",
            "status": "pending"
        }
    ]
    for sub in submissions_data:
        db.add(Submission(**sub))
    db.commit()

    # Evaluations for SUB_001 and SUB_002
    evaluations_data = [
        {
            "evaluation_id": "EVL_001",
            "submission_id": "SUB_001",
            "student_id": "STU001",
            "total_score": 46.0,
            "max_score": 50.0,
            "percentage": 92.0,
            "rubric_breakdown": {
                "Technical Accuracy": {"score": 19, "max": 20, "comment": "Precise understanding of balance factors and constant factors."},
                "Conceptual Depth": {"score": 14, "max": 15, "comment": "Clear distinction between read-heavy and write-heavy workloads."},
                "Edge Cases & Proofs": {"score": 9, "max": 10, "comment": "Accurate greedy invariant formulation for Dijkstra."},
                "Clarity & Organization": {"score": 4, "max": 5, "comment": "Well structured and concise."}
            },
            "ai_feedback": {
                "strengths": [
                    "Exceptional contrast between AVL lookup efficiency and Red-Black tree insertion rotation frequency.",
                    "Correctly formulated the greedy invariant violation when negative edges are present in Dijkstra."
                ],
                "weaknesses": [
                    "Could explicitly mention Bellman-Ford as the standard alternative for graphs with negative weights."
                ],
                "suggestions": [
                    "Explore Johnson's algorithm for all-pairs shortest paths on sparse graphs with negative edge weights."
                ]
            },
            "moderator_override_score": None,
            "moderator_notes": None,
            "is_moderated": False
        },
        {
            "evaluation_id": "EVL_002",
            "submission_id": "SUB_002",
            "student_id": "STU002",
            "total_score": 31.0,
            "max_score": 50.0,
            "percentage": 62.0,
            "rubric_breakdown": {
                "Technical Accuracy": {"score": 13, "max": 20, "comment": "Basic concepts noted, but lacking mathematical formalisms."},
                "Conceptual Depth": {"score": 9, "max": 15, "comment": "Vague statement on red-black rebalancing complexity."},
                "Edge Cases & Proofs": {"score": 5, "max": 10, "comment": "Did not prove greedy invariant breakdown clearly."},
                "Clarity & Organization": {"score": 4, "max": 5, "comment": "Adequate readability."}
            },
            "ai_feedback": {
                "strengths": [
                    "Understands that Dijkstra fails to revisit settled nodes.",
                    "Identified AVL's stricter balance condition."
                ],
                "weaknesses": [
                    "Lacks concrete rotation counts (max 2 vs O(log N)).",
                    "Did not formally define the greedy relaxation invariant."
                ],
                "suggestions": [
                    "Review Topic TOP_GRAPHS remedial material on Dijkstra edge relaxation."
                ]
            },
            "moderator_override_score": 33.0,
            "moderator_notes": "Added +2 marks for recognizing lack of node revisit mechanism in Dijkstra.",
            "is_moderated": True
        }
    ]
    for ev in evaluations_data:
        db.add(Evaluation(**ev))
    db.commit()

    # 9. PS3 Risk Predictions (for all 10 students, tying PS1 mastery + PS2 scores + attendance)
    predictions_data = [
        {
            "prediction_id": "RSK_STU001",
            "student_id": "STU001",
            "risk_score": 12.0,
            "risk_level": "low",
            "confidence": 0.94,
            "primary_factors": [
                {"factor": "Consistent High Attendance", "impact": "-35%", "severity": "positive", "category": "attendance"},
                {"factor": "Strong Subjective Grading Score (92%)", "impact": "-28%", "severity": "positive", "category": "academic"},
                {"factor": "Frequent LMS Engagement", "impact": "-15%", "severity": "positive", "category": "engagement"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 18},
                {"period": "Week 4", "risk": 15},
                {"period": "Week 6", "risk": 13},
                {"period": "Week 8", "risk": 12}
            ]
        },
        {
            "prediction_id": "RSK_STU002",
            "student_id": "STU002",
            "risk_score": 58.5,
            "risk_level": "medium",
            "confidence": 0.89,
            "primary_factors": [
                {"factor": "Attendance Drop below 75% Threshold (71.0%)", "impact": "+32%", "severity": "high", "category": "attendance"},
                {"factor": "Weak Remedial Progress in Neural Networks (38% mastery)", "impact": "+24%", "severity": "high", "category": "academic"},
                {"factor": "Evaluation Score Dip (62% on Midterm)", "impact": "+18%", "severity": "medium", "category": "academic"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 25},
                {"period": "Week 4", "risk": 38},
                {"period": "Week 6", "risk": 52},
                {"period": "Week 8", "risk": 58}
            ]
        },
        {
            "prediction_id": "RSK_STU003",
            "student_id": "STU003",
            "risk_score": 84.0,
            "risk_level": "high",
            "confidence": 0.93,
            "primary_factors": [
                {"factor": "Critical Attendance Deficit (58.2%)", "impact": "+45%", "severity": "critical", "category": "attendance"},
                {"factor": "Low CGPA (5.4) and Multiple Remedial Topics", "impact": "+30%", "severity": "high", "category": "academic"},
                {"factor": "Pending Unsubmitted Formative Evaluation", "impact": "+15%", "severity": "medium", "category": "engagement"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 40},
                {"period": "Week 4", "risk": 60},
                {"period": "Week 6", "risk": 75},
                {"period": "Week 8", "risk": 84}
            ]
        },
        {
            "prediction_id": "RSK_STU004",
            "student_id": "STU004",
            "risk_score": 8.0,
            "risk_level": "low",
            "confidence": 0.96,
            "primary_factors": [
                {"factor": "Top Tier CGPA (9.3) & Perfect Mastery", "impact": "-48%", "severity": "positive", "category": "academic"},
                {"factor": "High Attendance (96.0%)", "impact": "-32%", "severity": "positive", "category": "attendance"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 10},
                {"period": "Week 4", "risk": 9},
                {"period": "Week 6", "risk": 8},
                {"period": "Week 8", "risk": 8}
            ]
        },
        {
            "prediction_id": "RSK_STU005",
            "student_id": "STU005",
            "risk_score": 22.0,
            "risk_level": "low",
            "confidence": 0.88,
            "primary_factors": [
                {"factor": "Steady Academic Standing (CGPA 7.4)", "impact": "-20%", "severity": "positive", "category": "academic"},
                {"factor": "Sufficient Attendance (84%)", "impact": "-15%", "severity": "positive", "category": "attendance"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 24},
                {"period": "Week 4", "risk": 23},
                {"period": "Week 6", "risk": 22},
                {"period": "Week 8", "risk": 22}
            ]
        },
        {
            "prediction_id": "RSK_STU006",
            "student_id": "STU006",
            "risk_score": 67.0,
            "risk_level": "high",
            "confidence": 0.90,
            "primary_factors": [
                {"factor": "Attendance Warning (64.5%)", "impact": "+35%", "severity": "high", "category": "attendance"},
                {"factor": "First Year Transition Difficulty (CGPA 6.1)", "impact": "+22%", "severity": "medium", "category": "academic"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 30},
                {"period": "Week 4", "risk": 48},
                {"period": "Week 6", "risk": 60},
                {"period": "Week 8", "risk": 67}
            ]
        },
        {
            "prediction_id": "RSK_STU007",
            "student_id": "STU007",
            "risk_score": 19.0,
            "risk_level": "low",
            "confidence": 0.91,
            "primary_factors": [
                {"factor": "Strong Lab Performance", "impact": "-25%", "severity": "positive", "category": "academic"},
                {"factor": "Consistent Attendance (89%)", "impact": "-20%", "severity": "positive", "category": "attendance"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 22},
                {"period": "Week 4", "risk": 20},
                {"period": "Week 6", "risk": 19},
                {"period": "Week 8", "risk": 19}
            ]
        },
        {
            "prediction_id": "RSK_STU008",
            "student_id": "STU008",
            "risk_score": 21.0,
            "risk_level": "low",
            "confidence": 0.89,
            "primary_factors": [
                {"factor": "Solid Peer Collaboration", "impact": "-18%", "severity": "positive", "category": "engagement"},
                {"factor": "Good Attendance (88.5%)", "impact": "-18%", "severity": "positive", "category": "attendance"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 25},
                {"period": "Week 4", "risk": 23},
                {"period": "Week 6", "risk": 21},
                {"period": "Week 8", "risk": 21}
            ]
        },
        {
            "prediction_id": "RSK_STU009",
            "student_id": "STU009",
            "risk_score": 89.0,
            "risk_level": "high",
            "confidence": 0.95,
            "primary_factors": [
                {"factor": "Severe Attendance Alert (52.0%)", "impact": "+50%", "severity": "critical", "category": "attendance"},
                {"factor": "Academic Probation Risk (CGPA 4.9)", "impact": "+35%", "severity": "critical", "category": "academic"},
                {"factor": "Zero LMS Login in Past 14 Days", "impact": "+20%", "severity": "high", "category": "engagement"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 55},
                {"period": "Week 4", "risk": 72},
                {"period": "Week 6", "risk": 82},
                {"period": "Week 8", "risk": 89}
            ]
        },
        {
            "prediction_id": "RSK_STU010",
            "student_id": "STU010",
            "risk_score": 11.0,
            "risk_level": "low",
            "confidence": 0.95,
            "primary_factors": [
                {"factor": "High CGPA (8.9) & Project Lead", "impact": "-40%", "severity": "positive", "category": "academic"},
                {"factor": "Excellent Attendance (94%)", "impact": "-30%", "severity": "positive", "category": "attendance"}
            ],
            "historical_trend": [
                {"period": "Week 2", "risk": 15},
                {"period": "Week 4", "risk": 13},
                {"period": "Week 6", "risk": 12},
                {"period": "Week 8", "risk": 11}
            ]
        }
    ]
    for pred in predictions_data:
        db.add(RiskPrediction(**pred))
    db.commit()

    # 10. Activity Snapshots
    for i, s in enumerate(students_data):
        snapshot = ActivitySnapshot(
            snapshot_id=f"SNP_{s['student_id']}",
            student_id=s["student_id"],
            date=datetime.datetime.utcnow(),
            lms_logins=28 if s["status"] == "active" else 6,
            forum_posts=14 if s["status"] == "active" else 2,
            quiz_attempts=8 if s["status"] == "active" else 2,
            assignment_delays=0 if s["status"] == "active" else 5,
            attendance_rate=s["attendance_pct"]
        )
        db.add(snapshot)
    db.commit()

    # 11. Counselor Interventions (PS3)
    interventions_data = [
        {
            "intervention_id": "INT_001",
            "student_id": "STU003",
            "counselor_name": "Kavita Deshmukh",
            "title": "Urgent Academic & Attendance Counseling (58% Attendance)",
            "intervention_type": "attendance_warning",
            "status": "in_progress",
            "priority": "urgent",
            "notes": "Met with student on Thursday. Discussed family medical emergency causing commute disruptions. Arranged makeup assignments.",
            "scheduled_date": datetime.datetime.utcnow() + datetime.timedelta(days=2)
        },
        {
            "intervention_id": "INT_002",
            "student_id": "STU002",
            "counselor_name": "Kavita Deshmukh",
            "title": "AI/ML Remedial Tutoring Referral",
            "intervention_type": "academic_tutoring",
            "status": "planned",
            "priority": "high",
            "notes": "Connecting Priya with peer tutor Aarav Sharma for Neural Network backpropagation foundations.",
            "scheduled_date": datetime.datetime.utcnow() + datetime.timedelta(days=4)
        },
        {
            "intervention_id": "INT_003",
            "student_id": "STU009",
            "counselor_name": "Kavita Deshmukh",
            "title": "Comprehensive Academic Probation Intervention & Financial Review",
            "intervention_type": "financial_aid",
            "status": "planned",
            "priority": "urgent",
            "notes": "Student indicated part-time employment conflicts with morning lecture schedule. Exploring work-study alternatives.",
            "scheduled_date": datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
    ]
    for iv in interventions_data:
        db.add(Intervention(**iv))
    db.commit()

    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_database()

