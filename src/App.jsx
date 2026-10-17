import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

 async function fetchAssignments() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/assignments"
    );

    const data = await response.json();

    console.log("ASSIGNMENTS FROM API:", data);

    setAssignments(data);
    setLoading(false);
  } catch (error) {
    console.error("FETCH ERROR:", error);
    setLoading(false);
  }
}

  async function openAssignment(id) {
    const response = await fetch(
      `${API_URL}/assignments/${id}`
    );

    const data = await response.json();

    setSelectedAssignment(data);
    setResult(null);

    setCode(`#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;

    cout << a + b;

    return 0;
}`);
  }

  async function submitCode() {
    if (!selectedAssignment) return;

    setResult({
      loading: true
    });

    try {
      const response = await fetch(`${API_URL}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignment_id: selectedAssignment.id,
          source_code: code
        })
      });

      const data = await response.json();

      setResult(data.result);
    } catch (error) {
      setResult({
        status: "Error",
        score: 0,
        total_points: selectedAssignment.total_points,
        error: "Unable to connect to backend."
      });
    }
  }

  function goBack() {
    setSelectedAssignment(null);
    setResult(null);
  }

  if (loading) {
    return (
      <div className="loading">
        Loading AutoGrade...
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">A</div>
            <div>
              <h2>AutoGrade</h2>
              <span>Code Testing Engine</span>
            </div>
          </div>

          <nav>
            <button
              className="nav-item"
              onClick={goBack}
            >
              ← Dashboard
            </button>

            <button className="nav-item active">
              Assignment
            </button>
          </nav>
        </aside>

        <main className="main">
          <button
            className="back-btn"
            onClick={goBack}
          >
            ← Back to Dashboard
          </button>

          <div className="problem-header">
            <div>
              <span className="badge cpp">
                {selectedAssignment.language.toUpperCase()}
              </span>

              <h1>{selectedAssignment.title}</h1>

              <p>
                {selectedAssignment.description}
              </p>
            </div>

            <div className="problem-points">
              <strong>
                {selectedAssignment.total_points}
              </strong>

              <span>Points</span>
            </div>
          </div>

          <div className="coding-layout">

            {/* Problem */}
            <div className="problem-panel">

              <h3>Problem</h3>

              <p>
                {selectedAssignment.description}
              </p>

              <h3>Test Cases</h3>

              <div className="visible-tests">
                {selectedAssignment.test_cases
                  .filter((test) => !test.is_hidden)
                  .map((test, index) => (
                    <div
                      className="test-card"
                      key={test.id}
                    >
                      <strong>
                        Test Case {index + 1}
                      </strong>

                      <div>
                        <small>Input</small>
                        <code>
                          {test.input_data}
                        </code>
                      </div>

                      <div>
                        <small>Expected Output</small>
                        <code>
                          {test.expected_output}
                        </code>
                      </div>
                    </div>
                  ))}
              </div>

            </div>

            {/* Editor */}
            <div className="editor-panel">

              <div className="editor-header">
                <span>main.cpp</span>

                <span>
                  ⏱ {selectedAssignment.time_limit}s
                </span>
              </div>

              <textarea
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                spellCheck="false"
              />

              <div className="editor-footer">

                <span>
                  C++ • AutoGrade
                </span>

                <button
                  className="submit-btn"
                  onClick={submitCode}
                  disabled={
                    result?.loading
                  }
                >
                  {result?.loading
                    ? "Running..."
                    : "▶ Submit Code"}
                </button>

              </div>

            </div>
          </div>

          {/* Result */}

          {result && !result.loading && (
            <div className="result-panel">

              <div className="result-header">
                <div>
                  <h2>Submission Result</h2>

                  <p>
                    Your code has been evaluated
                    against the test cases.
                  </p>
                </div>

                <div
                  className={
                    result.status === "Accepted"
                      ? "result-score accepted-score"
                      : "result-score failed-score"
                  }
                >
                  {result.score}/{result.total_points}
                </div>
              </div>

              <div className="status">
                {result.status === "Accepted"
                  ? "✓ Accepted"
                  : `✕ ${result.status}`}
              </div>

              {result.compile_error && (
                <pre className="error-box">
                  {result.compile_error}
                </pre>
              )}

              {result.results &&
                result.results.map((test) => (
                  <div
                    className="result-test"
                    key={test.test_case}
                  >
                    <div>
                      <strong>
                        Test Case {test.test_case}
                      </strong>

                      <small>
                        {test.execution_time}s
                      </small>
                    </div>

                    <span
                      className={
                        test.status === "Passed"
                          ? "passed"
                          : "failed"
                      }
                    >
                      {test.status}
                    </span>
                  </div>
                ))}

            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app">

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">A</div>

          <div>
            <h2>AutoGrade</h2>
            <span>Code Testing Engine</span>
          </div>
        </div>

        <nav>
          <button className="nav-item active">
            Dashboard
          </button>

          <button className="nav-item">
            Assignments
          </button>

          <button className="nav-item">
            Submissions
          </button>

          <button className="nav-item">
            Leaderboard
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">S</div>

            <div>
              <strong>Surendra</strong>
              <small>Student</small>
            </div>
          </div>
        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <div>
            <p className="welcome">
              Welcome back 👋
            </p>

            <h1>Dashboard</h1>
          </div>

          <div className="user-badge">
            Student
          </div>

        </header>

        <section className="stats">

          <div className="stat-card">
            <div className="stat-icon">📚</div>

            <div>
              <span>Assignments</span>
              <h2>{assignments.length}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚀</div>

            <div>
              <span>Submissions</span>
              <h2>0</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>

            <div>
              <span>Average Score</span>
              <h2>—</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>

            <div>
              <span>Best Runtime</span>
              <h2>—</h2>
            </div>
          </div>

        </section>

        <section className="assignments">

          <div className="section-header">

            <div>
              <h2>Available Assignments</h2>

              <p>
                Select an assignment to start coding.
              </p>
            </div>

          </div>

          <div className="assignment-list">

            {assignments.map((assignment) => (

              <div
                className="assignment-card"
                key={assignment.id}
              >

                <div className="assignment-top">

                  <span className="badge cpp">
                    {assignment.language.toUpperCase()}
                  </span>

                  <span className="points">
                    {assignment.total_points} Points
                  </span>

                </div>

                <h3>
                  {assignment.title}
                </h3>

                <p>
                  {assignment.description}
                </p>

                <div className="assignment-footer">

                  <span>
                    ⏱ {assignment.time_limit}s
                  </span>

                  <button
                    className="solve-btn"
                    onClick={() =>
                      openAssignment(
                        assignment.id
                      )
                    }
                  >
                    Solve →
                  </button>

                </div>

              </div>

            ))}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;