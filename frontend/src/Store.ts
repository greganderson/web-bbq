import { createSlice, configureStore } from "@reduxjs/toolkit";

const appSlice = createSlice({
    name: "app",
    initialState: {
        baseUrl: "http://localhost:8000",
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
