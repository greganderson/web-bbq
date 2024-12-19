import {
    ActionIcon,
    Center,
    Group,
    Tabs,
    Modal,
    useMantineColorScheme
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { IconSun, IconMoon, IconSettings } from "@tabler/icons-react";

import Student from "./Student";
import Teacher from "./Teacher";
import Settings from "./Components/Settings";
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
    const [ opened, {open, close} ] = useDisclosure(false);

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
        <>
            <Center
                m="md">
                <Group
                    justify="space-between" gap="lg">
                    <Tabs
                        value={pathname.slice(1)}
                        defaultValue="student"
                        variant="pills"
                        onChange={(value) => {
                            navigate(`/${value}`)
                        }}>
                        <Tabs.List>
                            <Tabs.Tab value="student">Student</Tabs.Tab>
                            <Tabs.Tab value="teacher">Teacher</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    <ActionIcon
                        onClick={open}
                        variant="outline">
                        <IconSettings />
                    </ActionIcon>
                </Group>
            </Center>


            <Modal opened={opened} onClose={close} withCloseButton={false}>
                <Settings toggleTheme={toggleTheme} />
            </Modal>

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
