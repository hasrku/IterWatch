import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";
import { IoMdSkipForward, IoMdSkipBackward, IoIosPlay, IoIosPause } from "react-icons/io";
import { RiFullscreenFill, RiFullscreenExitFill } from "react-icons/ri";
import NotFound from "./NotFound";

const Watch = () => {
    const { playlistName } = useParams();
    const [isPlaying, setIsPlaying] = useState(true);
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef(null);
    const [showControls, setShowControls] = useState(false);

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
        const container = containerRef.current;
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
                    container.requestFullscreen().catch(console.error);
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
            // Only prevent default for known keys to avoid breaking other behavior
            if ([" ", "ArrowRight", "ArrowLeft", "f", "F"].includes(e.key)) {
                e.preventDefault();
                videoControl(e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullScreen(isFull);
            if (isFull && !document.fullscreenElement) {
                container.requestFullscreen().catch(console.error);
            }
            console.log("Fullscreen mode:", isFull ? "entered" : "exited");
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !playlist) return;

        const interval = setInterval(() => {
            if (!video.paused && !video.ended) {
                const allPlaylists = JSON.parse(localStorage.getItem("playlists"));
                const updatedPlaylists = allPlaylists.map((p) =>
                    p.name === playlist.name ? { ...p, epProgress: Math.floor(video.currentTime) } : p
                );
                localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
            }
        }, 10000); // every 10 seconds

        return () => clearInterval(interval);
    }, [currentIndex]);

    useLayoutEffect(() => {
        const video = videoRef.current;
        if (!video || !playlist) return;

        const allPlaylists = JSON.parse(localStorage.getItem("playlists"));
        const found = allPlaylists.find((p) => p.name === playlist.name);

        if (found && found.currentEp === currentIndex && found.epProgress > 0) {
            video.currentTime = found.epProgress;
        } else {
            video.currentTime = 0;
            const updatedPlaylists = allPlaylists.map((p) => (p.name === playlist.name ? { ...p, epProgress: 0 } : p));
            localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
        }

        const handlePlay = () => {
            console.log("Video playing");
            setIsPlaying(true);
        };

        const handlePause = () => {
            console.log("Video paused");
            setIsPlaying(false);
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
        };
    }, [currentIndex]);

    useEffect(() => {
        if (!isFullScreen) return;

        let timeout;
        const showAndHideControls = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        };

        const container = containerRef.current;

        container.addEventListener("mousemove", showAndHideControls);
        container.addEventListener("touchstart", showAndHideControls);

        return () => {
            container.removeEventListener("mousemove", showAndHideControls);
            container.removeEventListener("touchstart", showAndHideControls);
            clearTimeout(timeout);
        };
    }, [isFullScreen]);

    if (!playlist) return <NotFound />;

    return (
        <div className="flex flex-col h-screen  lg:px-16 pt-2 bg-bg overflow-hidden overflow-y-hidden">
            <div className="pl-2">
                <Logo size="text-2xl" />
            </div>

            <ListSidebar />

            <div className="flex flex-col h-screen lg:flex-row justify-center items-center gap-0 lg:gap-15 w-full mt-2 lg:mt-4  bg-bg text-white overflow-y-hidden">
                <div className="h-max lg:h-full text-white flex flex-col  lg:justify-center overflow-y-hidden">
                    <div
                        className={`relative h-90 lg:h-fit lg:w-[55vw]  overflow-hidden text-neutral-50`}
                        ref={containerRef}
                    >
                        <video
                            key={playlist.links[currentIndex]}
                            controls
                            ref={videoRef}
                            className="rounded-sm w-full h-full shadow transition-all duration-300"
                            src={playlist.links[currentIndex]}
                            autoPlay
                        />
                        {(!isPlaying || (showControls && isFullScreen)) && (
                            <>
                                <div className="absolute top-0 left-1/2  h-full w-0">
                                    <div className={`absolute top-1/2 translate-x-[-50%] translate-y-[-50%] flex gap-35`}>
                                        <button
                                            onClick={() => goTo(-1)}
                                            className="p-4 bg-[#22222268] rounded-full disabled:opacity-40 cursor-pointer"
                                            disabled={currentIndex === 0}
                                        >
                                            <IoMdSkipBackward className="size-4 lg:size-5" />
                                        </button>
                                        <button
                                            onClick={() => goTo(1)}
                                            className="p-4 bg-[#22222268] rounded-full disabled:opacity-40 cursor-pointer"
                                            disabled={currentIndex === playlist.links.length - 1}
                                        >
                                            <IoMdSkipForward className="size-4 lg:size-5" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => videoControl("f")}
                                    className="absolute top-2 right-2 px-3 py-3 bg-[#22222268] rounded-full disabled:opacity-40 cursor-pointer"
                                    disabled={currentIndex === playlist.links.length - 1}
                                >
                                    {isFullScreen ? (
                                        <RiFullscreenExitFill className="size-4 lg:size-5" />
                                    ) : (
                                        <RiFullscreenFill className="size-4 lg:size-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => videoControl(" ")}
                                    className="absolute bottom-1/2 left-1/2 p-2 translate-x-[-50%] translate-y-[27%] lg:translate-y-[50%] bg-[#222222af] rounded-full disabled:opacity-40 cursor-pointer"
                                    disabled={currentIndex === 0}
                                >
                                    {isPlaying ? <IoIosPause className="size-10" /> : <IoIosPlay className="size-10" />}
                                </button>
                            </>
                        )}
                    </div>
                    <h2 className="text-xl ml-1 mt-1 font-bold text-neutral-50">
                        {playlist.name}{" "}
                        <span className="text-lg font-medium ml-2  text-neutral-400">
                            Episode: {currentIndex + 1} of {playlist.links.length}
                        </span>
                    </h2>
                    <div className="mt-2 lg:mt-4 flex gap-4 w-full items-center justify-center">
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
                    className="w-screen  lg:w-[300px] h-[75vh] mt-4 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-xl p-4"
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
                                        index === currentIndex ? "border-l-4 border-blue-400 bg-neutral-600 text-neutral-50" : ""
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
