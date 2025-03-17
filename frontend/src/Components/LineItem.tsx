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
    deleteBtn: () => void;
}

const LineItem: React.FC<LineItemProps> = ({ question, deleteBtn }) => {
    const time = new Date(question.timestamp)
    return (
        <Group justify="space-between" mx="0" my="xs">
            <ActionIcon variant="outline" onClick={deleteBtn}>
                <IconTrash />
            </ActionIcon>
            <Text w="80%" p="0"><strong>{question.student}:</strong> {question.question}</Text>
            <Text p="0">{time.toLocaleTimeString()}</Text>
        </Group>
    )
}

export default LineItem;
