import { Container, Title, List, Divider } from "@mantine/core";

function Responses({ responses }) {
    return(
        <Container>
            <Title order={4}>Responses</Title>
            <Divider my="md" />
            <List center >
                {responses.map((resp, idx) => (
                    <List.Item
                    style={{ listStyleType: "none" }}
                    key={idx}>
                        { resp.student }: { resp.message }
                    </List.Item>
                ))}
            </List>
        </Container>
    )
}

export default Responses;
