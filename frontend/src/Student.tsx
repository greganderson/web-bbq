import { useDispatch, useSelector } from "react-redux";
import { Container, TextInput } from "@mantine/core";
import useWebSocket from "react-use-websocket";

import Feedback from "./Components/Feedback";
import Questions from "./Components/Questions";
import { RootState, setName } from "./Store";

function Student() {
    const dispatch = useDispatch();
    const name = useSelector((state: RootState) => state.app.name);
    const baseWS = useSelector((state: RootState) => state.app.baseWS);
    const { sendMessage } = useWebSocket(`${baseWS}/ws/student`);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        dispatch(setName(newName));
    }

    const handleSendMessage = (message: object) => {
        sendMessage(JSON.stringify(message));
    }

    return (
        <Container size="xs" >
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
