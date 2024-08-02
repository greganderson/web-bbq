import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Container, TextInput } from "@mantine/core";

import Feedback from "./Components/Feedback";
import Questions from "./Components/Questions";
import { setName } from "./Store";

function Student() {
    const dispatch = useDispatch();
    const name = useSelector((state) => state.app.name);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        dispatch(setName(newName));
    }

    return (
        <Container size="xs" >
            <TextInput
            label="Name"
            value={name}
            onChange={handleNameChange}/>
            <Feedback />
            <Questions />
        </Container>
    )
}

export default Student;
