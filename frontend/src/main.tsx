import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import store from "./Store.ts";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from "@mantine/hooks";
import { webTheme, lightMode } from "./theme";
import { basicLogger, LDProvider } from "launchdarkly-react-client-sdk";

function Main() {
    const [colorScheme, setColorScheme] = useLocalStorage<"light" | "dark">({
        key: "color-scheme",
        defaultValue: "dark"
    });
    const [currentTheme, setCurrentTheme] = useState(webTheme);
    const launchDarkly = import.meta.env.VITE_LD_CLIENT_ID;
    const ldContext = {
        kind: "user",
        anonymous: true
    };
    const ldOptions = {
        logger: basicLogger({ level: "error" })
    }

    const toggleTheme = () => {
        setCurrentTheme((prevTheme) => (prevTheme === webTheme ? lightMode : webTheme));
        setColorScheme((current) => current === "light" ? "dark" : "light");
    };

    useEffect(() => {
        setCurrentTheme(colorScheme === "dark" ? webTheme : lightMode);
    }, [colorScheme]);

    return (
        <Router>
            <Provider store={store}>
                <React.StrictMode>
                    <LDProvider clientSideID={launchDarkly} context={ldContext} options={ldOptions}>
                        <MantineProvider theme={currentTheme} defaultColorScheme={colorScheme}>
                            <App toggleTheme={toggleTheme} />
                        </MantineProvider>
                    </LDProvider>
                </React.StrictMode>
            </Provider>
        </Router >
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
