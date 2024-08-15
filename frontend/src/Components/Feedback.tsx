import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Group } from "@mantine/core";
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop } from "@tabler/icons-react";
import FeedbackBtn from "./FeedbackBtn";
import Notification, { notifyError } from "./Notification";
import { RootState } from "../Store.ts";

function Feedback() {
    const name = useSelector((state: RootState) => state.app.name);
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const responses = ["Green", "Yellow", "Red"];

    const handleResponse = useCallback((response: number) => () => {
        fetch(`${base}/bbbq`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ student: name, message: responses[response] })
        }).catch(error => {
            console.error(`Error: ${error}`);
            notifyError(error.message);
        });
        setHighlighted(response);
    }, [name, base]);

    return (
        <Group justify="center" gap="xl" >

            <FeedbackBtn
                id={0}
                highlighted={highlighted}
                clickHandler={handleResponse(0)}
                color="green"
                text="I understand the concepts and this makes sense."
                Icon={IconPlayerPlay} />

            <FeedbackBtn
                id={1}
                highlighted={highlighted}
                clickHandler={handleResponse(1)}
                color="yellow"
                text="I'm having a little trouble following along and would like to slow down."
                Icon={IconPlayerPause} />

            <FeedbackBtn
                id={2}
                highlighted={highlighted}
                clickHandler={handleResponse(2)}
                color="red"
                text="I'm lost and would like to clarify some things."
                Icon={IconPlayerStop} />

            <Notification />
        </Group>
    )
}

export default Feedback;
