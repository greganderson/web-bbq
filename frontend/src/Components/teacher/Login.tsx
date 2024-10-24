import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Flex, Container, Stack, TextInput, PasswordInput } from "@mantine/core";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase.ts";
import { notifyError, notifySuccess } from "../Notification.tsx";

const Login: React.FC<{}> = ({ }) => {
	const [opened, { open, close }] = useDisclosure(false);
	const [showLogin, setShowLogin] = useState<boolean>(true);
	const [email, setEmail] = useState("");
	const [passwd, setPasswd] = useState("");

	const toggleSignUp = () => {
		setShowLogin(!showLogin);
	}

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
	}

	const handlePasswdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPasswd(e.target.value);
	}

	const onSignUp = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
		e.preventDefault();

		await createUserWithEmailAndPassword(auth, email, passwd)
			.then(() => {
				setEmail("");
				setPasswd("");
				notifySuccess("You are now signed up!");
			})
			.catch((err) => {
				notifyError(`Error: ${err}`);
			})
	}

	const onLogin = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
		e.preventDefault();

		signInWithEmailAndPassword(auth, email, passwd)
			.then(() => {
				setEmail("");
				setPasswd("");
				close();
				notifySuccess("You are now logged in!");
			})
			.catch((err) => {
				notifyError(`Error: ${err}`);
			})
	}

	return (
		<>
			<Modal opened={opened} onClose={close} title={showLogin ? "Login" : "Sign Up"} centered>
				{
					showLogin ?
						<Container>
							<Stack align="stretch" justify="center" gap="xl">
								<form onSubmit={onLogin}>
									<TextInput
										label="Email"
										value={email}
										onChange={handleEmailChange} />
									<PasswordInput
										label="Password"
										value={passwd}
										onChange={handlePasswdChange} />
									<Button type="submit" variant="outline" onClick={onLogin}>Login</Button>
								</form>
							</Stack>
						</Container> :
						<Container>
							<Stack align="stretch" justify="center" gap="xl">
								<form onSubmit={onSignUp}>
									<TextInput
										label="Email"
										value={email}
										onChange={handleEmailChange} />
									<PasswordInput
										label="Password"
										value={passwd}
										onChange={handlePasswdChange} />
									<Button type="submit" variant="outline" onClick={onSignUp}>Sign Up</Button>
								</form>
							</Stack>
						</Container>
				}
				<Flex gap="xl" justify="flex-end" align="center">
					<Button
						onClick={toggleSignUp}
						style={{ marginTop: "1rem" }}>
						{showLogin ? "Sign Up" : "Login"}
					</Button>
				</Flex>
			</Modal >
			<Button onClick={open} variant="outline">Login</Button>
		</>
	)
}

export default Login;
