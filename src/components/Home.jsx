import React, { useState } from "react";
import Logo from "./Logo";
import Search from "./Search";
import Alert from "./Alert";
import { AnimatePresence } from "framer-motion";
import ListSidebar from "./ListSidebar";

const Home = () => {
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
        <div className="bg-bg min-h-screen relative text-white px-2 md:px-8 lg:px-16 pt-5 overflow-hidden">
            <Logo size="text-3xl" />

            <ListSidebar />

            <AnimatePresence className="fixed">
                {show && (
                    <Alert
                        status={status}
                        message={message}
                    />
                )}
            </AnimatePresence>

            <Search
                baseLink={baseLink}
                setBaseLink={setBaseLink}
                showAlert={showAlert} // 🔁 pass to Search
            />
        </div>
    );
};

export default Home;
