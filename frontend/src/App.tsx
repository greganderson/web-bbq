import {
    ActionIcon,
    Center,
    Group,
    Tabs,
    Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { IconSettings } from "@tabler/icons-react";

import Student from "./pages/Student";
import Teacher from "./pages/Teacher";
import Settings from "./Components/Settings";
import MemoBackground from "./Components/bbq/ThreeCanvas";
import Notification from "./Components/Notification";
import "@mantine/core/styles.css";
import "./index.css";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

interface AppProps {
    toggleTheme: () => void
}

const App: React.FC<AppProps> = ({ toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { pathname } = location;
    const [ opened, {open, close} ] = useDisclosure(false);

    gsap.registerPlugin(useGSAP);

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

            <MemoBackground isVisible={false} />

        </>
    )
}

export default App
