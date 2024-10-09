from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ConnectionManager import ConnectionManager
import hashlib
import json


tags_metadata = [
    {
        "name": "teacher",
        "description": "Operations to be performed by the teacher or from the teacher app.",
    },
    {
        "name": "student",
        "description": "Operations to be performed by the student app.",
    },
]
app = FastAPI(openapi_tags=tags_metadata)

app.add_middleware(
    CORSMiddleware,
    # if cookies don't work then specify origin
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PASSWD = "c963ca56d7ee4d9ef16e856f2d47cb148acc9618d6c401eccb391bdea0dd8dd2"
HEADER = "X-TotallySecure"

updates: list[dict[str, str]] = []
questions: list[dict[str, str | int]] = []
line: list = []
manager = ConnectionManager()


def passwd_check(pwd):
    bytestr = pwd.encode("utf-8")
    hashed = hashlib.sha256(bytestr).hexdigest()
    return hashed


def next_id(lst):
    try:
        return max(i["id"] for i in lst)
    except:
        return 0


@app.get("/", status_code=200)
async def root_check() -> str:
    """
    Root endpoint to satisfy Beanstalk health check
    """
    return "Check /docs for endpoints."


@app.get("/coffee", status_code=418)
async def brew_coffee() -> str:
    return "I'm a little teapot, short and stout."


@app.post("/login", tags=["teacher"])
async def login(response: Response, request: Request):
    if HEADER not in request.headers or passwd_check(request.headers[HEADER]) != PASSWD:
        raise HTTPException(status_code=401, detail="Unauthorized")

    response.set_cookie(key="auth", value=PASSWD, httponly=True, samesite="None", secure="False")
    return {"message": "Cookie set"}


@app.post("/bbbq", status_code=201, tags=["student"])
async def update_status(message: dict) -> None:
    """
    Student can let instructor know how they're doing with the lecture (good, slow down, explain something).
    """
    updates.append(message)


@app.post("/questions", status_code=201, tags=["student"])
async def ask_question(question: dict) -> None:
    """
    For students to ask a question.
    """
    for i in questions:
        if i["student"] == question["student"]:
            raise HTTPException(status_code = 409, detail = "Student already in line.")
    new_id = next_id(questions) + 1
    questions.append(question)
    question["id"] = new_id


@app.get("/teacher", tags=["teacher"])
async def update_teacher(req: Request) -> dict:
    """
    Log in as the teacher to view lecture updates, questions, and help line.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {"updates": updates, "questions": questions, "line": line}


# TODO: Change to POST
@app.delete("/reset", status_code=200, tags=["teacher"])
async def clear_updates(req: Request) -> None:
    """
    Delete all updates.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    updates.clear()


@app.delete("/questions/{qid}", tags=["teacher", "student"])
async def delete_question(qid: str) -> None:
    """
    For teacher to remove a question after answering. Also for students to retract their own answer.
    """
    for q in range(len(questions)):
        if questions[q]["id"] == int(qid):
            questions.pop(q)


# TODO: Change to POST?
@app.delete("/line", tags=["teacher"])
async def help_next() -> None:
    """
    Help the next person in line. Deletes first student from the line.
    """
    line.pop(0)


@app.websocket("/ws/student")
async def student_websocket(websocket: WebSocket):
    await manager.connect_student(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.process_message(message)
    except WebSocketDisconnect:
        manager.disconnect_student(websocket)


@app.websocket("/ws/teacher")
async def teacher_websocket(websocket: WebSocket):
    await manager.connect_teacher(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.process_message(message)
    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket)