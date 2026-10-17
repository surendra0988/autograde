import subprocess
import tempfile
import os
import time


def grade_cpp_code(
    source_code,
    test_cases,
    time_limit
):
    results = []
    total_score = 0

    with tempfile.TemporaryDirectory() as temp_dir:

        cpp_file = os.path.join(
            temp_dir,
            "submission.cpp"
        )

        exe_file = os.path.join(
            temp_dir,
            "submission.exe"
        )

        # Save student code
        with open(
            cpp_file,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(source_code)

        # Compile
        compile_process = subprocess.run(
            [
                "g++",
                cpp_file,
                "-o",
                exe_file
            ],
            capture_output=True,
            text=True
        )

        # Compilation Error
        if compile_process.returncode != 0:

            return {
                "status": "Compilation Error",
                "score": 0,
                "total_points": sum(
                    test["points"]
                    for test in test_cases
                ),
                "compile_error": compile_process.stderr,
                "results": []
            }

        # Run test cases
        for index, test in enumerate(test_cases):

            start_time = time.time()

            try:

                process = subprocess.run(
                    [exe_file],
                    input=test["input_data"],
                    capture_output=True,
                    text=True,
                    timeout=time_limit
                )

                execution_time = time.time() - start_time

                actual_output = process.stdout.strip()
                expected_output = test[
                    "expected_output"
                ].strip()

                if actual_output == expected_output:

                    status = "Passed"
                    total_score += test["points"]

                else:

                    status = "Failed"

                results.append({
                    "test_case": index + 1,
                    "status": status,
                    "expected_output": expected_output,
                    "actual_output": actual_output,
                    "execution_time": round(
                        execution_time,
                        4
                    ),
                    "points": test["points"]
                    if status == "Passed"
                    else 0
                })

            except subprocess.TimeoutExpired:

                results.append({
                    "test_case": index + 1,
                    "status": "Time Limit Exceeded",
                    "execution_time": time_limit,
                    "points": 0
                })

    total_points = sum(
        test["points"]
        for test in test_cases
    )

    if total_score == total_points:
        final_status = "Accepted"
    else:
        final_status = "Wrong Answer"

    return {
        "status": final_status,
        "score": total_score,
        "total_points": total_points,
        "results": results
    }