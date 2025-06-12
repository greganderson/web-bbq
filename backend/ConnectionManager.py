from fastapi import WebSocket
from datetime import datetime
from zoneinfo import ZoneInfo
import json
import uuid

# Feedback {
#     student: string,
#     feedback: string,
# }
# Question {
#     id: string (set by server),
#     student: string,
#     question: string,
# }
# Message Format:
#     type: init | delete | new | update
#         - init: message sent on first connect
#         - delete: specify resource to delete from
#         - new: specify a new resource to add
#         - update: specify an update in queues
#     resource: feedback | question | None
#         - feedback: specifies the queue for lecture feedback
#         - question: specifies the queue for student questions
#         - None: for init or update when all resources are affected
#     id: int | None
#         - int: specifies the question or feedback to remove
#         - None: no specific question or feedback specified
#     data: [feedback[] & questions[]] | Feedback | Question | None:
#         - For sending:
#             - an array of feedback to send depending on specified resource
#             - alphabetically ordered
#         - For receiving:
#             - data for the resource that is being created

class ConnectionManager:

    def __init__(self):
        self.teachers: dict[str, WebSocket] = {}
        self.students: dict[str, WebSocket] = {}
        self.feedback: list[dict[str, str]] = []
        self.questions: list[dict[str, str | int]] = []

    async def connect_teacher(self, websocket: WebSocket):
        await websocket.accept()
        client_id = str(uuid.uuid4())[:8]
        self.teachers[client_id] = websocket
        await self.update_teachers(websocket)
        return client_id

    async def connect_student(self, websocket: WebSocket):
        await websocket.accept()
        client_id = str(uuid.uuid4())[:8]
        self.students[client_id] = websocket
        return client_id

    def disconnect_teacher(self, client_id: str):
        self.teachers.pop(client_id, None)

    def disconnect_student(self, client_id: str):
        self.students.pop(client_id, None)

    def delete(self, resource, ID = -1):
        """
        Delete the specified question or clear student feedback
        """
        if resource == "question":
            for i in range(len(self.questions)):
                if ID == self.questions[i]["id"]:
                    self.questions.pop(i)
                    return
        elif resource == "feedback":
            self.feedback.clear()

    def update_feedback(self, response):
        """
        Update the lecture feedback per student rather than add multiple entries for the same student.
        """
        for i in range(len(self.feedback)):
            if self.feedback[i]["student"] == response["student"]:
                self.feedback[i] = response
                return
        else:
            self.feedback.append(response)

    async def update_teachers(self, connection = None):
        """
        Send response updates to all teachers and send all responses to new teacher connections
        """
        updates = {
            "type": "update",
            "resource": None,
            "id": None,
            "data": [self.feedback, self.questions]
        }
        message = json.dumps(updates)

        if connection is None:
            for teacher in self.teachers:
                await teacher.send_text(message)
        else:
            await connection.send_text(message)
    
    async def process_message(self, message: dict):
        """
        Process websocket connections according to the message format
        """
        if message["type"] == "delete":
            if message["resource"] == "feedback": 
                self.delete("feedback")
            elif message["resource"] == "question":
                self.delete("question", message["id"])
        elif message["type"] == "new":
            if message["resource"] == "feedback":
                self.update_feedback(message["data"])
            if message["resource"] == "question":
                small = str(uuid.uuid4())[:8]
                mountain_time = ZoneInfo("America/Denver")
                timestamp = datetime.now(mountain_time).isoformat()
                message["data"]["id"] = small
                message["data"]["timestamp"] = timestamp
                self.questions.append(message["data"])
        else:
            print("Message unknown")
            print(message)
        
        await self.update_teachers()
