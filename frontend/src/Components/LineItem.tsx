import React from "react";
import {
    ActionIcon,
    Box,
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
        <Group justify="space-between" mx="0" my="xs">
            <ActionIcon variant="outline" onClick={handleDelete(question.id)}>
                <IconTrash />
            </ActionIcon>
            <Text w="80%" p="0"><strong>{question.student}:</strong> {question.question}</Text>
            <Text p="0">{time.toLocaleTimeString()}</Text>
        </Group>
    )
}

export default LineItem;
