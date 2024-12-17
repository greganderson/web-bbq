import {
    ActionIcon,
    Tabs,
    useMantineColorScheme
} from "@mantine/core";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useFlags } from "launchdarkly-react-client-sdk";

import Student from "./Student";
import Teacher from "./Teacher";
import Game from "./Components/bbq/Game";
import MemoBackground from "./Components/bbq/ThreeCanvas";
import Notification from "./Components/Notification";
import "@mantine/core/styles.css";
import "./index.css";

interface AppProps {
    toggleTheme: () => void
}

const App: React.FC<AppProps> = ({ toggleTheme }) => {
    const [game, setGame] = useState<boolean>(false);
    const [_, setSeq] = useState<string[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location;
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const { lightMode } = useFlags();

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

    const handleLightToggle = () => {
        toggleColorScheme();
        toggleTheme();
    }

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
        <>
            <Tabs
                value={pathname.slice(1)}
                defaultValue="student"
                variant="pills"
                onChange={(value) => {
                    navigate(`/${value}`)
                }}>
                <Tabs.Tab value="student">Student</Tabs.Tab>
                <Tabs.Tab value="teacher">Teacher</Tabs.Tab>
            </Tabs>

            {
                lightMode &&
                <ActionIcon
                    onClick={handleLightToggle}
                    variant="outline">
                    {
                        colorScheme === "dark" ?
                            <IconSun /> :
                            <IconMoon />
                    }
                </ActionIcon>
            }


            <Routes>
                <Route path="/" element={<Navigate to="/student" />} />
                <Route path="/student" element={<Student />} />
                <Route path="/teacher" element={<Teacher />} />
            </Routes>

            <Notification />

            <MemoBackground isVisible={game} />

        </>
    )
}

export default App
