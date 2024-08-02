from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import hashlib


tags_metadata = [
    {
        "name": "teacher",
        "description": "Operations to be performed by the teacher or from the teacher app."
    },
    {
        "name": "student",
        "description": "Operations to be performed by the student app."
    }
]
app = FastAPI(openapi_tags = tags_metadata)

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

PASSWD = "c963ca56d7ee4d9ef16e856f2d47cb148acc9618d6c401eccb391bdea0dd8dd2"

updates: list[dict[str, str]] = []
questions: list[dict[str, str | int]] = []
line: list = []

def passwd_check(pwd):
    bytestr = pwd.encode("utf-8")
    hashed = hashlib.sha256(bytestr).hexdigest()
    return hashed

def next_id(lst):
    try:
        return max(i["id"] for i in lst)
    except:
        return 0

@app.post("/bbbq", status_code = 201, tags = ["student"])
async def update_status(message: dict) -> None:
    """
    Student can let instructor know how they're doing with the lecture (good, slow down, explain something).
    """
    updates.append(message)

@app.post("/questions", status_code = 201, tags = ["student"])
async def ask_question(question: dict) -> None:
    """
    For students to ask a question.
    """
    new_id = next_id(questions) + 1
    question["id"] = new_id
    questions.append(question)

@app.post("/line", status_code = 201, tags = ["student"])
async def line_up(student: str) -> None:
    """
    Allows student to queue up for help.
    """
    line.append(student)

@app.get("/teacher", tags = ["teacher"])
async def update_teacher(req: Request) -> dict:
    """
    Log in as the teacher to view lecture updates, questions, and help line.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code = 401, detail = "Unauthorized")
    return {
        "updates": updates,
        "questions": questions,
        "line": line
    }

@app.delete("/reset", status_code = 200, tags = ["teacher"])
async def clear_updates(req: Request) -> None:
    """
    Delete all updates, questions, and lines.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code = 401, detail = "Unauthorized")
    updates.clear()

@app.delete("/questions/{qid}", tags = ["teacher", "student"])
async def delete_question(qid: int) -> None:
    """
    For teacher to remove a question after answering. Also for students to retract their own answer.
    """
    for q in range(len(questions)):
        if questions[q]["id"] == qid:
            questions.pop(q)

@app.delete("/line", tags = ["teacher"])
async def help_next() -> None:
    """
    Help the next person in line. Deletes first student from the line.
    """
    line.pop(0)
