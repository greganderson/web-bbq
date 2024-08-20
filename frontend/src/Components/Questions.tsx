import { useState } from "react";
import { useSelector } from "react-redux";
import { Textarea, Button } from "@mantine/core";
import Notification, { notifyError } from "./Notification";
import { RootState } from "../Store.ts";

function Questions() {
    const [questionInput, setQuestionInput] = useState("");
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const name = useSelector((state: RootState) => state.app.name);

    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuestionInput(e.target.value);
    }

    const handleQuestion = () => {
        if (questionInput === "") return;
        if (name === "") return;

        fetch(`${base}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ student: name, question: questionInput })
        }).then((response) => {
            if (response.status === 409) {
                notifyError("You are already in line");
            } else {
                setQuestionInput("");
            }
        }).catch(error => {
            notifyError(error.message);
        })
    }

    return (
        <>
            <Textarea
                label="Question"
                value={questionInput}
                onChange={handleQuestionChange} />

            <Button mt="xs" variant="outline" onClick={handleQuestion}>Submit Question</Button>
            <Notification />
        </>
    )
}

export default Questions;
