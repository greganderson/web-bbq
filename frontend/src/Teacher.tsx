import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Container, PasswordInput, Group } from "@mantine/core";

import Responses from "./Components/Responses";
import QuestionWindow from "./Components/QuestionWindow";
import Line from "./Components/Line";
import { RootState } from "./Store";

function Teacher() {
    const [passwd, setPasswd] = useState("");
    const [updates, setUpdates] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [line, setLine] = useState([]);
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

    // useEffect(() => {
    //     const fetchUpdates = async () => {
    //         try {
    //             const resp = await updateFunc();
    //             const data = await resp.json();
    //             setUpdates(data.updates.reverse());
    //             setQuestions(data.questions);
    //             setLine(data.line);
    //         } catch (err) {
    //             console.error(`Error fetching updates: ${err}`);
    //         }
    //     }
    //
    //     if (passwd) {
    //         fetchUpdates();
    //     }
    //
    //     const timer = setInterval(fetchUpdates, 1000);
    //
    //     return () => clearInterval(timer);
    // }, [passwd]);

    useEffect(() => {
        const createSSE = () => {
            const eventSource = new EventSource("/sse");

            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                setUpdates(old => [...old, data]);
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
    }, []);

    return (
        <Container size="xs">
            <PasswordInput
                label="Password"
                value={passwd}
                onChange={handlePasswdChange} />
            <Group justify="space-between">
                <Responses responses={updates} passwd={passwd} />
                <Line line={line} update={updateFunc} />
            </Group>
            <QuestionWindow questions={questions} passwd={passwd} />
        </Container>
    )
}

export default Teacher;
