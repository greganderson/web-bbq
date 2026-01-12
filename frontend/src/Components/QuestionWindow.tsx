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

    return (
        <Container fluid>
            <Title order={4}>Questions</Title>
            <Divider my="md" />
            <List center>
                {questions?.map((question, idx: number) => (
                    <div key={idx}>
                        <List.Item style={{ listStyleType: "none" }} >
                            <LineItem question={question} deleteBtn={() => handleDelete(question.id)} />
                        </List.Item>
                        <Divider />
                    </div>
                ))}
            </List>
        </Container>
    )
}

export default QuestionWindow;
