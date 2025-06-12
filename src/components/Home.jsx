import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        const existing = JSON.parse(localStorage.getItem("playlists") || "[]");
        const hasVisited = localStorage.getItem("visited");
        // console.log(existing);
        // console.log(hasVisited);
        if (existing.length === 0 && hasVisited == null) {
            // console.log("from local");
            const playlist = {
                name: "test",
                currentEp: 0,
                start: 1,
                epProgress: 0,
                links: ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"],
            };
            existing.push(playlist);
            localStorage.setItem("playlists", JSON.stringify(existing));
            localStorage.setItem("visited", "true");
        }
    }, []);

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
                showAlert={showAlert}
            />
        </div>
    );
};

export default Home;
