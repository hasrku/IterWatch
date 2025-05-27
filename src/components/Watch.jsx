import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";
import { IoMdSkipForward, IoMdSkipBackward, IoIosPlay, IoIosPause } from "react-icons/io";
import { RiFullscreenFill } from "react-icons/ri";
import NotFound from "./NotFound";

const Watch = () => {
    const { playlistName } = useParams();
    const [isPlaying, setIsPlaying] = useState(true);
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
        // console.log(currentIndex);
        // console.log(playlistName);
        // console.log(found);
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
    const videoControl = (key) => {
        const video = videoRef.current;
        if (!video) return;

        switch (key) {
            case " ":
                if (video.paused) {
                    video.play();
                    setIsPlaying(true);
                } else {
                    video.pause();
                    setIsPlaying(false);
                }
                break;
            case "ArrowRight":
                video.currentTime += 10;
                break;
            case "ArrowLeft":
                video.currentTime -= 10;
                break;
            case "f":
            case "F":
                if (!document.fullscreenElement) {
                    video.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen();
                }
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            e.preventDefault();
            videoControl(e.key);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    if (!playlist) return <NotFound />;

    return (
        <div className="flex flex-col h-screen  lg:px-16 pt-5 bg-bg overflow-hidden overflow-y-hidden">
            <div className="pl-5">
                <Logo size="text-2xl lg:text-3xl" />
            </div>

            <ListSidebar />

            <div className="flex flex-col lg:flex-row justify-center items-center gap-0 lg:gap-15 w-screen mt-5 lg:mt-15 bg-bg text-white overflow-y-hidden">
                <div className="h-[55vh] lg:h-full text-white flex flex-col items-center justify-center overflow-y-hidden">
                    <h2 className="text-2xl mb-4 font-bold">
                        {playlist.name}{" "}
                        <span className="text-sm ml-4  text-neutral-400">
                            Episode: {currentIndex + playlist.start} of {playlist.links.length + playlist.start - 1}
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
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40 cursor-pointer"
                            disabled={currentIndex === 0}
                        >
                            <IoMdSkipBackward />
                        </button>
                        <button
                            onClick={() => videoControl(" ")}
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40 cursor-pointer"
                            disabled={currentIndex === 0}
                        >
                            {isPlaying ? <IoIosPause /> : <IoIosPlay />}
                        </button>

                        <button
                            onClick={() => videoControl("f")}
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40 cursor-pointer"
                            disabled={currentIndex === playlist.links.length - 1}
                        >
                            <RiFullscreenFill />
                        </button>
                        <button
                            onClick={() => goTo(1)}
                            className="px-4 py-2 bg-bglight rounded disabled:opacity-40 cursor-pointer"
                            disabled={currentIndex === playlist.links.length - 1}
                        >
                            <IoMdSkipForward />
                        </button>
                    </div>
                </div>

                <div
                    id="playlist-scroll-container"
                    className="w-[90vw]  lg:w-[300px] h-[70vh] mt-2 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-xl p-4"
                >
                    <p className="text-xl font-semibold mb-4">Playlist</p>
                    <div className="playlist-scroll flex flex-col gap-3">
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
                                    Episode {index + playlist.start}
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
