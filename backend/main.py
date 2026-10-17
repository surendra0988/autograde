from models import Assignment, TestCase, Submission
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from database import engine, get_db, Base
from models import Assignment, TestCase
from grader import grade_cpp_code


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AutoGrade API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODELS
# ==========================================

class TestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    points: int
    is_hidden: bool = False


class AssignmentCreate(BaseModel):
    title: str
    description: str
    language: str = "cpp"
    time_limit: float = 2.0
    total_points: int
    test_cases: list[TestCaseCreate]


class CodeSubmission(BaseModel):
    assignment_id: int
    source_code: str


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message": "AutoGrade Backend is Running!"
    }


# ==========================================
# CREATE ASSIGNMENT
# ==========================================

@app.post("/assignments")
def create_assignment(
    assignment_data: AssignmentCreate,
    db: Session = Depends(get_db)
):

    assignment = Assignment(
        title=assignment_data.title,
        description=assignment_data.description,
        language=assignment_data.language,
        time_limit=assignment_data.time_limit,
        total_points=assignment_data.total_points
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    for test in assignment_data.test_cases:

        test_case = TestCase(
            assignment_id=assignment.id,
            input_data=test.input_data,
            expected_output=test.expected_output,
            points=test.points,
            is_hidden=test.is_hidden
        )

        db.add(test_case)

    db.commit()

    return {
        "message": "Assignment created successfully!",
        "assignment_id": assignment.id
    }


# ==========================================
# GET ALL ASSIGNMENTS
# ==========================================

@app.get("/assignments")
def get_assignments(
    db: Session = Depends(get_db)
):

    assignments = db.query(Assignment).all()

    return assignments


# ==========================================
# GET SINGLE ASSIGNMENT
# ==========================================

@app.get("/assignments/{assignment_id}")
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):

    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id
    ).first()

    if not assignment:
        return {
            "error": "Assignment not found"
        }

    test_cases = db.query(TestCase).filter(
        TestCase.assignment_id == assignment_id
    ).all()

    return {
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "language": assignment.language,
        "time_limit": assignment.time_limit,
        "total_points": assignment.total_points,
        "test_cases": test_cases
    }


# ==========================================
# SUBMIT CODE
# ==========================================

@app.post("/submit")
def submit_code(
    submission: CodeSubmission,
    db: Session = Depends(get_db)
):

    assignment = db.query(Assignment).filter(
        Assignment.id == submission.assignment_id
    ).first()

    if not assignment:
        return {
            "error": "Assignment not found"
        }

    test_cases = db.query(TestCase).filter(
        TestCase.assignment_id == submission.assignment_id
    ).all()

    test_data = []

    for test in test_cases:

        test_data.append({
            "input_data": test.input_data,
            "expected_output": test.expected_output,
            "points": test.points
        })

    result = grade_cpp_code(
        submission.source_code,
        test_data,
        assignment.time_limit
    )

    return {
        "assignment": assignment.title,
        "result": result
    }
@app.get("/submissions")
def get_submissions(db: Session = Depends(get_db)):
    submissions = db.query(Submission).order_by(
        Submission.id.desc()
    ).all()

    return [
        {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "student_name": submission.student_name,
            "status": submission.status,
            "score": submission.score,
            "total_points": submission.total_points,
            "execution_time": submission.execution_time
        }
        for submission in submissions
    ]