import React from "react";
import { Container, Title, List, Divider, ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
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
                        <ActionIcon variant="outline" onClick={deleteBtnHandler(question.id)}>
                            <IconTrash />
                        </ActionIcon>
                        {question.student}: {question.question}
                    </List.Item>
                ))}
            </List>
        </Container>
    )
}

export default QuestionWindow;
