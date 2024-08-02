import { createSlice, configureStore } from "@reduxjs/toolkit";

const localhost = "http://localhost:8000"
const aws = "http://bbq-backend-dev.us-west-2.elasticbeanstalk.com"

const appSlice = createSlice({
    name: "app",
    initialState: {
        baseUrl: aws,
        name: "",
    },
    reducers: {
        setBaseUrl: (state, action) => {
            state.baseUrl = action.payload;
        },
        setName: (state, action) => {
            state.name = action.payload;
        },
    },
});

const store = configureStore({
    reducer: {
        app: appSlice.reducer
    },
});

export const { setBaseUrl, setName } = appSlice.actions;
export default store;
