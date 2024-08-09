import React from "react";
import { useSelector } from "react-redux";
import { Title, List, Divider, Button } from "@mantine/core";
import { Response } from "../types.ts";
import { RootState } from "../Store.ts";

interface ResponsesProps {
    responses: Response[],
    passwd: string
}

const Responses: React.FC<ResponsesProps> = ({ responses, passwd }) => {
    const base = useSelector((state: RootState) => state.app.baseUrl);

    const handleClear = () => {
        fetch(`${base}/reset`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-TotallySecure": passwd
            }
        });
    }

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
            <Button variant="outline" onClick={handleClear}>Clear</Button>
        </div>
    )
}

export default Responses;
