import os
import platform
import sys
import time
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from run_pipeline import run_pipeline


def get_directory_size(path: Path) -> int:
    total = 0
    if path.exists():
        for p in path.rglob("*"):
            if p.is_file():
                total += p.stat().st_size
    return total


def run_benchmark(batch_sizes=(1000, 5000)):
    print("\n" + "=" * 70)
    print("           AUDITTRACE - LOCAL HARDWARE BENCHMARK SUITE")
    print("=" * 70)
    print(f"  OS                  : {platform.system()} {platform.release()} ({platform.architecture()[0]})")
    print(f"  Processor           : {platform.processor() or 'x86_64'}")
    if HAS_PSUTIL:
        print(f"  CPU Logical Cores   : {psutil.cpu_count(logical=True)}")
        print(f"  Total Physical RAM  : {psutil.virtual_memory().total / (1024**3):.1f} GB")
    else:
        print(f"  CPU Cores (os)      : {os.cpu_count()}")
    print(f"  Python Version      : {platform.python_version()}")
    print("-" * 70)

    results = []

    for size in batch_sizes:
        print(f"\n[*] Running Benchmark Test: {size:,} transactions...")
        t0 = time.perf_counter()
        metrics = run_pipeline(num_events=size, inject_corrupt=False)
        total_time = time.perf_counter() - t0

        bronze_bytes = get_directory_size(Path("data/lakehouse/bronze"))
        silver_bytes = Path("data/lakehouse/silver/audittrace.duckdb").stat().st_size if Path("data/lakehouse/silver/audittrace.duckdb").exists() else 0

        throughput = size / metrics["elapsed_seconds"]

        results.append({
            "size": size,
            "latency_sec": metrics["elapsed_seconds"],
            "throughput_eps": throughput,
            "bronze_kb": bronze_bytes / 1024,
            "silver_kb": silver_bytes / 1024,
        })

    print("\n" + "=" * 70)
    print("                      BENCHMARK RESULTS TABLE")
    print("=" * 70)
    print(f" {'Batch Size':>12} | {'Time (sec)':>11} | {'Throughput (eps)':>18} | {'Bronze Parquet':>14} ")
    print("-" * 70)
    for r in results:
        print(f" {r['size']:>12,d} | {r['latency_sec']:>10.3f}s | {r['throughput_eps']:>16,.1f}/s | {r['bronze_kb']:>11.1f} KB ")
    print("=" * 70)
    print("  [NOTE] These metrics reflect genuine un-throttled execution on your hardware.\n")


if __name__ == "__main__":
    run_benchmark(batch_sizes=(1000, 5000))
