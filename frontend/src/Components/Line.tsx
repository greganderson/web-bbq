import { useSelector } from "react-redux";
import { Container, Title, List, Divider, ScrollArea, Button } from "@mantine/core";

function Line({ line, update }) {
    const base = useSelector((state) => state.app.baseUrl);

    const handleHelpNext = () => {
        fetch(`${base}/line`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    return (
        <Container>
            <Title order={4}>Line</Title>
            <Divider my="md" />
            <ScrollArea h={75}>
                <List center>
                    {line.map((next, idx) => (
                        <List.Item
                        style={{ listStyleType: "none" }}
                        key={idx}>
                            { next }
                        </List.Item>
                    ))}
                </List>
            </ScrollArea>
            <Button variant="outline" onClick={handleHelpNext}>Help Next</Button>
        </Container>
    )
}

export default Line;
