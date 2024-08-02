import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import store from "./Store.ts";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Router>
        <Provider store={store}>
            <React.StrictMode>
                <App />
            </React.StrictMode>
        </Provider>
    </Router>
)
