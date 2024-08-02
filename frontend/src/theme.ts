import { createTheme, Input } from "@mantine/core";
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

const webTheme = createTheme({
    primaryColor: "pale_purple",
    colors: {
        pale_purple,
    },
    components: {
        Container: {
            styles: (theme) => ({
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
        Input: Input.extend({ classNames: classes }),
    },
});

export default webTheme;
