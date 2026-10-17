from sqlalchemy import Column, Integer, String, Float
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey
from database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    language = Column(String, default="cpp")
    time_limit = Column(Float, default=2.0)
    total_points = Column(Integer, default=100)


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    points = Column(Integer, default=1)
    is_hidden = Column(Boolean, default=False)
    class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer)
    student_name = Column(String, default="Surendra")
    status = Column(String)
    score = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    execution_time = Column(Float, default=0)