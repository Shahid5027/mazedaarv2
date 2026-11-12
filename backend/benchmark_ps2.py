import os
import sys
import json

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.engines.ps2_evaluation_engine import SubjectiveEvaluationEngine

BENCHMARK_PROMPT = (
    "Explain the AVL Tree rebalancing mechanism during node insertion. Detail the four rotation cases "
    "(LL, RR, LR, RL), the balance factor invariant, and derive the asymptotic time complexity for insertion and search."
)

BENCHMARK_REFERENCE = (
    "An AVL tree is a strictly height-balanced Binary Search Tree (BST) where the balance factor of every node, "
    "defined as balance_factor = height(left) - height(right), is strictly bounded within {-1, 0, +1}. "
    "When a new node insertion causes a balance factor of +2 or -2, an invariant violation occurs requiring rebalancing rotations. "
    "There are four canonical rotation cases: "
    "1. Left-Left (LL) case: Insertion into the left subtree of the left child (balance factor +2, left child +1). Resolved with a single Right Rotation. "
    "2. Right-Right (RR) case: Insertion into the right subtree of the right child (balance factor -2, right child -1). Resolved with a single Left Rotation. "
    "3. Left-Right (LR) case: Insertion into the right subtree of the left child (balance factor +2, left child -1). Resolved with a double rotation: Left Rotation on left child, then Right Rotation on unbalanced node. "
    "4. Right-Left (RL) case: Insertion into the left subtree of the right child (balance factor -2, right child +1). Resolved with a double rotation: Right Rotation on right child, then Left Rotation on unbalanced node. "
    "Because the tree height is bounded strictly by h <= 1.44 log2(N), the worst-case search complexity is O(log N). "
    "Node insertion takes O(log N) lookup plus at most two rebalancing rotations O(1), maintaining an overall insertion time complexity of O(log N)."
)

BENCHMARK_RUBRIC = {
    "criteria": [
        {
            "name": "Technical Accuracy",
            "max_points": 15.0,
            "description": "Evaluation of balance factor invariant (-1, 0, +1), correct rotation mappings, and asymptotic O(log N) proofs."
        },
        {
            "name": "Conceptual Depth",
            "max_points": 10.0,
            "description": "Explanation of structural tradeoffs, distinction between single (LL, RR) and double (LR, RL) rotations, and invariant restoration."
        },
        {
            "name": "Clarity & Edge Cases",
            "max_points": 5.0,
            "description": "Structural clarity, terminology correctness, and coverage of boundary conditions like root rebalancing or degenerate cases."
        }
    ]
}

# 15 Benchmark Student Answers (5 Strong, 5 Partial, 5 Weak)
SAMPLES = [
    # ---------- STRONG ANSWERS (5) ----------
    {
        "sample_id": "SA-STR-01",
        "category": "Strong",
        "human_marks": {
            "Technical Accuracy": 14.5,
            "Conceptual Depth": 9.5,
            "Clarity & Edge Cases": 4.5,
            "Total": 28.5
        },
        "text": (
            "An AVL tree maintains height balance such that for any node, balance factor = height(left) - height(right) "
            "must remain in {-1, 0, +1}. During insertion, new keys can create an imbalance where balance factor becomes +2 or -2. "
            "To restore the balance invariant, four rotations are used: LL case requires a single right rotation; RR case requires a single left rotation; "
            "LR case is a zig-zag requiring a left rotation on the child followed by a right rotation on the parent; "
            "RL case requires a right rotation on the child followed by a left rotation on the parent. "
            "Because height is strictly bounded by ~1.44 log2(N), lookup and insertion take O(log N) time, with at most two rotations restoring balance."
        )
    },
    {
        "sample_id": "SA-STR-02",
        "category": "Strong",
        "human_marks": {
            "Technical Accuracy": 14.0,
            "Conceptual Depth": 9.0,
            "Clarity & Edge Cases": 4.5,
            "Total": 27.5
        },
        "text": (
            "AVL trees enforce the balance factor property |height(left) - height(right)| <= 1 at every node. "
            "When inserting a key into a BST, we retrace the path back to the root to inspect balance factors. "
            "If an imbalance occurs, we classify the violation into LL, RR, LR, or RL. LL and RR are single rotations (right and left respectively). "
            "LR and RL are double rotations where we first rotate the child node to transform the structure into a single rotation case. "
            "Asymptotic time complexity: Search is O(log N) due to logarithmic height. Insertion takes O(log N) for traversal and O(1) for constant pointer updates."
        )
    },
    {
        "sample_id": "SA-STR-03",
        "category": "Strong",
        "human_marks": {
            "Technical Accuracy": 14.0,
            "Conceptual Depth": 9.5,
            "Clarity & Edge Cases": 4.0,
            "Total": 27.5
        },
        "text": (
            "The AVL tree rebalancing algorithm preserves the BST ordering while keeping the tree depth strictly logarithmic. "
            "The invariant requires height differences to not exceed 1. Imbalance is corrected by four rotations: "
            "Single Right Rotation fixes LL, Single Left Rotation fixes RR. For LR, a left rotation on left child followed by right rotation on parent. "
            "For RL, a right rotation on right child followed by left rotation on parent. "
            "Since tree height is guaranteed O(log N), search requires at most O(log N) comparisons. Insertion requires O(log N) to find position and O(1) rotation."
        )
    },
    {
        "sample_id": "SA-STR-04",
        "category": "Strong",
        "human_marks": {
            "Technical Accuracy": 13.5,
            "Conceptual Depth": 9.0,
            "Clarity & Edge Cases": 4.5,
            "Total": 27.0
        },
        "text": (
            "AVL rebalancing operates on the invariant balance factor in {-1, 0, 1}. During node insertion, heights change along the search path. "
            "If balance factor equals +2 and child is +1, LL single right rotation is executed. If balance factor is -2 and child is -1, RR single left rotation is executed. "
            "For LR and RL, double rotations are applied to re-align the subtree. The height never exceeds 1.44 log2 N, ensuring O(log N) search and insertion."
        )
    },
    {
        "sample_id": "SA-STR-05",
        "category": "Strong",
        "human_marks": {
            "Technical Accuracy": 13.5,
            "Conceptual Depth": 8.5,
            "Clarity & Edge Cases": 4.0,
            "Total": 26.0
        },
        "text": (
            "An AVL tree guarantees worst case O(log N) search and insertion by maintaining the height invariant: balance factor between -1 and +1. "
            "When a new node causes balance factor to reach +2 or -2, we apply tree rotations. LL requires single right rotation, RR requires single left rotation. "
            "LR requires left rotation on child then right rotation on root of violation. RL requires right rotation on child then left rotation on root. "
            "All pointer rearrangements take O(1) time after O(log N) tree traversal."
        )
    },

    # ---------- PARTIAL ANSWERS (5) ----------
    {
        "sample_id": "SA-PAR-06",
        "category": "Partial",
        "human_marks": {
            "Technical Accuracy": 9.0,
            "Conceptual Depth": 5.5,
            "Clarity & Edge Cases": 3.0,
            "Total": 17.5
        },
        "text": (
            "AVL tree is a self balancing binary search tree. The balance factor is the difference between left and right height and must be -1, 0, or 1. "
            "If it becomes unbalanced, rotations are used. The cases are LL and RR which use single rotations. "
            "Search takes O(log N) because the tree is balanced. Insertion is also fast."
        )
    },
    {
        "sample_id": "SA-PAR-07",
        "category": "Partial",
        "human_marks": {
            "Technical Accuracy": 8.5,
            "Conceptual Depth": 5.0,
            "Clarity & Edge Cases": 3.0,
            "Total": 16.5
        },
        "text": (
            "In an AVL tree, we maintain balance factor <= 1. When inserting a node, we might get LL, RR, LR, or RL violations. "
            "LL needs right rotation and RR needs left rotation. But for LR and RL we have to rotate twice. "
            "The time complexity is O(log N) for searching."
        )
    },
    {
        "sample_id": "SA-PAR-08",
        "category": "Partial",
        "human_marks": {
            "Technical Accuracy": 9.5,
            "Conceptual Depth": 5.0,
            "Clarity & Edge Cases": 3.0,
            "Total": 17.5
        },
        "text": (
            "AVL balance factor formula is height(left) minus height(right). Allowed values are -1, 0, 1. "
            "When balance is broken, single rotation or double rotation restores balance. "
            "Insertion and search complexities are both O(log N) because tree height is kept low."
        )
    },
    {
        "sample_id": "SA-PAR-09",
        "category": "Partial",
        "human_marks": {
            "Technical Accuracy": 7.5,
            "Conceptual Depth": 5.5,
            "Clarity & Edge Cases": 2.5,
            "Total": 15.5
        },
        "text": (
            "AVL trees use rotations to avoid becoming a linked list. The four cases are LL, RR, LR, and RL. "
            "Single rotations fix LL and RR. Double rotations fix LR and RL. The search time is logarithmic O(log N). "
            "However, if tree is not rebalanced it would be slow."
        )
    },
    {
        "sample_id": "SA-PAR-10",
        "category": "Partial",
        "human_marks": {
            "Technical Accuracy": 8.0,
            "Conceptual Depth": 4.5,
            "Clarity & Edge Cases": 3.0,
            "Total": 15.5
        },
        "text": (
            "The balance factor must be {-1, 0, 1}. During insertion, if a node has height difference 2, we rebalance. "
            "We do right rotation for LL and left rotation for RR. Search is O(log N) and insertion is O(log N). "
            "This keeps the binary search tree efficient."
        )
    },

    # ---------- WEAK ANSWERS (5) ----------
    {
        "sample_id": "SA-WEA-11",
        "category": "Weak",
        "human_marks": {
            "Technical Accuracy": 3.5,
            "Conceptual Depth": 2.0,
            "Clarity & Edge Cases": 1.5,
            "Total": 7.0
        },
        "text": (
            "AVL tree is a binary search tree where elements are sorted. Left child is smaller and right child is greater. "
            "Search complexity in worst case can be O(N) if we do not balance it properly."
        )
    },
    {
        "sample_id": "SA-WEA-12",
        "category": "Weak",
        "human_marks": {
            "Technical Accuracy": 3.0,
            "Conceptual Depth": 1.5,
            "Clarity & Edge Cases": 1.5,
            "Total": 6.0
        },
        "text": (
            "AVL tree is used for fast searching. It does rotations when new numbers are added into the tree so it does not get too tall."
        )
    },
    {
        "sample_id": "SA-WEA-13",
        "category": "Weak",
        "human_marks": {
            "Technical Accuracy": 2.0,
            "Conceptual Depth": 1.5,
            "Clarity & Edge Cases": 1.0,
            "Total": 4.5
        },
        "text": (
            "We balance trees using red and black node colors and color flipping. When root becomes red we flip it to black to maintain depth."
        )
    },
    {
        "sample_id": "SA-WEA-14",
        "category": "Weak",
        "human_marks": {
            "Technical Accuracy": 1.0,
            "Conceptual Depth": 1.0,
            "Clarity & Edge Cases": 1.0,
            "Total": 3.0
        },
        "text": (
            "Dijkstra algorithm uses a priority queue to find shortest paths. It does not work on negative weights because greedy choice fails."
        )
    },
    {
        "sample_id": "SA-WEA-15",
        "category": "Weak",
        "human_marks": {
            "Technical Accuracy": 2.5,
            "Conceptual Depth": 1.5,
            "Clarity & Edge Cases": 1.0,
            "Total": 5.0
        },
        "text": (
            "Binary trees have height. When height is unbalanced we rotate nodes. Complexity is O(log N) sometimes."
        )
    }
]

def run_benchmark():
    results = []
    total_abs_diff = 0.0
    crit_diffs = {"Technical Accuracy": 0.0, "Conceptual Depth": 0.0, "Clarity & Edge Cases": 0.0}

    print("=" * 90)
    print("EDUCORE AI — PS2 SUBJECTIVE GRADING BENCHMARK EVALUATION (N=15)")
    print("=" * 90)
    print(f"{'Sample ID':<10} | {'Category':<8} | {'Human':<6} | {'AI':<6} | {'Max':<5} | {'|Diff|':<6} | {'Tech (H/AI)':<12} | {'Depth (H/AI)':<12} | {'Clarity (H/AI)':<14}")
    print("-" * 90)

    for sample in SAMPLES:
        eval_result = SubjectiveEvaluationEngine.evaluate_submission(
            submitted_text=sample["text"],
            reference_answer=BENCHMARK_REFERENCE,
            rubric=BENCHMARK_RUBRIC,
            max_marks=30.0
        )

        ai_total = eval_result["total_score"]
        human_total = sample["human_marks"]["Total"]
        abs_diff = round(abs(human_total - ai_total), 2)
        total_abs_diff += abs_diff

        breakdown = eval_result["rubric_breakdown"]
        ai_tech = breakdown.get("Technical Accuracy", {}).get("score", 0.0)
        ai_depth = breakdown.get("Conceptual Depth", {}).get("score", 0.0)
        ai_clarity = breakdown.get("Clarity & Edge Cases", {}).get("score", 0.0)

        h_tech = sample["human_marks"]["Technical Accuracy"]
        h_depth = sample["human_marks"]["Conceptual Depth"]
        h_clarity = sample["human_marks"]["Clarity & Edge Cases"]

        crit_diffs["Technical Accuracy"] += abs(h_tech - ai_tech)
        crit_diffs["Conceptual Depth"] += abs(h_depth - ai_depth)
        crit_diffs["Clarity & Edge Cases"] += abs(h_clarity - ai_clarity)

        results.append({
            "sample_id": sample["sample_id"],
            "category": sample["category"],
            "human_marks": human_total,
            "ai_marks": ai_total,
            "max_marks": 30.0,
            "abs_difference": abs_diff,
            "criterion_agreement": {
                "technical_accuracy": {"human": h_tech, "ai": ai_tech, "diff": round(abs(h_tech - ai_tech), 2)},
                "conceptual_depth": {"human": h_depth, "ai": ai_depth, "diff": round(abs(h_depth - ai_depth), 2)},
                "clarity_edge_cases": {"human": h_clarity, "ai": ai_clarity, "diff": round(abs(h_clarity - ai_clarity), 2)}
            },
            "evidence_extracted": breakdown.get("Technical Accuracy", {}).get("evidence", "")[:80] + "..."
        })

        print(
            f"{sample['sample_id']:<10} | {sample['category']:<8} | {human_total:>5.1f}  | {ai_total:>5.1f}  | {30.0:>5.1f} | "
            f"{abs_diff:>5.1f}  | {h_tech:>4.1f}/{ai_tech:>4.1f}    | {h_depth:>4.1f}/{ai_depth:>4.1f}     | {h_clarity:>4.1f}/{ai_clarity:>4.1f}"
        )

    mae = round(total_abs_diff / len(SAMPLES), 2)
    tech_mae = round(crit_diffs["Technical Accuracy"] / len(SAMPLES), 2)
    depth_mae = round(crit_diffs["Conceptual Depth"] / len(SAMPLES), 2)
    clarity_mae = round(crit_diffs["Clarity & Edge Cases"] / len(SAMPLES), 2)

    print("-" * 90)
    print(f"Overall Benchmark Mean Absolute Error (MAE): {mae} marks / 30.0 ({round((mae/30.0)*100, 1)}% error margin)")
    print(f"Criterion Breakdown MAE: Technical={tech_mae}, Conceptual={depth_mae}, Clarity={clarity_mae}")
    print("=" * 90)

    summary = {
        "benchmark_name": "PS2 AVL Tree Subjective Grading Benchmark",
        "sample_count": len(SAMPLES),
        "total_max_marks": 30.0,
        "overall_mae": mae,
        "overall_mae_percentage": round((mae / 30.0) * 100, 1),
        "criterion_mae": {
            "technical_accuracy": tech_mae,
            "conceptual_depth": depth_mae,
            "clarity_edge_cases": clarity_mae
        },
        "samples": results
    }

    out_path = os.path.join(os.path.dirname(__file__), "ps2_benchmark_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Benchmark output persisted to: {out_path}")

    return summary

if __name__ == "__main__":
    run_benchmark()

