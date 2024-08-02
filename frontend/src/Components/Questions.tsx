import { useState } from "react";
import { useSelector } from "react-redux";
import { Textarea, Group, Button, ActionIcon, HoverCard, Text } from "@mantine/core";
import { IconHandStop } from "@tabler/icons-react";

function Questions() {
    const [questionInput, setQuestionInput] = useState("");
    const base = useSelector((state) => state.app.baseUrl);
    const name = useSelector((state) => state.app.name);

    const handleQuestionChange = (e) => {
        setQuestionInput(e.target.value);
    }

    const handleQuestion = () => {
        if (questionInput === "") return;

        fetch(`${base}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ student: name, question: questionInput })
        });
        setQuestionInput("");
    }

    const handleRaisedHand = () => {
        fetch(`${base}/line?student=${name}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        });
    }

    return (
        <>
            <Textarea
            label="Question"
            value={questionInput} 
            onChange={handleQuestionChange} />

            <Group justify="space-between">

                <HoverCard withd={180} shadow="md">
                    <HoverCard.Target>
                        <ActionIcon
                        variant="outline"
                        size="xl"
                        onClick={handleRaisedHand}>
                            <IconHandStop />
                        </ActionIcon>
                    </HoverCard.Target>
                    <HoverCard.Dropdown>
                        <Text size="xs">
                            I would like some help when the instructor is free.
                        </Text>
                    </HoverCard.Dropdown>
                </HoverCard>

                <Button variant="outline" onClick={handleQuestion}>Submit Question</Button>
            </Group>
        </>
    )
}

export default Questions;
