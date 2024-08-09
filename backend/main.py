from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from redis import asyncio as aioredis
from uuid import uuid4
import hashlib
import json
import os


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
PROD = os.getenv("REDIS_URL")

def passwd_check(pwd):
    bytestr = pwd.encode("utf-8")
    hashed = hashlib.sha256(bytestr).hexdigest()
    return hashed

async def get_redis():
    redis = await aioredis.from_url(PROD, decode_responses = True)
    try:
        yield redis
    finally:
        await redis.close()

@app.get("/", status_code = 200)
async def root_check() -> None:
    """
    Root endpoint to satisfy Beanstalk health check
    """
    return "Check /docs for endpoints."

@app.post("/bbbq", status_code = 201, tags = ["student"])
async def update_status(message: dict, redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    Student can let instructor know how they're doing with the lecture (good, slow down, explain something).
    """
    msg_json = json.dumps(message)
    await redis.rpush("updates", msg_json)

@app.post("/questions", status_code = 201, tags = ["student"])
async def ask_question(question: dict, redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    For students to ask a question.
    """
    new_id = str(uuid4())
    question["id"] = new_id
    question_json = json.dumps(question)
    await redis.rpush("questions", question_json)

@app.post("/line", status_code = 201, tags = ["student"])
async def line_up(student: str, redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    Allows student to queue up for help.
    """
    await redis.rpush("line", student)

@app.get("/teacher", tags = ["teacher"])
async def update_teacher(req: Request, redis: aioredis.Redis = Depends(get_redis)) -> dict:
    """
    Log in as the teacher to view lecture updates, questions, and help line.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code = 401, detail = "Unauthorized")

    updates_json = await redis.lrange("updates", 0, -1)
    questions_json = await redis.lrange("questions", 0, -1)
    line = await redis.lrange("line", 0, -1)

    updates = [json.loads(update) for update in updates_json]
    questions  = [json.loads(question) for question in questions_json]

    return {
        "updates": updates,
        "questions": questions,
        "line": line
    }

# TODO: Change to POST
@app.delete("/reset", status_code = 200, tags = ["teacher"])
async def clear_updates(req: Request, redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    Delete all updates.
    """
    header = "X-TotallySecure"
    if header not in req.headers or passwd_check(req.headers[header]) != PASSWD:
        raise HTTPException(status_code = 401, detail = "Unauthorized")
    await redis.delete("updates")

@app.delete("/questions/{qid}", tags = ["teacher", "student"])
async def delete_question(qid: str, redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    For teacher to remove a question after answering. Also for students to retract their own answer.
    """
    questions_json = await redis.lrange("questions", 0, -1)
    questions = [json.loads(question) for question in questions_json]

    for q in range(len(questions)):
        if questions[q]["id"] == qid:
            await redis.lset("questions", q, "DeleteMe")
            await redis.lrem("questions", 1, "DeleteMe")

# TODO: Change to POST?
@app.delete("/line", tags = ["teacher"])
async def help_next(redis: aioredis.Redis = Depends(get_redis)) -> None:
    """
    Help the next person in line. Deletes first student from the line.
    """
    await redis.lpop("line", 1)
