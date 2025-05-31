import React, { forwardRef, useImperativeHandle } from "react";
import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import Logo from "./Logo";
import NotFound from "./NotFound";
import ListSidebar from "./ListSidebar";
import { IoMdSkipForward, IoMdSkipBackward, IoIosPlay, IoIosPause, IoMdSettings, IoMdVolumeHigh, IoMdVolumeOff, IoMdRefresh } from "react-icons/io";
import { MdOutlineFullscreen, MdOutlineFullscreenExit, MdForward10, MdReplay10 } from "react-icons/md";
import "./custom.css";
import "./customVolume.css";
import ArcSpinner from "./ArcSpinner";

const Watch = () => {
    const { playlistName } = useParams();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isStarted, setIsStarted] = useState(false);
    const [length, setLength] = useState(0);
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef(null);

    const volumeSliderRef = useRef(null);
    const [volume, setVolume] = useState(0);
    const [muted, setMuted] = useState(true);

    const videoSliderRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [secondsProgress, setSecondsProgress] = useState(0);
    // const controlsRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);

    const controlsRef = useRef({
        setIsVisible: (visible) => {},
    });

    const formatTime = (seconds) => {
        const date = new Date(seconds * 1000);
        const hh = date.getUTCHours();
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds();

        if (hh) {
            return `${hh}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
        }
        return `${mm}:${ss.toString().padStart(2, "0")}`;
    };
    const handleVolumeChange = (e) => {
        const val = e.target.value;
        setVolume(val);
        changeVolumeBar(val);
        if (muted && val > 0) {
            setMuted(false);
        }
        if (val == 0) {
            setMuted(true);
        }
    };
    const changeVolumeBar = (val) => {
        volumeSliderRef.current.style.setProperty("--value-percent", `${val}%`);
    };
    const handleChange = (e) => {
        const val = e.target.value;
        setProgress(val);
        setSecondsProgress((length * val) / 100);
        // console.log(e.target.value);
        // console.log(length);
        // Seek to the position in the video
        if (videoRef.current) {
            const duration = videoRef.current.getDuration();
            const seekTo = (val / 100) * duration;
            videoRef.current.seekTo(seekTo);
        }
        // Update the seekbar visual
        e.target.style.setProperty("--value-percent", `${val}%`);
    };
    const handleProgress = (state) => {
        const { played } = state;
        setProgress(played * 100);
        setSecondsProgress(played * length);
        // console.log(played * 100);
        // console.log(played * length);
        videoSliderRef.current.style.setProperty("--value-percent", `${played * 100}%`);
    };

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("playlists") || "[]");
        const found = data.find((p) => p.name === playlistName);
        if (found) {
            setPlaylist(found);
            setCurrentIndex(found.currentEp);
        }
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
        setIsPlaying(true);
        setCurrentIndex((prev) => {
            const next = prev + dir;
            return next >= 0 && next < playlist.links.length ? next : prev;
        });
    };

    const videoControl = (key) => {
        const container = containerRef.current;
        const video = videoRef.current;
        if (!video) return;
        switch (key) {
            case " ":
                setIsPlaying(!isPlaying);
                break;
            case "ArrowRight":
                videoRef.current.seekTo(videoRef.current.getCurrentTime() + 10);
                break;
            case "ArrowLeft":
                videoRef.current.seekTo(videoRef.current.getCurrentTime() - 10);
                break;
            case "ArrowUp":
                setVolume((prev) => {
                    const newVolume = Math.min(prev + 5, 100);
                    changeVolumeBar(newVolume);
                    // Unmute if increasing volume from 0
                    if (newVolume > 0 && muted) {
                        setMuted(false);
                    }
                    return newVolume;
                });
                break;
            case "ArrowDown":
                setVolume((prev) => {
                    const newVolume = Math.max(prev - 5, 0);
                    changeVolumeBar(newVolume);
                    // Mute if volume reaches 0
                    if (newVolume === 0) {
                        setMuted(true);
                    }
                    return newVolume;
                });
                break;
            case "f":
            case "F":
                if (!document.fullscreenElement) {
                    container.requestFullscreen().catch(console.error);
                } else {
                    document.exitFullscreen();
                }
                break;
            case "m":
            case "M":
                if (muted) {
                    setMuted(false);
                    setVolume(100);
                    changeVolumeBar(100);
                } else {
                    setMuted(true);
                    setVolume(0);
                    changeVolumeBar(0);
                }
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ([" ", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "f", "F", "m", "M"].includes(e.key)) {
                e.preventDefault();
                videoControl(e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPlaying, muted]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !playlist) return;

        const allPlaylists = JSON.parse(localStorage.getItem("playlists"));
        const updatedPlaylists = allPlaylists.map((p) => (p.name === playlist.name ? { ...p, epProgress: secondsProgress } : p));
        const found = allPlaylists.find((p) => p.name === playlist.name);
        // console.log(found.epProgress);
        localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
    }, [secondsProgress]);

    useLayoutEffect(() => {
        const video = videoRef.current;
        if (!video || !playlist || !isStarted) return;

        const allPlaylists = JSON.parse(localStorage.getItem("playlists"));
        const found = allPlaylists.find((p) => p.name === playlist.name);
        // console.log(found.epProgress);
        if (found && found.currentEp === currentIndex && found.epProgress > 0) {
            video.seekTo(found.epProgress);
        } else {
            video.seekTo(0);
            const updatedPlaylists = allPlaylists.map((p) => (p.name === playlist.name ? { ...p, epProgress: 0 } : p));
            localStorage.setItem("playlists", JSON.stringify(updatedPlaylists));
        }
    }, [currentIndex, isStarted]);

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

    if (!playlist) return <NotFound />;

    return (
        <div className="flex flex-col h-screen lg:px-16 pt-2 bg-bg overflow-hidden overflow-y-hidden">
            <div className="pl-2">
                <Logo size="text-2xl" />
            </div>

            <ListSidebar />

            <div className="flex flex-col lg:flex-row justify-center  gap-0 lg:gap-15 w-full mt-2 lg:mt-16  bg-bg text-neutral-50 overflow-y-hidden">
                <div className="h-max lg:h-full text-neutral-50 flex flex-col overflow-y-hidden">
                    <div
                        className={`relative lg:rounded-md h-67 w-screen aspect-video lg:h-fit lg:w-[55vw] overflow-hidden`}
                        ref={containerRef}
                        onMouseMove={() => controlsRef.current?.setIsVisible(true)}
                        onTouchMove={() => controlsRef.current?.setIsVisible(true)}
                    >
                        {/* video player */}
                        <ReactPlayer
                            url={playlist.links[currentIndex]}
                            ref={videoRef}
                            playing={isPlaying}
                            onEnded={() => setIsPlaying(false)}
                            onDuration={(e) => setLength(e)}
                            onProgress={handleProgress}
                            muted={muted}
                            volume={volume / 100}
                            onStart={() => {
                                setTimeout(() => {
                                    setMuted(false);
                                    setVolume(100);
                                    changeVolumeBar(100);
                                }, 500);
                                setIsStarted(true);
                            }}
                            onBuffer={() => setIsLoading(true)}
                            onBufferEnd={() => setIsLoading(false)}
                            width="100%"
                            height="100%"
                            className="absolute top-0 left-0"
                            style={{ objectFit: "cover" }}
                        />
                        {isLoading && isPlaying && (
                            <div className="absolute z-1 w-18 lg:w-25 aspect-square flex justify-center items-center top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] text-5xl text-black">
                                <ArcSpinner color={"#ffffff"} />
                            </div>
                        )}

                        {/* video controls section */}
                        <Controls
                            ref={controlsRef}
                            isPlaying={isPlaying}
                        >
                            {/* top controls */}
                            <div className="w-full flex justify-between items-start bg-linear-0 from-[#26262600] to-[#0f0f0fd2] px-3 pb-2 pt-3">
                                <p
                                    className={`font-bold ml-2 flex flex-col lg:font-normal ${
                                        isFullScreen ? "text-lg lg:text-3xl" : "lg:text-xl lg:ml-2"
                                    } `}
                                >
                                    <span className="">
                                        Episode: {currentIndex + 1} of {playlist.links.length}
                                    </span>
                                    <span className={`font-semibold text-sm lg:hidden text-neutral-50/80 ${isFullScreen ? "block" : "hidden"}`}>
                                        {playlist.name}
                                    </span>
                                </p>
                                <button className="p-1 rounded-full cursor-pointer">
                                    <IoMdSettings className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                </button>
                            </div>

                            {/* middle controls */}
                            <div className={`text-neutral-50 flex gap-10 lg:gap-25 justify-center items-center`}>
                                <button
                                    onClick={() => videoControl("ArrowLeft")}
                                    className={`p-3 rounded-full disabled:opacity-40 ${
                                        isFullScreen ? "block lg:hidden" : "hidden"
                                    } cursor-pointer bg-[#26262637]`}
                                >
                                    <MdReplay10 className={` ${isFullScreen ? " size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                </button>

                                <button
                                    onClick={() => goTo(-1)}
                                    className="p-3  rounded-full disabled:opacity-40 cursor-pointer bg-[#26262637]"
                                    disabled={currentIndex === 0}
                                >
                                    <IoMdSkipBackward className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                </button>
                                <button
                                    onClick={() => videoControl(" ")}
                                    className="p-2 rounded-full disabled:opacity-40 cursor-pointer bg-[#26262637]"
                                >
                                    {isPlaying ? <IoIosPause className=" size-12 lg:size-13" /> : <IoIosPlay className=" size-12 lg:size-13" />}
                                </button>
                                <button
                                    onClick={() => goTo(1)}
                                    className="p-3  rounded-full disabled:opacity-40 cursor-pointer bg-[#26262637]"
                                    disabled={currentIndex === playlist.links.length - 1}
                                >
                                    <IoMdSkipForward className={`  ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                </button>
                                <button
                                    onClick={() => videoControl("ArrowRight")}
                                    className={`p-3 rounded-full disabled:opacity-40 ${
                                        isFullScreen ? "block lg:hidden" : "hidden"
                                    } cursor-pointer bg-[#26262637]`}
                                >
                                    <MdForward10 className={` ${isFullScreen ? " size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                </button>
                            </div>

                            {/* bottom controls */}
                            <div className="px-3 pb-3 flex flex-col bg-linear-0 from-[#0f0f0fd2]  to-[#26262600]">
                                {/* video seekbar */}
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={progress}
                                    onChange={handleChange}
                                    ref={videoSliderRef}
                                    className="w-full h-1 mb-3  cursor-pointer custom-range "
                                ></input>
                                {/* video small controls */}
                                <div className={`flex flex-row justify-between lg:m-1 ${isFullScreen ? "m-2  " : ""}`}>
                                    <div className={`flex items-center justify-center ${isFullScreen ? "gap-6" : " gap-2"}`}>
                                        <button
                                            onClick={() => videoControl(" ")}
                                            className="rounded-full disabled:opacity-40 cursor-pointer"
                                        >
                                            {isPlaying ? (
                                                <IoIosPause className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                            ) : (
                                                <IoIosPlay className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                            )}
                                        </button>
                                        <div className=" gap-2 justify-center items-center flex ">
                                            <button
                                                className="rounded-full disabled:opacity-40 cursor-pointer"
                                                onClick={() => videoControl("m")}
                                            >
                                                {muted ? (
                                                    <IoMdVolumeOff className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                                ) : (
                                                    <IoMdVolumeHigh className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                                )}
                                            </button>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={volume}
                                                ref={volumeSliderRef}
                                                onChange={handleVolumeChange}
                                                className={` h-1 bg-neutral-50 dark:bg-amber-50 rounded-lg cursor-pointer customV-range`}
                                            ></input>
                                        </div>
                                        <p
                                            className={`ml-2 flex items-center font-bold lg:font-normal justify-center ${
                                                isFullScreen ? "text-md lg:text-xl" : "text-sm"
                                            }`}
                                        >
                                            <span>{formatTime(secondsProgress)} /&nbsp;</span>
                                            <span> {formatTime(length)}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <button
                                            onClick={() => videoControl("f")}
                                            className=" rounded-full disabled:opacity-40 cursor-pointer"
                                        >
                                            {isFullScreen ? (
                                                <MdOutlineFullscreenExit className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                            ) : (
                                                <MdOutlineFullscreen className={` ${isFullScreen ? "size-6 lg:size-10" : "size-6 lg:size-7"}`} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Controls>
                    </div>
                    <h2 className="text-xl ml-1 mt-1 font-bold text-neutral-50">
                        {playlist.name}&nbsp;
                        {" -"}
                        <span className="text-lg font-medium ml-2  text-neutral-400">
                            Episode: {currentIndex + 1} of {playlist.links.length}
                        </span>
                    </h2>
                </div>

                {/* playlist section  */}
                <div
                    id="playlist-scroll-container"
                    className="w-full lg:w-[300px] h-[70vh]  mt-4 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-xl p-4"
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
                                        index === currentIndex ? "border-l-4 border-blue-400 bg-neutral-600 text-neutral-50" : "text-white"
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

const Controls = forwardRef(({ children, isPlaying }, ref) => {
    const [isVisible, setIsVisible] = useState(!isPlaying);
    const [isMouseActive, setIsMouseActive] = useState(true);
    const mouseTimeoutRef = useRef(null);
    const timeoutRef = useRef(null);

    // Expose setIsVisible to parent via ref
    useImperativeHandle(ref, () => ({
        setIsVisible,
    }));

    useEffect(() => {
        if (!isPlaying) {
            setIsVisible(true);
            return;
        }

        if (isPlaying) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isVisible, isPlaying]);

    const showControls = () => {
        setIsVisible(true);
        setIsMouseActive(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (isPlaying) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
    };

    const handleMouseMove = () => {
        setIsMouseActive(true);
        if (mouseTimeoutRef.current) {
            clearTimeout(mouseTimeoutRef.current);
        }
        mouseTimeoutRef.current = setTimeout(() => {
            setIsMouseActive(false);
        }, 3000);
    };

    const hideControls = () => {
        setIsVisible(false);
    };

    return (
        <div
            className={`absolute top-0 left-0 flex flex-col justify-between h-full w-full  transition-opacity duration-300 ${
                isVisible ? "opacity-100" : "opacity-0"
            } ${!isVisible && !isMouseActive ? "hide-cursor" : ""}`}
            onMouseEnter={showControls}
            onMouseLeave={hideControls}
            onTouchStart={showControls}
            onMouseMove={handleMouseMove}
            onTouchEnd={() => {
                // Small delay before hiding controls on touch devices
                setTimeout(hideControls, 3000);
            }}
        >
            {children}
        </div>
    );
});
