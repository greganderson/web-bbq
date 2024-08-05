import { useCallback } from "react";
import { useSelector } from "react-redux";
import { Group, ActionIcon, HoverCard, Text } from "@mantine/core";
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop } from "@tabler/icons-react";
import { RootState } from "../Store.ts";

function Feedback() {
    const name = useSelector((state: RootState) => state.app.name);
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const responses = ["Green", "Yellow", "Red"];

    const handleResponse = useCallback((response: number) => () => {
        console.log(`baseUrl: ${base}`);
        fetch(`${base}/bbbq`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ student: name, message: responses[response] })
        });
    }, [name, base]);

    return (
        <Group justify="center" gap="xl" >

            <HoverCard width={180} shadow="md">
                <HoverCard.Target>
                    <ActionIcon
                        onClick={handleResponse(0)}
                        variant="outline"
                        size="xl"
                        color="green">
                        <IconPlayerPlay />
                    </ActionIcon>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                    <Text size="xs">
                        I understand the concepts and this makes sense.
                    </Text>
                </HoverCard.Dropdown>
            </HoverCard>

            <HoverCard width={180} shadow="md">
                <HoverCard.Target>
                    <ActionIcon
                        onClick={handleResponse(1)}
                        variant="outline"
                        size="xl"
                        color="yellow">
                        <IconPlayerPause />
                    </ActionIcon>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                    <Text size="xs">
                        I'm having a little trouble following along and would like to slow down.
                    </Text>
                </HoverCard.Dropdown>
            </HoverCard>

            <HoverCard width={180} shadow="md">
                <HoverCard.Target>
                    <ActionIcon
                        onClick={handleResponse(2)}
                        variant="outline"
                        size="xl"
                        color="red">
                        <IconPlayerStop />
                    </ActionIcon>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                    <Text size="xs">
                        I'm lost and would like to clarify some things.
                    </Text>
                </HoverCard.Dropdown>
            </HoverCard>

        </Group>
    )
}

export default Feedback;
