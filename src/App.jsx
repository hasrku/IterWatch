import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Logo from "./components/Logo";
import Search from "./components/Search";
import Alert from "./components/Alert";
import { AnimatePresence } from "framer-motion";
import ListSidebar from "./components/ListSidebar";
import Home from "./components/Home";
import Watch from "./components/Watch";
import NotFound from "./components/NotFound";

const App = () => {
    const [baseLink, setBaseLink] = useState("");
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);

    const showAlert = (status, message) => {
        setStatus(status);
        setMessage(message);
        setShow(true);
        setTimeout(() => {
            setShow(false);
        }, 2000);
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={<Home />}
                />
                <Route
                    path="/watch/:playlistName"
                    element={<Watch />}
                />
                <Route
                    path="*"
                    element={<NotFound />}
                />
            </Routes>
        </Router>
    );
};

export default App;
