import { Container, Title, Group } from "@mantine/core";
import Grill from "./Grill";
import Units from "./Units";

function Game() {
    return (
        <Container mt="md">
            <Title order={2}>Let's Get Cookin'</Title>
            <Group justify="space-between">
                <Grill />
                <Units />
            </Group>
        </Container>
    )
}

export default Game;
