import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Group } from "@mantine/core";
import { IconPlayerPlay, IconPlayerPause, IconPlayerStop, IconPlayerTrackNext } from "@tabler/icons-react";
import FeedbackBtn from "./FeedbackBtn";
import { RootState } from "../Store.ts";
import { notifyError } from "./Notification.tsx";

interface FeedbackProps {
    onSendMessage: (message: object) => void;
}

const Feedback: React.FC<FeedbackProps> = ({ onSendMessage }) => {
    const name = useSelector((state: RootState) => state.app.name);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const responses = ["I'm on track", "Please slow down", "I'm lost", "Please go faster"];

    const handleResponse = useCallback((response: number) => () => {
        if (name.trim() === "") {
            notifyError("Your name is empty");
            return;
        }

        const message = {
            "type": "new",
            "resource": "feedback",
            "id": null,
            "data": {
                "student": name,
                "feedback": responses[response]
            }
        };

        onSendMessage(message);
        setHighlighted(response);
    }, [name]);

    return (
        <Group justify="center" gap="xl" >

            <FeedbackBtn
                id={3}
                highlighted={highlighted}
                clickHandler={handleResponse(3)}
                color="blue"
                text="I would like to move faster."
                Icon={IconPlayerTrackNext} />

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

        </Group>
    )
}

export default Feedback;
