import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Flex, Container, Stack, TextInput, PasswordInput } from "@mantine/core";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase.ts";
import { notifyError, notifySuccess } from "../Notification.tsx";

const Login: React.FC<{}> = ({ }) => {
	const [opened, { open, close }] = useDisclosure(false);
	const [showLogin, setShowLogin] = useState<boolean>(true);
	const [email, setEmail] = useState("");
	const [passwd, setPasswd] = useState("");
	const allowedDomain = "dixietech.edu";

	const toggleSignUp = () => {
		setShowLogin(!showLogin);
	}

	const validateEmail = (email: string) => {
		const domain = email.split("@")[1];
		return domain === allowedDomain;
	}

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
	}

	const handlePasswdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPasswd(e.target.value);
	}

	const onSignUp = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
		e.preventDefault();

		if (!validateEmail(email)) {
			notifyError("You must use a @dixietech.edu email to register");
			return;
		}

		await createUserWithEmailAndPassword(auth, email, passwd)
			.then(() => {
				setEmail("");
				setPasswd("");
				notifySuccess("You are now signed up!");
			})
			.catch((err) => {
				const code = err.code;
				const msg = err.message;
				notifyError(`${code}: ${msg}`);
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
				const code = err.code;
				const msg = err.message;
				notifyError(`${code}: ${msg}`);
			})
	}

	const resetPasswd = (e: React.MouseEvent) => {
		e.preventDefault();
		if (email === "") {
			notifyError("Fill out your email first");
			return;
		}

		sendPasswordResetEmail(auth, email)
			.then(() => {
				notifySuccess("A reset link has been sent to your email!");
			})
			.catch((err) => {
				const code = err.code;
				const msg = err.message;
				notifyError(`${code}: ${msg}`);
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
									<Flex gap="xl" justify="center" align="center">
										<Button variant="outline" onClick={resetPasswd}>Forgot Login?</Button>
										<Button type="submit" variant="outline" onClick={onLogin}>Login</Button>
									</Flex>
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
