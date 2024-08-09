import React from "react";
import { useSelector } from "react-redux";
import { Container, Title, List, Divider, ActionIcon } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Question } from "../types.ts";
import { RootState } from "../Store.ts";

interface QuestionProps {
    questions: Question[],
    passwd: string
};

const QuestionWindow: React.FC<QuestionProps> = ({ questions, passwd }) => {
    const base = useSelector((state: RootState) => state.app.baseUrl);

    const handleDelete = async (id: number) => {
        try {
            const headers = {
                "Content-Type": "application/json",
                "X-TotallySecure": passwd
            }

            await fetch(`${base}/questions/${id}`, {
                method: "DELETE",
                headers: headers
            });
        } catch (err) {
            console.error(`Error deleting question: ${err}`);
        }
    }

    const deleteBtnHandler = (id: number) => () => {
        handleDelete(id);
    }

    return (
        <Container>
            <Title order={4}>Questions</Title>
            <Divider my="md" />
            <List center>
                {questions.map((question, idx: number) => (
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
