import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, PasswordInput, Group, Button } from "@mantine/core";

import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import Line from "./Components/Line";
import { RootState } from "./Store";
import Notification, { notifyError } from "./Components/Notification";

function Teacher() {
    const [passwd, setPasswd] = useState("");
    const [updates, setUpdates] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [line, setLine] = useState([]);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const base = useSelector((state: RootState) => state.app.baseUrl);

    const headers = {
        "X-TotallySecure": passwd
    };

    const updateFunc = () => {
        const resp = fetch(`${base}/teacher`, {
            method: "GET",
            headers: headers
        });
        return resp;
    }

    const handlePasswdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswd(e.target.value);
    }

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`${base}/login`, {
            method: "POST",
            headers: headers,
            credentials: "include"
        });

        if (response.ok) {
            setLoggedIn(true);
            setPasswd("");
        } else {
            notifyError("Error logging in");
        }
    }

    useEffect(() => {
        if (loggedIn) {
            console.log("Logged in now!");
            const createSSE = () => {
                const eventSource = new EventSource(`${base}/sse`, { withCredentials: true });

                eventSource.onmessage = function(event) {
                    console.log(event);
                    console.log(event.data);
                    console.log(typeof event.data)
                    const data = JSON.parse(event.data);
                    console.log(data);

                    switch (data.type) {
                        case "question":
                            setQuestions(data.data);
                            break;
                        case "shutdown":
                            notifyError("The server is shutting down");
                            eventSource.close();
                            break;
                        default:
                            console.log(`Unknown type: ${data.type}`);
                    }
                }

                eventSource.onerror = function(error) {
                    console.error(`SSE ERROR: ${JSON.stringify(error)}`);
                    eventSource.close();
                }

                return eventSource;
            }

            const eventSource = createSSE();

            return () => {
                eventSource.close();
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
            </form>
            <Group justify="space-between">
                <Responses responses={updates} passwd={passwd} />
                <Line line={line} update={updateFunc} />
            </Group>
            <QuestionWindow questions={questions} passwd={passwd} />
            <Notification />
        </Container>
    )
}

export default Teacher;
