import React, { useEffect, useState } from "react";
import Logo from "./Logo";
import Search from "./Search";
import Alert from "./Alert";
import { AnimatePresence } from "framer-motion";
import ListSidebar from "./ListSidebar";
import PlaylistCreator from "./LinkEnter";
import { useNavigate } from "react-router-dom";
import WatchLocal from "./WatchLocal";

const Home = () => {
    const navigate = useNavigate();
    const [baseLink, setBaseLink] = useState("");
    const [status, setStatus] = useState("");
    const [message, setMessage] = useState("");
    const [show, setShow] = useState(false);
    const [page, setPage] = useState(0);

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
        if (existing.length === 0 && hasVisited == null) {
            const playlist = {
                name: "test",
                currentEp: 0,
                start: 1,
                epProgress: 0,
                links: [
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                ],
            };
            existing.push(playlist);
            localStorage.setItem("playlists", JSON.stringify(existing));
            localStorage.setItem("visited", "true");
        }
    }, []);

    return (
        <div className="bg-bg min-h-screen relative text-white px-2 md:px-8 lg:px-16 pt-5 overflow-hidden">
            <div className="flex flex-row items-center">
                <Logo size="text-2xl" />
                <span
                    className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 px-3 py-[2px] rounded-xl ml-auto mr-5 text-lg font-medium cursor-pointer transition-colors duration-300"
                    onClick={() => navigate("/guide")}
                >
                    Guide
                </span>
                <ListSidebar />
            </div>
            <AnimatePresence className="fixed">
                {show && (
                    <Alert
                        status={status}
                        message={message}
                    />
                )}
            </AnimatePresence>

            {/* ---------- PAGE SELECTOR ---------- */}
            <div className="flex justify-center items-center gap-10 mt-10 lg:mt-3 border-b border-bglight/40 pb-2">
                <button
                    onClick={() => setPage(0)}
                    className={`relative text-lg md:text-xl transition-all pb-1 ${
                        page === 0 ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                >
                    Manual
                    {page === 0 && <span className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-bglight rounded-full" />}
                </button>

                <button
                    onClick={() => setPage(1)}
                    className={`relative text-lg md:text-xl transition-all pb-1 ${
                        page === 1 ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                >
                    Iteration
                    {page === 1 && <span className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-bglight rounded-full" />}
                </button>

                <button
                    onClick={() => setPage(2)}
                    className={`relative text-lg md:text-xl transition-all pb-1 ${
                        page === 2 ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                >
                    Watch Local
                    {page === 2 && <span className="absolute left-0 right-0 bottom-[-2px] h-[2px] bg-bglight rounded-full" />}
                </button>
            </div>

            {/* ---------- PAGE CONTENT ---------- */}
            <div className="flex flex-col justify-center items-center mt-5 flex-1">
                {page === 0 && <PlaylistCreator showAlert={showAlert} />}
                {page === 1 && (
                    <Search
                        baseLink={baseLink}
                        setBaseLink={setBaseLink}
                        showAlert={showAlert}
                    />
                )}
                {page === 2 && <WatchLocal />}
            </div>
        </div>
    );
};

export default Home;
