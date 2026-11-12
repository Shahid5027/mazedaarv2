import os
import sys
import time
import json
import statistics

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_ps1_latency_benchmark():
    print("=" * 80)
    print("EDUCORE AI — PS1 REAL RESPONSE LATENCY BENCHMARK (N=10 runs per endpoint)")
    print("=" * 80)

    endpoints = [
        {
            "name": "Quiz Retrieval (GET /api/ps1/quiz/TOP_TREES)",
            "method": "GET",
            "url": "/api/ps1/quiz/TOP_TREES?preferred_difficulty=medium&student_id=STU001",
            "payload": None
        },
        {
            "name": "Quiz Submission & Bayesian Mastery Update (POST /api/ps1/quiz/submit)",
            "method": "POST",
            "url": "/api/ps1/quiz/submit",
            "payload": {
                "student_id": "STU001",
                "topic_id": "TOP_TREES",
                "course_id": "CRS_CS201",
                "answers": {"TREES_M1": 1, "TREES_M2": 1}
            }
        },
        {
            "name": "Curriculum Grounded Remediation RAG (GET /api/ps1/curriculum/remedial-rag)",
            "method": "GET",
            "url": "/api/ps1/curriculum/remedial-rag?topic_id=TOP_TREES&weak_concept=AVL+Balance+Factor",
            "payload": None
        },
        {
            "name": "Classroom Adaptive Overview (GET /api/ps1/classroom-overview)",
            "method": "GET",
            "url": "/api/ps1/classroom-overview",
            "payload": None
        }
    ]

    benchmark_results = []
    all_latencies_ms = []

    for ep in endpoints:
        latencies = []
        for _ in range(10):
            t0 = time.perf_counter()
            if ep["method"] == "GET":
                res = client.get(ep["url"])
            else:
                res = client.post(ep["url"], json=ep["payload"])
            t1 = time.perf_counter()

            assert res.status_code == 200, f"Error on {ep['name']}: {res.text}"
            elapsed_ms = (t1 - t0) * 1000.0
            latencies.append(elapsed_ms)
            all_latencies_ms.append(elapsed_ms)

        avg_lat = round(statistics.mean(latencies), 2)
        min_lat = round(min(latencies), 2)
        max_lat = round(max(latencies), 2)
        std_lat = round(statistics.stdev(latencies), 2)

        benchmark_results.append({
            "operation": ep["name"],
            "runs": len(latencies),
            "average_ms": avg_lat,
            "min_ms": min_lat,
            "max_ms": max_lat,
            "std_dev_ms": std_lat,
            "within_8s_target": (avg_lat / 1000.0) < 8.0
        })

        print(f"• {ep['name']:<65}: Avg = {avg_lat:>6.2f} ms | Min = {min_lat:>6.2f} ms | Max = {max_lat:>6.2f} ms")

    grand_avg_ms = round(statistics.mean(all_latencies_ms), 2)
    grand_avg_sec = round(grand_avg_ms / 1000.0, 3)

    print("-" * 80)
    print(f"Overall Average Endpoint Response Latency: {grand_avg_ms} ms ({grand_avg_sec} seconds)")
    print(f"Official Target SLA: < 8.0 seconds")
    print(f"SLA Compliance Status: {'PASSED (Well below 8.0s)' if grand_avg_sec < 8.0 else 'FAILED'}")
    print("=" * 80)

    summary = {
        "benchmark_name": "PS1 Response Latency Benchmark",
        "official_sla_target_seconds": 8.0,
        "measured_overall_avg_seconds": grand_avg_sec,
        "measured_overall_avg_ms": grand_avg_ms,
        "is_sla_compliant": grand_avg_sec < 8.0,
        "endpoints": benchmark_results
    }

    out_path = os.path.join(os.path.dirname(__file__), "ps1_latency_benchmark.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Benchmark results persisted to: {out_path}")

    return summary

if __name__ == "__main__":
    run_ps1_latency_benchmark()

