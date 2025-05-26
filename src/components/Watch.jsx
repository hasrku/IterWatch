import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";

const Watch = () => {
    const { playlistName } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("playlists") || "[]");
        const found = data.find((p) => p.name === playlistName);
        if (found) {
            setPlaylist(found);
            setCurrentIndex(found.currentEp); // auto adjust index
        }
        console.log(currentIndex);
        console.log(playlistName);
        console.log(found);
    }, [playlistName]);

    useEffect(() => {
        if (!playlist) return;

        scroller.scrollTo(`episode-${currentIndex}`, {
            duration: 300,
            delay: 0,
            smooth: true,
            containerId: "playlist-scroll-container",
            offset: -10,
        });

        const allPlaylists = JSON.parse(localStorage.getItem("playlists") || "[]");
        const updatedPlaylists = allPlaylists.map((p) => (p.name === playlist.name ? { ...p, currentEp: currentIndex } : p));

        localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    }, [currentIndex]);

    const goTo = (dir) => {
        setCurrentIndex((prev) => {
            const next = prev + dir;
            return next >= 0 && next < playlist.links.length ? next : prev;
        });
    };

    // KEYBOARD CONTROLS
    useEffect(() => {
        const handleKeyDown = (e) => {
            const video = videoRef.current;
            if (!video) return;

            switch (e.key) {
                case " ":
                    e.preventDefault();
                    video.paused ? video.play() : video.pause();
                    break;
                case "ArrowRight":
                    video.currentTime += 5;
                    break;
                case "ArrowLeft":
                    video.currentTime -= 5;
                    break;
                case "f":
                case "F":
                    if (!document.fullscreenElement) {
                        video.requestFullscreen().catch((err) => console.error(err));
                    } else {
                        document.exitFullscreen();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    if (!playlist) return <p className="text-white">Loading...</p>;

    return (
        <div className="flex flex-col h-screen  lg:px-16 pt-5 bg-bg overflow-hidden overflow-y-hidden">
            <div className="pl-5">
                <Logo size="text-3xl" />
            </div>

            <ListSidebar />

            <div className="flex flex-col lg:flex-row justify-center items-center gap-0 lg:gap-15 w-screen lg:mt-15 bg-bg text-white overflow-y-hidden">
                <div className="h-[55vh] lg:h-full text-white flex flex-col items-center justify-center overflow-y-hidden">
                    <h2 className="text-2xl mb-4">
                        {playlist.name}{" "}
                        <span className="text-sm ml-4 text-neutral-400">
                            Episode: {currentIndex + 1} of {playlist.links.length}
                        </span>
                    </h2>
                    <video
                        key={playlist.links[currentIndex]}
                        controls
                        ref={videoRef}
                        className="w-[95vw] lg:w-[70vw] max-w-3xl rounded-lg shadow"
                        src={playlist.links[currentIndex]}
                        autoPlay
                    />
                    <div className="mt-4 flex gap-4">
                        <button
                            onClick={() => goTo(-1)}
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40"
                            disabled={currentIndex === 0}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => goTo(1)}
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40"
                            disabled={currentIndex === playlist.links.length - 1}
                        >
                            Next
                        </button>
                    </div>
                </div>

                <div
                    id="playlist-scroll-container"
                    className="w-[90vw]  lg:w-[300px] h-[70vh] overflow-y-auto bg-neutral-800 rounded-xl p-4"
                >
                    <p className="text-xl font-semibold mb-4">Playlist</p>
                    <div className="flex flex-col gap-3">
                        {playlist.links.map((link, index) => (
                            <Element
                                name={`episode-${index}`}
                                key={index}
                            >
                                <button
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-full text-left p-3 rounded-md text-sm bg-neutral-700 hover:bg-neutral-600 transition ${
                                        index === currentIndex ? "border-l-4 border-blue-400 bg-neutral-600" : ""
                                    }`}
                                >
                                    Episode {index + 1}
                                </button>
                            </Element>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Watch;
