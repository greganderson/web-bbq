import { useDispatch, useSelector } from "react-redux";
import { Container, TextInput, ThemeIcon } from "@mantine/core";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { IconPlug, IconPlugOff } from "@tabler/icons-react";
import { notifyError } from "../Components/Notification.tsx";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import Feedback from "../Components/Feedback";
import Questions from "../Components/Questions";
import { RootState, setName } from "../Store";

function Student() {
    const dispatch = useDispatch();
    const name = useSelector((state: RootState) => state.app.name);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const { sendMessage, readyState } = useWebSocket(`${baseWS}/ws/student`);
    const isConnected = readyState === ReadyState.OPEN;
    const iconRef = useRef<HTMLDivElement | null>(null);
    const animRef = useRef<GSAPTween | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        dispatch(setName(newName));
    }

    const handleSendMessage = (message: object) => {
        if (!isConnected) {
            notifyError("Not connected to server. Please refresh and try again.");
            return;
        }
        sendMessage(JSON.stringify(message));
    }

    useGSAP(() => {
        if (!iconRef.current) return;

        animRef.current?.kill();
        gsap.set(iconRef.current, { rotation: 0 });

        if (!isConnected) {
            animRef.current = gsap.fromTo(iconRef.current, {
                rotation: -7
            }, {
                duration: 0.1,
                repeat: -1,
                yoyo: true,
                rotation: 7,
                ease: "linear"
            });
        }

        return () => {
            animRef.current?.kill();
            gsap.set(iconRef.current, { rotation: 0 });
        }
    }, [isConnected]);

    return (
        <Container size="xs" className="blurred">
            <ThemeIcon variant="outline" color={isConnected ? "green" : "red"} ref={iconRef}>
                {isConnected ? <IconPlug /> : <IconPlugOff />}
            </ThemeIcon>
            <TextInput
                label="Name"
                value={name}
                onChange={handleNameChange} />
            <Feedback
                onSendMessage={handleSendMessage} />
            <Questions
                onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Student;
