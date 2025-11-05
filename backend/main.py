from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ConnectionManager import ConnectionManager
import json
import os
from dotenv import load_dotenv


load_dotenv()
# Hardcoded teacher password - change this to your desired password
TEACHER_PASSWORD = os.getenv("TEACHER_PASSWORD", "classroom123")

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


@app.websocket("/ws/student")
async def student_websocket(websocket: WebSocket):
    client_id = await manager.connect_student(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.process_message(message)
    except WebSocketDisconnect:
        # finally branch handles all disconnects, but this is required to prevent WebSocketDisconnect errors from bubbling up
        pass
    finally:
        manager.disconnect_student(client_id)


@app.websocket("/ws/teacher")
async def teacher_websocket(websocket: WebSocket):
    password = websocket.query_params.get('password')

    if not password:
        raise HTTPException(status_code=401, detail="Password missing")

    if password != TEACHER_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")

    client_id = await manager.connect_teacher(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.process_message(message)
    except WebSocketDisconnect:
        # finally branch handles all disconnects, but this is required to prevent WebSocketDisconnect errors from bubbling up
        pass
    finally:
        manager.disconnect_teacher(client_id)


@app.websocket("/ws/test")
async def test_ws(websocket: WebSocket):
    client_id = await manager.connect_teacher(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.process_message(message)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect_teacher(client_id)
