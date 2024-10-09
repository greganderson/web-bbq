import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, PasswordInput, Button } from "@mantine/core";

import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import { RootState } from "./Store";
import { notifyError, notifySuccess } from "./Components/Notification";
import useWebSocket from "react-use-websocket";

function Teacher() {
    const [passwd, setPasswd] = useState("");
    const [updates, setUpdates] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const base = useSelector((state: RootState) => state.app.baseUrl);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const url = `${baseWS}/ws/teacher`;
    const { sendMessage, lastJsonMessage } = useWebSocket(loggedIn ? url : null);

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
        if (lastJsonMessage !== null) {
            console.log(lastJsonMessage);
        }
    })

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
