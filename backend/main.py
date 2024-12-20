from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ConnectionManager import ConnectionManager
import json


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # if cookies don't work then specify origin
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

updates: list[dict[str, str]] = []
questions: list[dict[str, str | int]] = []
line: list = []
manager = ConnectionManager()


@app.get("/", status_code=200)
async def root_check() -> str:
    return "Check /docs for endpoints."


@app.get("/coffee", status_code=418)
async def brew_coffee() -> str:
    return "I'm a little teapot, short and stout."


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
