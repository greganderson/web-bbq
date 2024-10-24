import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, Group, ThemeIcon, Tooltip } from "@mantine/core";
import { IconPlug, IconPlugOff } from "@tabler/icons-react";
import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import { RootState } from "./Store";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Response, Question, WebsocketResponse } from "./types";
import Login from "./Components/teacher/Login";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.ts";

function Teacher() {
    const [updates, setUpdates] = useState<Response[] | null>(null);
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const url = `${baseWS}/ws/teacher`;
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<WebsocketResponse>(loggedIn ? url : null);
    const isConnected = readyState === ReadyState.OPEN;

    const handleSendMessage = (message: object) => {
        sendMessage(JSON.stringify(message));
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoggedIn(!!user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (lastJsonMessage != null) {
            console.log(lastJsonMessage);
            setUpdates(lastJsonMessage.data[0]);
            setQuestions(lastJsonMessage.data[1]);
        }
    }, [lastJsonMessage]);

    return (
        <Container size="xs">
            <Group justify="space-between">
                {
                    isConnected ?
                        <Tooltip label="Connected" color="gray">
                            <ThemeIcon variant="outline">
                                <IconPlug />
                            </ThemeIcon>
                        </Tooltip> :
                        <Tooltip label="Disconnected" color="gray">
                            <ThemeIcon variant="outline">
                                <IconPlugOff />
                            </ThemeIcon>
                        </Tooltip>
                }
                <Login />
            </Group>
            <Container mt="xs" mb="xs">
                <Responses responses={updates} onSendMessage={handleSendMessage} />
            </Container>
            <QuestionWindow questions={questions} onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Teacher;
