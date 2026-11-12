import math
from typing import Dict, List, Optional, Any, Tuple

# Multi-difficulty Question Bank for Adaptive Learning Engine
# Each topic contains verified questions across Easy, Medium, and Hard difficulty levels.
TOPIC_QUESTION_BANK: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "TOP_TREES": {
        "easy": [
            {
                "question_id": "TREES_E1",
                "question_text": "In a Binary Search Tree (BST), where are keys smaller than the root node stored?",
                "concept": "BST Invariant",
                "difficulty": "easy",
                "options": ["Left subtree", "Right subtree", "In both subtrees equally", "At the root level only"],
                "correct_option_index": 0,
                "correct_answer": "Left subtree",
                "explanation": "By definition of a BST, all keys in the left subtree must be strictly less than the root node's key."
            },
            {
                "question_id": "TREES_E2",
                "question_text": "Which tree traversal visits nodes in the order: Root -> Left -> Right?",
                "concept": "Tree Traversals",
                "difficulty": "easy",
                "options": ["Inorder Traversal", "Preorder Traversal", "Postorder Traversal", "Level-order Traversal"],
                "correct_option_index": 1,
                "correct_answer": "Preorder Traversal",
                "explanation": "Preorder traversal processes the current node before traversing the left and right subtrees."
            }
        ],
        "medium": [
            {
                "question_id": "TREES_M1",
                "question_text": "What is the allowed range of balance factors (height(left) - height(right)) for any node in an AVL tree?",
                "concept": "AVL Balance Factor",
                "difficulty": "medium",
                "options": ["Exactly 0", "-1, 0, or +1", "Between -2 and +2", "Any integer <= height"],
                "correct_option_index": 1,
                "correct_answer": "-1, 0, or +1",
                "explanation": "An AVL tree maintains height balance such that for every node, |height(left) - height(right)| <= 1."
            },
            {
                "question_id": "TREES_M2",
                "question_text": "What is the worst-case lookup time complexity in a balanced AVL tree with N elements?",
                "concept": "Asymptotic Lookup Bounds",
                "difficulty": "medium",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_option_index": 1,
                "correct_answer": "O(log N)",
                "explanation": "Because the height of an AVL tree is bounded by ~1.44 log2(N), lookup is guaranteed to be O(log N) in the worst case."
            }
        ],
        "hard": [
            {
                "question_id": "TREES_H1",
                "question_text": "An AVL node has balance factor +2, and its left child has balance factor -1. What rotation sequence restores balance?",
                "concept": "AVL Double Rotation (Left-Right)",
                "difficulty": "hard",
                "options": [
                    "Single Right Rotation on the unbalanced node",
                    "Single Left Rotation on the unbalanced node",
                    "Left Rotation on the left child, followed by Right Rotation on the unbalanced node",
                    "Right Rotation on the left child, followed by Left Rotation on the unbalanced node"
                ],
                "correct_option_index": 2,
                "correct_answer": "Left Rotation on left child, then Right Rotation on parent",
                "explanation": "This represents the Left-Right (LR) imbalance case, requiring a left rotation on the child followed by a right rotation on the parent."
            },
            {
                "question_id": "TREES_H2",
                "question_text": "During deletion of a node in an AVL tree, what is the maximum number of rebalancing rotations required in the worst case?",
                "concept": "AVL Deletion Rebalancing Cascade",
                "difficulty": "hard",
                "options": ["At most 1 rotation", "At most 2 rotations", "O(log N) rotations", "O(N) rotations"],
                "correct_option_index": 2,
                "correct_answer": "O(log N) rotations",
                "explanation": "Unlike insertion where at most two rotations restore the AVL invariant, deletion can propagate height changes all the way up to the root, requiring up to O(log N) rotations."
            }
        ]
    },
    "TOP_GRAPHS": {
        "easy": [
            {
                "question_id": "GRP_E1",
                "question_text": "Which data structure is typically used to implement Breadth-First Search (BFS)?",
                "concept": "BFS Representation",
                "difficulty": "easy",
                "options": ["Stack", "Queue", "Priority Queue", "Binary Search Tree"],
                "correct_option_index": 1,
                "correct_answer": "Queue",
                "explanation": "BFS explores nodes level-by-level using a First-In-First-Out (FIFO) queue."
            }
        ],
        "medium": [
            {
                "question_id": "GRP_M1",
                "question_text": "What is the time complexity of Dijkstra's algorithm implemented with a binary min-heap for graph G(V, E)?",
                "concept": "Dijkstra Complexity",
                "difficulty": "medium",
                "options": ["O(V^2)", "O(E log V)", "O(V + E)", "O(V * E)"],
                "correct_option_index": 1,
                "correct_answer": "O(E log V)",
                "explanation": "With a binary min-heap, extracting min takes O(log V) per vertex and edge relaxations take O(E log V)."
            }
        ],
        "hard": [
            {
                "question_id": "GRP_H1",
                "question_text": "Why does Dijkstra's algorithm fail to compute shortest paths on graphs with negative edge weights?",
                "concept": "Dijkstra Greedy Invariant",
                "difficulty": "hard",
                "options": [
                    "It causes memory allocation failure in the heap",
                    "It violates the greedy invariant that once a vertex is extracted, its distance is finalized",
                    "Adjacency lists cannot store negative integers",
                    "Negative weights cause infinite loops even in acyclic graphs"
                ],
                "correct_option_index": 1,
                "correct_answer": "It violates the greedy invariant that once a vertex is extracted, its distance is finalized",
                "explanation": "Dijkstra assumes paths can only grow longer. A negative edge can provide a cheaper path to an already settled vertex."
            }
        ]
    },
    "TOP_DP": {
        "easy": [
            {
                "question_id": "DP_E1",
                "question_text": "What is the primary difference between memoization and tabulation?",
                "concept": "DP Approaches",
                "difficulty": "easy",
                "options": [
                    "Memoization is top-down recursion; tabulation is bottom-up iterative",
                    "Memoization uses more memory than tabulation always",
                    "Tabulation cannot solve optimization problems",
                    "Memoization only applies to sorting algorithms"
                ],
                "correct_option_index": 0,
                "correct_answer": "Memoization is top-down recursion; tabulation is bottom-up iterative",
                "explanation": "Top-down memoization caches recursive calls, while bottom-up tabulation iteratively fills an array."
            }
        ],
        "medium": [
            {
                "question_id": "DP_M1",
                "question_text": "In the 0/1 Knapsack problem with N items and maximum weight capacity W, what is the standard DP time complexity?",
                "concept": "Knapsack Complexity",
                "difficulty": "medium",
                "options": ["O(2^N)", "O(N * W)", "O(N + W)", "O(N log W)"],
                "correct_option_index": 1,
                "correct_answer": "O(N * W)",
                "explanation": "The 2D table has dimensions (N+1) x (W+1), requiring O(N * W) pseudo-polynomial time."
            }
        ],
        "hard": [
            {
                "question_id": "DP_H1",
                "question_text": "When can space complexity of the Longest Common Subsequence (LCS) length computation be reduced from O(m*n) to O(min(m, n))?",
                "concept": "Space Optimized DP",
                "difficulty": "hard",
                "options": [
                    "Only when m equals n",
                    "When only the length is needed, as each row depends solely on the current and previous rows",
                    "Only when using divide-and-conquer without matrices",
                    "It cannot be reduced below O(m * n)"
                ],
                "correct_option_index": 1,
                "correct_answer": "When only the length is needed, as each row depends solely on the current and previous rows",
                "explanation": "Computing DP[i][j] requires only row i-1 and row i, allowing rolling array optimization to O(min(m, n))."
            }
        ]
    },
    "TOP_REGRESSION": {
        "easy": [
            {
                "question_id": "REG_E1",
                "question_text": "What cost function is commonly minimized in standard Linear Regression?",
                "concept": "Cost Functions",
                "difficulty": "easy",
                "options": ["Mean Squared Error (MSE)", "Cross-Entropy Loss", "Hinge Loss", "Kullback-Leibler Divergence"],
                "correct_option_index": 0,
                "correct_answer": "Mean Squared Error (MSE)",
                "explanation": "Linear regression minimizes the residual sum of squares or Mean Squared Error between predictions and ground truth."
            }
        ],
        "medium": [
            {
                "question_id": "REG_M1",
                "question_text": "What is the primary difference between L1 (Lasso) and L2 (Ridge) regularization?",
                "concept": "Regularization Norms",
                "difficulty": "medium",
                "options": [
                    "L1 produces sparse weights (feature selection), while L2 shrinks weights smoothly",
                    "L1 is only for classification, L2 is only for regression",
                    "L2 eliminates features completely by setting weights to 0",
                    "L1 does not penalize large weights"
                ],
                "correct_option_index": 0,
                "correct_answer": "L1 produces sparse weights, L2 shrinks weights smoothly",
                "explanation": "L1 norm has diamond contour edges that drive uninformative coefficients to exactly zero."
            }
        ],
        "hard": [
            {
                "question_id": "REG_H1",
                "question_text": "Why does Logistic Regression use the Sigmoid function rather than linear regression output for probability estimation?",
                "concept": "Logistic Decision Boundary",
                "difficulty": "hard",
                "options": [
                    "Sigmoid prevents gradient computation",
                    "Sigmoid bounds output in [0, 1] and models the log-odds (logit) linearly",
                    "Linear regression outputs cannot be optimized via gradient descent",
                    "Sigmoid eliminates the need for training labels"
                ],
                "correct_option_index": 1,
                "correct_answer": "Sigmoid bounds output in [0, 1] and models the log-odds linearly",
                "explanation": "The sigmoid function squashes any real value into [0, 1], satisfying probability axioms and allowing cross-entropy loss."
            }
        ]
    },
    "TOP_NEURAL_NETS": {
        "easy": [
            {
                "question_id": "NN_E1",
                "question_text": "What is the primary purpose of an activation function in a neural network?",
                "concept": "Activation Functions",
                "difficulty": "easy",
                "options": [
                    "To introduce non-linearity so the network can learn complex patterns",
                    "To format the input images into square arrays",
                    "To reduce the number of hidden layers",
                    "To prevent using GPU memory"
                ],
                "correct_option_index": 0,
                "correct_answer": "To introduce non-linearity so the network can learn complex patterns",
                "explanation": "Without non-linear activations, composing multiple linear layers remains mathematically equivalent to a single linear transformation."
            }
        ],
        "medium": [
            {
                "question_id": "NN_M1",
                "question_text": "Why does the ReLU (Rectified Linear Unit) activation function help mitigate the vanishing gradient problem?",
                "concept": "Vanishing Gradient & ReLU",
                "difficulty": "medium",
                "options": [
                    "Its derivative is 1 for all positive inputs, avoiding multiplicative decay",
                    "It scales inputs to range [-1, 1]",
                    "It has zero gradient everywhere",
                    "It automatically normalizes layer weights"
                ],
                "correct_option_index": 0,
                "correct_answer": "Its derivative is 1 for all positive inputs",
                "explanation": "Sigmoid derivative is at most 0.25, which decays exponentially over layers. ReLU maintains a gradient of 1 for x > 0."
            }
        ],
        "hard": [
            {
                "question_id": "NN_H1",
                "question_text": "In deep networks with residual connections (ResNets), why does the identity shortcut (F(x) + x) preserve gradient flow?",
                "concept": "ResNet Gradient Highway",
                "difficulty": "hard",
                "options": [
                    "It eliminates the need for backpropagation",
                    "The gradient derivative includes a +1 term (d/dx [F(x) + x] = F'(x) + 1), preventing total attenuation",
                    "Residual connections convert the network to a decision tree",
                    "It makes the weight matrices diagonal"
                ],
                "correct_option_index": 1,
                "correct_answer": "Derivative includes a +1 term preventing total attenuation",
                "explanation": "By adding the identity term x, the gradient with respect to input contains +1, providing an unobstructed highway back to early layers."
            }
        ]
    }
}

class AdaptiveLearningEngine:
    """
    Core Adaptive Learning Engine (PS1).
    Implements:
    - Dynamic performance-based difficulty adjustment
    - Transparent Bayesian/EMA mastery update formula
    - Weak concept isolation from incorrect submissions
    - Remedial instruction generator with worked examples
    """

    @staticmethod
    def calculate_new_mastery(
        current_mastery: float,
        quiz_score_pct: float,
        previous_attempts: int
    ) -> Tuple[float, str]:
        """
        Mastery Update Formula:
        If first attempt: new_mastery = quiz_score_pct
        Subsequent attempts:
        new_mastery = 0.40 * current_mastery + 0.60 * quiz_score_pct
        Bounded strictly in [0.0, 100.0]
        """
        if previous_attempts == 0:
            new_mastery = float(quiz_score_pct)
        else:
            new_mastery = (0.40 * current_mastery) + (0.60 * quiz_score_pct)

        new_mastery = max(0.0, min(100.0, round(new_mastery, 1)))

        if new_mastery >= 80.0:
            status = "mastered"
        elif new_mastery >= 50.0:
            status = "in_progress"
        else:
            status = "needs_remediation"

        return new_mastery, status

    @staticmethod
    def select_next_difficulty(
        current_difficulty: str,
        recent_score_pct: float,
        consecutive_high_count: int = 1
    ) -> str:
        """
        Performance-based standardized difficulty transition:
        - Accuracy >= 80%: increase difficulty by one level.
        - Accuracy >= 50% and < 80%: maintain difficulty.
        - Accuracy < 50%: decrease difficulty by one level.
        Difficulty remains bounded strictly between Easy and Hard.
        """
        levels = ["easy", "medium", "hard"]
        idx = levels.index(current_difficulty) if current_difficulty in levels else 1

        if recent_score_pct >= 80.0:
            next_idx = min(len(levels) - 1, idx + 1)
        elif recent_score_pct < 50.0:
            next_idx = max(0, idx - 1)
        else:
            next_idx = idx

        return levels[next_idx]

    @staticmethod
    def get_adaptive_questions(
        topic_id: str,
        difficulty: str = "medium",
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Selects questions matching the student's current adaptive difficulty.
        If current tier has fewer questions, blends with adjacent tiers.
        """
        topic_bank = TOPIC_QUESTION_BANK.get(topic_id, {})
        if not topic_bank:
            # Fallback question
            return [{
                "question_id": f"GEN_{topic_id}_1",
                "question_text": f"Evaluate the foundational principle of {topic_id}.",
                "concept": "Foundational Principles",
                "difficulty": difficulty,
                "options": ["Recursive Decomposition", "Brute Force", "Greedy without check", "Random"],
                "correct_option_index": 0,
                "correct_answer": "Recursive Decomposition",
                "explanation": "Recursive decomposition allows solving large complex problems through subproblem recurrence."
            }]

        selected = list(topic_bank.get(difficulty, []))
        if len(selected) < count:
            # Supplement from other difficulties
            for diff in ["medium", "easy", "hard"]:
                if diff != difficulty:
                    for q in topic_bank.get(diff, []):
                        if q not in selected and len(selected) < count:
                            selected.append(q)

        return selected[:count]

    @staticmethod
    def diagnose_weaknesses(
        topic_id: str,
        user_answers: Dict[str, int]
    ) -> Tuple[int, int, float, List[str]]:
        """
        Evaluates correctness of quiz submission, returning:
        - correct_count
        - total_count
        - score_pct
        - list of diagnosed weak concepts
        """
        topic_bank = TOPIC_QUESTION_BANK.get(topic_id, {})
        all_questions = []
        for diff_qs in topic_bank.values():
            all_questions.extend(diff_qs)

        q_map = {q["question_id"]: q for q in all_questions}

        correct_count = 0
        total_count = max(1, len(user_answers))
        weak_concepts = []

        for q_id, chosen_idx in user_answers.items():
            question = q_map.get(q_id)
            if question:
                if chosen_idx == question["correct_option_index"]:
                    correct_count += 1
                else:
                    concept = question.get("concept", "Core Invariants")
                    if concept not in weak_concepts:
                        weak_concepts.append(concept)
            else:
                # If question not in bank, check dummy fallback
                if chosen_idx == 0:
                    correct_count += 1

        score_pct = round((correct_count / total_count) * 100.0, 1)
        return correct_count, total_count, score_pct, weak_concepts

    @staticmethod
    def generate_remediation_lesson(topic_id: str, weak_concept: str) -> Dict[str, Any]:
        """
        Generates grounded remedial content including simplified explanation,
        worked step-through example, and targeted follow-up practice.
        """
        remedial_lessons = {
            "AVL Balance Factor": {
                "title": "Demystifying AVL Height Balance Factor",
                "summary": "Balance factor is defined as height(left) - height(right). In AVL trees, every node must maintain balance factor in {-1, 0, 1}.",
                "worked_example": "Suppose node 30 has left child 20 (height 1) and right child None (height -1). Balance factor = 1 - (-1) = 2. Imbalance detected!",
                "practice_question": "If height(left) is 3 and height(right) is 1, what is the balance factor?",
                "practice_answer": "Balance factor = 3 - 1 = +2 (Left heavy, requires right rotation)."
            },
            "AVL Double Rotation (Left-Right)": {
                "title": "Resolving LR Imbalance via Double Rotation",
                "summary": "A Left-Right (LR) imbalance occurs when an insertion happens in the right subtree of a left child.",
                "worked_example": "Step 1: Perform Left Rotation on child node to transform LR into LL. Step 2: Perform Right Rotation on unbalanced parent.",
                "practice_question": "When is an RL rotation required?",
                "practice_answer": "When a node is inserted into the left subtree of a right child (balance factor -2 and right child balance factor +1)."
            },
            "Dijkstra Greedy Invariant": {
                "title": "Why Dijkstra Fails on Negative Edge Weights",
                "summary": "Dijkstra assumes that extending a path always increases its total cost. Once a node is marked finalized in the priority queue, Dijkstra assumes no shorter path to it exists.",
                "worked_example": "Source A -> B (weight 5). Path A -> C (weight 2) -> B (weight -4). Total cost via C is -2 < 5. But Dijkstra already finalized B at 5!",
                "practice_question": "Which algorithm correctly handles negative weights without negative cycles?",
                "practice_answer": "Bellman-Ford algorithm with O(V * E) time complexity."
            }
        }

        lesson = remedial_lessons.get(weak_concept, {
            "title": f"Targeted Review: {weak_concept}",
            "summary": f"Fundamental review of {weak_concept} invariants for {topic_id}.",
            "worked_example": "Trace the algorithm step-by-step on a 3-element minimal test input.",
            "practice_question": "Identify the base condition and inductive invariant.",
            "practice_answer": "Verify edge cases including empty inputs and boundary limits."
        })

        return lesson

