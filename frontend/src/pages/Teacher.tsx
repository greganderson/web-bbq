import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Button, Container, Group, ThemeIcon, Tooltip } from "@mantine/core";
import { IconPlug, IconPlugOff } from "@tabler/icons-react";
import Responses from "../Components/Responses";
import QuestionWindow from "../Components/QuestionWindow";
import { RootState } from "../Store";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Response, Question, WebsocketResponse } from "../types";
import Login from "../Components/teacher/Login";
import { notifyError } from "../Components/Notification";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

function Teacher() {
    const [updates, setUpdates] = useState<Response[] | null>(null);
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<WebsocketResponse>(wsUrl, {
        onError: () => {
            notifyError("Failed to connect. Please check your password and try again.");
            setLoggedIn(false);
            setWsUrl(null);
        },
        shouldReconnect: () => loggedIn,
    });
    const isConnected = readyState === ReadyState.OPEN;
    const iconRef = useRef<HTMLDivElement | null>(null);
    const animRef = useRef<GSAPTween | null>(null);

    const handleSendMessage = (message: object) => {
        sendMessage(JSON.stringify(message));
    }

    const handleLogin = (password: string) => {
        const url = `${baseWS}/ws/teacher?password=${encodeURIComponent(password)}`;
        setWsUrl(url);
        setLoggedIn(true);
    }

    const handleLogout = () => {
        setLoggedIn(false);
        setWsUrl(null);
        setUpdates(null);
        setQuestions(null);
    }

    useEffect(() => {
        if (lastJsonMessage != null) {
            setUpdates(lastJsonMessage.data[0]);
            setQuestions(lastJsonMessage.data[1]);
        }
    }, [lastJsonMessage]);

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
        <Container size="xl" className="blurred">
            <Group justify="space-between">
                {
                    isConnected ?
                        <Tooltip label="Connected" color="gray">
                            <ThemeIcon variant="outline" color="green" ref={iconRef}>
                                <IconPlug />
                            </ThemeIcon>
                        </Tooltip> :
                        <Tooltip label="Disconnected" color="gray">
                            <ThemeIcon variant="outline" color="red" ref={iconRef}>
                                <IconPlugOff />
                            </ThemeIcon>
                        </Tooltip>
                }
                {loggedIn ? (
                    <Button onClick={handleLogout} variant="outline">Logout</Button>
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </Group>
            <Container mt="xs" mb="xs" fluid>
                <Responses responses={updates} onSendMessage={handleSendMessage} />
            </Container>
            <QuestionWindow questions={questions} onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Teacher;
