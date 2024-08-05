import {
    MantineProvider,
    Tabs
} from "@mantine/core";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";

import Student from "./Student";
import Teacher from "./Teacher";
import Game from "./Components/bbq/Game";

import "@mantine/core/styles.css";
import webTheme from "./theme";

function App() {
    const [game, setGame] = useState<boolean>(false);
    const [_, setSeq] = useState<string[]>([]);
    const navigate = useNavigate();
    const { tabValue } = useParams();

    const sequence = [
        "ArrowUp",
        "ArrowUp",
        "ArrowDown",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "ArrowLeft",
        "ArrowRight",
        "b",
        "a",
        "Enter"
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setSeq((prev: string[]) => {
                const newSeq = [...prev, e.key];

                const trimmed = newSeq.slice(-sequence.length);
                if (trimmed.join("") === sequence.join("")) {
                    setGame(true);
                }

                return trimmed;
            });
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <MantineProvider theme={webTheme} defaultColorScheme="dark">

            <Tabs
                value={tabValue}
                defaultValue="student"
                variant="pills"
                onChange={(value) => navigate(`/tabs/${value}`)}>
                <Tabs.Tab value="student">Student</Tabs.Tab>
                <Tabs.Tab value="teacher">Teacher</Tabs.Tab>
            </Tabs>

            <Routes>
                <Route path="/" element={<Student />} />
                <Route path="/tabs/student" element={<Student />} />
                <Route path="/tabs/teacher" element={<Teacher />} />
            </Routes>

            {game && <Game />}

        </MantineProvider>
    )
}

export default App
