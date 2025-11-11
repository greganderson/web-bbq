import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button, Stack, PasswordInput } from "@mantine/core";
import { notifyError, notifySuccess } from "../Notification.tsx";

interface LoginProps {
	onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
	const [opened, { open, close }] = useDisclosure(false);
	const [password, setPassword] = useState("");

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value);
	}

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (password === "") {
			notifyError("Please enter a password");
			return;
		}

		onLogin(password);
		setPassword("");
		close();
		notifySuccess("Connecting...");
	}

	return (
		<>
			<Modal opened={opened} onClose={close} title="Teacher Login" centered>
				<form onSubmit={handleSubmit}>
					<Stack gap="md">
						<PasswordInput
							label="Password"
							value={password}
							onChange={handlePasswordChange}
							autoFocus
						/>
						<Button type="submit" variant="outline">Login</Button>
					</Stack>
				</form>
			</Modal>
			<Button onClick={open} variant="outline">Login</Button>
		</>
	)
}

export default Login;
