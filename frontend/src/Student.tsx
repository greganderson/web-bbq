import { useDispatch, useSelector } from "react-redux";
import { Container, TextInput, ThemeIcon, Tooltip } from "@mantine/core";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { IconPlug, IconPlugOff } from "@tabler/icons-react";

import Feedback from "./Components/Feedback";
import Questions from "./Components/Questions";
import { RootState, setName } from "./Store";

function Student() {
    const dispatch = useDispatch();
    const name = useSelector((state: RootState) => state.app.name);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const { sendMessage, readyState } = useWebSocket(`${baseWS}/ws/student`);
    const isConnected = readyState === ReadyState.OPEN;

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        dispatch(setName(newName));
    }

    const handleSendMessage = (message: object) => {
        sendMessage(JSON.stringify(message));
    }

    return (
        <Container size="xs" >
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
            <TextInput
                label="Name"
                value={name}
                onChange={handleNameChange} />
            <Feedback
                onSendMessage={handleSendMessage} />
            <Questions
                onSendMessage={handleSendMessage} />
        </Container>
    )
}

export default Student;
