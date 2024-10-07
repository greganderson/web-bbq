import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, PasswordInput, Button } from "@mantine/core";

import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import { RootState } from "./Store";
import { notifyError, notifySuccess } from "./Components/Notification";

function Teacher() {
    const [passwd, setPasswd] = useState("");
    const [updates, setUpdates] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [socket, setSocket] = useState<null | WebSocket>(null);
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);

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

    useEffect(() => {
        if (loggedIn) {
            const rand = Math.floor(Math.random() * 10000);
            const ws = new WebSocket(`${baseWS}/ws/teacher/${rand}`);

            ws.onopen = () => {
                setSocket(ws);
            }

            ws.onmessage = (event) => {
                console.log(event);
            }

            ws.onclose = () => {
                notifyError("Websocket connection closed");
            }

            return () => {
                ws.close();
            }
        }

    }, [loggedIn]);

    return (
        <Container size="xs">
            <form onSubmit={handleLogin}>
                <PasswordInput
                    label="Password"
                    value={passwd}
                    onChange={handlePasswdChange} />
                <Button variant="outline" onClick={handleLogin}>Login</Button>
                <Button onClick={() => {notifySuccess("clicked!")}}>CLick</Button>
            </form>
            <Container mt="xs" mb="xs">
                <Responses responses={updates} passwd={passwd} />
            </Container>
            <QuestionWindow questions={questions} passwd={passwd} />
        </Container>
    )
}

export default Teacher;
