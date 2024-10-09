import { useState } from "react";
import { useSelector } from "react-redux";
import { Textarea, Button } from "@mantine/core";
import { notifyError } from "./Notification";
import { RootState } from "../Store.ts";

interface QuestionsProps {
    onSendMessage: (message: object) => void;
}

const Questions: React.FC<QuestionsProps> = ({ onSendMessage }) => {
    const [questionInput, setQuestionInput] = useState("");
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const name = useSelector((state: RootState) => state.app.name);

    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuestionInput(e.target.value);
    }

    const handleQuestion = () => {
        if (questionInput === "") return;
        if (name === "") return;

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
