from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ConnectionManager import ConnectionManager
import json
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth


load_dotenv()
firebase_config = os.getenv("FIREBASE_ADMIN_CONFIG")
if firebase_config:
    cred = credentials.Certificate(json.loads(firebase_config))
    firebase_admin.initialize_app(cred)
else:
    cred = credentials.Certificate("./firebase-admin.json")
    firebase_admin.initialize_app(cred)

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
    token = websocket.query_params.get('token')

    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        identity = auth.verify_id_token(token)
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
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
