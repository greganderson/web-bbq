import { Container, Title, List, Divider } from "@mantine/core";

function QuestionWindow({ questions, passwd }) {
    return (
        <Container>
            <Title order={4}>Questions</Title>
            <Divider my="md" />
            <List center>
                {questions.map((question, idx) => (
                    <List.Item
                    style={{ listStyleType: "none" }}
                    key={idx}>
                        { question.student }: {question.question}
                    </List.Item>
                ))}
            </List>
        </Container>
    )
}

export default QuestionWindow;
