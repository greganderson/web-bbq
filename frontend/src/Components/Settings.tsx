import React from "react";
import { Container, Title, Divider, ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useFlags } from "launchdarkly-react-client-sdk";

interface SettingsProps {
	toggleTheme: () => void
}

const Settings: React.FC<SettingsProps> = ({ toggleTheme }) => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const { lightMode } = useFlags();

    const handleLightToggle = () => {
        toggleColorScheme();
        toggleTheme();
    }

	return (
		<Container>
			<Title order={2}>Settings</Title>
			<Divider my="md" />

            {
                lightMode &&
                <ActionIcon
                    onClick={handleLightToggle}
                    variant="outline">
                    {
                        colorScheme === "dark" ?
                            <IconSun /> :
                            <IconMoon />
                    }
                </ActionIcon>
            }

		</Container>
	)
}

export default Settings;
