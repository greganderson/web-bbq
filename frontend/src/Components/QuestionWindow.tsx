import React from "react";
import { Container, Title, List, Divider } from "@mantine/core";
import LineItem from "./LineItem";
import { Question } from "../types.ts";

interface QuestionProps {
    questions: Question[] | null,
    onSendMessage: (message: object) => void
}

const QuestionWindow: React.FC<QuestionProps> = ({ questions, onSendMessage }) => {

    const handleDelete = async (id: number) => {
        const message = {
            "type": "delete",
            "resource": "question",
            "id": id,
            "data": null
        }

        onSendMessage(message);
    }

    const deleteBtnHandler = (id: number) => () => {
        handleDelete(id);
    }

    return (
        <Container>
            <Title order={4}>Questions</Title>
            <Divider my="md" />
            <List center>
                {questions?.map((question, idx: number) => (
                    <List.Item
                        style={{ listStyleType: "none" }}
                        key={idx}>
                        <LineItem question={question} handleDelete={deleteBtnHandler} />
                    </List.Item>
                ))}
            </List>
        </Container>
    )
}

export default QuestionWindow;
