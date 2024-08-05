import React from "react";
import { useSelector } from "react-redux";
import { Title, List, Divider, ScrollArea, Button } from "@mantine/core";
import { RootState } from "../Store.ts";

interface LineProps {
    line: string[],
    update: () => void,
}

const Line: React.FC<LineProps> = ({ line, update }) => {
    const base = useSelector((state: RootState) => state.app.baseUrl);

    const handleHelpNext = () => {
        fetch(`${base}/line`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });

        update();
    }

    return (
        <div>
            <Title order={4}>Line</Title>
            <Divider my="md" />
            <ScrollArea h={75}>
                <List center>
                    {line.map((next: string, idx: number) => (
                        <List.Item
                            style={{ listStyleType: "none" }}
                            key={idx}>
                            {next}
                        </List.Item>
                    ))}
                </List>
            </ScrollArea>
            <Button variant="outline" onClick={handleHelpNext}>Help Next</Button>
        </div>
    )
}

export default Line;
