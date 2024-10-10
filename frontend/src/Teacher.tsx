import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, PasswordInput, Button, ThemeIcon, Tooltip } from "@mantine/core";
import { IconPlug, IconPlugOff } from "@tabler/icons-react";

import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import { RootState } from "./Store";
import { notifyError, notifySuccess } from "./Components/Notification";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Response, Question, WebsocketResponse } from "./types";

function Teacher() {
    const [passwd, setPasswd] = useState("");
    const [updates, setUpdates] = useState<Response[] | null>(null);
    const [questions, setQuestions] = useState<Question[] | null>(null);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const url = `${baseWS}/ws/teacher`;
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<WebsocketResponse>(loggedIn ? url : null);
    const isConnected = readyState === ReadyState.OPEN;

    const headers = {
        "X-TotallySecure": passwd
    };

    const handlePasswdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswd(e.target.value);
    }

    const handleLogin = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
        e.preventDefault();
        const response = await fetch(`${base}/login`, {
            method: "POST",
            headers: headers,
            credentials: "include"
        });

        if (response.ok) {
            setLoggedIn(true);
            notifySuccess("You're logged in!");
            setPasswd("");
        } else {
            notifyError("Error logging in");
        }
    }

    const handleSendMessage = (message: object) => {
        sendMessage(JSON.stringify(message));
    }

    useEffect(() => {
        if (lastJsonMessage != null) {
            console.log(lastJsonMessage);
            setUpdates(lastJsonMessage.data[0]);
            setQuestions(lastJsonMessage.data[1]);
        }
    }, [lastJsonMessage]);

    return (
        <Container size="xs">
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
            <form onSubmit={handleLogin}>
                <PasswordInput
                    label="Password"
                    value={passwd}
                    onChange={handlePasswdChange} />
                <Button variant="outline" onClick={handleLogin}>Login</Button>
            </form>
            <Container mt="xs" mb="xs">
                <Responses responses={updates} onSendMessage={handleSendMessage} />
            </Container>
            <QuestionWindow questions={questions} onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Teacher;
