import React from "react";
import {
    ActionIcon,
    Group,
    Text
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Question } from "../types";

interface LineItemProps {
    question: Question;
    handleDelete: (id: number) => void;
}

const LineItem: React.FC<LineItemProps> = ({ question, handleDelete }) => {
    const time = new Date(question.timestamp)
    return (
        <Group justify="space-between" mx="0" my="1">
            <ActionIcon variant="outline" onClick={handleDelete(question.id)}>
                <IconTrash />
            </ActionIcon>
            <Text>{question.student}: {question.question}</Text>
            <Text>{time.toLocaleTimeString()}</Text>
        </Group>
    )
}

export default LineItem;
