import React from "react";
import { Title, List, Divider } from "@mantine/core";
import { Response } from "../types.ts";

interface ResponsesProps {
    responses: Response[]
}

const Responses: React.FC<ResponsesProps> = ({ responses }) => {
    return (
        <div>
            <Title order={4}>Responses</Title>
            <Divider my="md" />
            <List center >
                {responses.map((resp, idx: number) => (
                    <List.Item
                        style={{ listStyleType: "none" }}
                        key={idx}>
                        {resp.student}: {resp.message}
                    </List.Item>
                ))}
            </List>
        </div>
    )
}

export default Responses;
