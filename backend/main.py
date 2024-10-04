from contextlib import asynccontextmanager
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import asyncio
import hashlib
import json
import uvicorn
import threading


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    for client_queue in clients:
        client_queue.cancel()
    await asyncio.gather(*clients, return_exceptions=True)

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

app = FastAPI(openapi_tags=tags_metadata, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PASSWD = "c963ca56d7ee4d9ef16e856f2d47cb148acc9618d6c401eccb391bdea0dd8dd2"
HEADER = "X-TotallySecure"

updates: list[dict[str, str]] = []
questions: list[dict[str, str | int]] = []
line: list = []
clients = []
shutdown_event = asyncio.Event()

async def broadcast(data: str):
    for client in clients:
        await client.put(data)


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

    response.set_cookie(key = "auth", value = PASSWD, httponly = True, samesite = "None", secure = False)
    return {"message": "Cookie set"}


@app.post("/bbbq", status_code=201, tags=["student"])
async def update_status(message: dict) -> None:
    """
    Student can let instructor know how they're doing with the lecture (good, slow down, explain something).
    """
    updates.append(message)

    msg = json.dumps({"type": "bbbq", "data": updates})
    for client_queue in clients:
        await client_queue.put(msg)


@app.post("/questions", status_code=201, tags=["student"])
async def ask_question(question: dict, background_tasks: BackgroundTasks) -> None:
    """
    For students to ask a question.
    """
    new_id = next_id(questions) + 1
    question["id"] = new_id
    questions.append(question)

    message = json.dumps({"type": "question", "data": questions})
    background_tasks.add_task(broadcast, message)


@app.post("/line", status_code=201, tags=["student"])
async def line_up(student: str) -> None:
    """
    Allows student to queue up for help.
    """
    line.append(student)

    message = json.dumps({ "type": "line", "data": line})
    for client_queue in clients:
        await client_queue.put(message)


@app.get("/teacher", tags=["teacher"])
async def update_teacher(req: Request) -> dict:
    """
    Log in as the teacher to view lecture updates, questions, and help line.
    """
    if HEADER not in req.headers or passwd_check(req.headers[HEADER]) != PASSWD:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {"updates": updates, "questions": questions, "line": line}


@app.get("/sse", tags=["teacher"])
async def sse(request: Request):
    cookie = request.cookies.get("auth")
    if cookie != PASSWD:
        raise HTTPException(status_code = 401, detail = "Unauthorized")

    client_queue = asyncio.Queue()
    clients.append(client_queue)

    async def event_generator():
        try:
            while True:
                data = await client_queue.get()
                if data is None:
                    break
                yield {"data": data}
                await asyncio.sleep(0.2)
        except asyncio.CancelledError as e:
            print(f"Disconnected from client {request.client}")
            raise e
        finally:
            clients.remove(client_queue)

    return EventSourceResponse(event_generator())


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

            message = {
                "type": "question_removed",
                "id": qid,
            }

            for client_queue in clients:
                await client_queue.put(message)

            return

# TODO: Change to POST?
@app.delete("/line", tags=["teacher"])
async def help_next() -> None:
    """
    Help the next person in line. Deletes first student from the line.
    """
    line.pop(0)

async def notify_shutdown():
    shutdown_msg = json.dumps({"type": "shutdown", "message": "Server shutting down"})
    for client_queue in clients:
        await client_queue.put(shutdown_msg)
        await client_queue.put(None)

async def trigger_shutdown():
    await notify_shutdown()
    shutdown_event.set()
    print(f"shutdown_event is {shutdown_event.is_set()}")

if __name__ == "__main__":
    config = uvicorn.Config("main:app", loop="asyncio")
    server = uvicorn.Server(config)

    server.run()
