import React from "react";
import { Title, List, Divider, Button } from "@mantine/core";
import { Response } from "../types.ts";

interface ResponsesProps {
    responses: Response[] | null,
    onSendMessage: (message: object) => void
}

const Responses: React.FC<ResponsesProps> = ({ responses, onSendMessage }) => {
    const handleClear = () => {
        const message = {
            "type": "delete",
            "resource": "feedback",
            "id": null,
            "data": null
        };

        onSendMessage(message);
    }

    return (
        <div>
            <Title order={4}>Responses</Title>
            <Divider my="md" />
            <List center >
                {responses?.map((resp, idx: number) => (
                    <List.Item
                        style={{ listStyleType: "none" }}
                        key={idx}>
                        {resp.student}: {resp.feedback}
                    </List.Item>
                ))}
            </List>
            <Button variant="outline" onClick={handleClear}>Clear</Button>
        </div>
    )
}

export default Responses;
