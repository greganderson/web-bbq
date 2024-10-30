import { createTheme, MantineColorsTuple, MantineThemeOverride, MantineTheme } from "@mantine/core";
import classes from "./App.module.css";

const pale_purple: MantineColorsTuple = [
    '#f2f0ff',
    '#e0dff2',
    '#bfbdde',
    '#9b98ca',
    '#7d79ba',
    '#6a65b0',
    '#605bac',
    '#504c97',
    '#464388',
    '#3b3979'
];

export const webTheme: MantineThemeOverride = createTheme({
    primaryColor: "pale_purple",
    colors: {
        pale_purple,
    },
    components: {
        Container: {
            styles: (theme: MantineTheme) => ({
                root: {
                    border: `1px solid ${theme.colors.pale_purple[7]}`,
                    borderRadius: "5px",
                    padding: "1rem",
                },
            }),
        },
        Group: {
            styles: () => ({
                root: {
                    margin: "1rem",
                },
            }),
        },
        Input: {
            classNames: {
                input: classes.input
            }
        },
        PasswordInput: {
            styles: () => ({
                root: {
                    marginBottom: "1rem"
                }
            })
        }
    },
});

const pastelBlue: MantineColorsTuple = [
    "#EDF2FB",
    "#E2EAFC",
    "#D7E3FC",
    "#CCDBFD",
    "#C0D2FF",      // Don't use 4
    "#C1D3FE",
    "#BACEFF",      // Don't use 6
    "#B6CCFE",
    "#95b4fc",
    "#ABC4FF"
];

export const lightMode: MantineThemeOverride = createTheme({
    primaryColor: "pastelBlue",
    colors: {
        pastelBlue
    },
    components: {
        Container: {
            styles: (theme: MantineTheme) => ({
                root: {
                    border: `1px solid ${theme.colors.pastelBlue[9]}`,
                    borderRadius: "5px",
                    padding: "1rem",
                },
            }),
        },
        Group: {
            styles: () => ({
                root: {
                    margin: "1rem",
                },
            }),
        },
        Input: {
            classNames: {
                input: classes.inputLight
            },
        },
        PasswordInput: {
            styles: () => ({
                root: {
                    marginBottom: "1rem"
                }
            })
        },
        Button: {
            classNames: {
                root: classes.button
            }
        }
    },
})
