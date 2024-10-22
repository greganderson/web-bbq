import { useState } from "react";
import { useSelector } from "react-redux";
import { Textarea, Button } from "@mantine/core";
import { RootState } from "../Store.ts";
import { notifyError } from "./Notification.tsx";

interface QuestionsProps {
    onSendMessage: (message: object) => void;
}

const Questions: React.FC<QuestionsProps> = ({ onSendMessage }) => {
    const [questionInput, setQuestionInput] = useState("");
    const name = useSelector((state: RootState) => state.app.name);

    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuestionInput(e.target.value);
    }

    const handleQuestion = () => {
        if (questionInput === "" || name === "") {
            notifyError("Your name or question is empty");
            return;
        }

        const message = {
            "type": "new",
            "resource": "question",
            "id": null,
            "data": {
                "student": name,
                "question": questionInput
            }
        }

        onSendMessage(message);
        setQuestionInput("");
    }

    return (
        <>
            <Textarea
                label="Question"
                value={questionInput}
                onChange={handleQuestionChange} />

            <Button mt="xs" variant="outline" onClick={handleQuestion}>Submit Question</Button>
        </>
    )
}

export default Questions;
