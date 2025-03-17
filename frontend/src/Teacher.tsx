import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Button, Container, Group, ThemeIcon, Tooltip } from "@mantine/core";
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
    const [wsUrl, setWsUrl] = useState<string | null>(null);
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<WebsocketResponse>(wsUrl);
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
        if (loggedIn) {
            const user = auth.currentUser;
            if (user) {
                user.getIdToken().then((idToken) => {
                    const url = `${baseWS}/ws/teacher?token=${idToken}`;
                    setWsUrl(url);
                });
            }
        } else {
            setWsUrl(null);
        }
    }, [loggedIn, baseWS]);

    useEffect(() => {
        if (lastJsonMessage != null) {
            setUpdates(lastJsonMessage.data[0]);
            setQuestions(lastJsonMessage.data[1]);
        }
    }, [lastJsonMessage]);

    const handleDownloadToken = () => {
        const user = auth.currentUser;
        if (user) {
            user.getIdToken().then((idToken) => {
                const jsonContent = {
                    firebase_token: idToken,
                    user_id: user.uid
                };

                const blob = new Blob([JSON.stringify(jsonContent)], { type: 'application/json' });

                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'firebase-token.json';
                a.click();
            }).catch((error) => {
                console.error('Error getting ID token:', error);
            });
        }
    };

    return (
        <Container size="xl" className="blurred">
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
                {loggedIn && <Button onClick={handleDownloadToken} variant="outline">Download Token</Button>}
            </Group>
            <Container mt="xs" mb="xs" fluid>
                <Responses responses={updates} onSendMessage={handleSendMessage} />
            </Container>
            <QuestionWindow questions={questions} onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Teacher;
