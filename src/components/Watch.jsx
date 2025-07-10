import React, { forwardRef, useImperativeHandle } from "react";
import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import Logo from "./Logo";
import NotFound from "./NotFound";
import ListSidebar from "./ListSidebar";
import ArcSpinner from "./ArcSpinner";
import Controls from "./Controls";
import { MdForward10, MdReplay10 } from "react-icons/md";

const Watch = () => {
    const { playlistName } = useParams();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isStarted, setIsStarted] = useState(false);
    const [length, setLength] = useState(0);
    const [speed, setSpeed] = useState(1);
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

    const controlsRef = useRef(null);

    const [showLeftSeek, setShowLeftSeek] = useState(false);
    const [showRightSeek, setShowRightSeek] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

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

    const lastLeftTapRef = useRef(0);
    const lastRightTapRef = useRef(0);
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    const videoControl = async (key) => {
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
                    setTimeout(() => {
                        setIsFullScreen(true);
                    }, 10);
                    await screen.orientation.lock("landscape");
                } else {
                    document.exitFullscreen();
                    setTimeout(() => {
                        setIsFullScreen(false);
                    }, 10);
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
        if (!isPlaying) {
            controlsRef.current.style.visibility = "visible";
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
        if (isPlaying) {
            handleMouseMove(false);
        }

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
        // const found = allPlaylists.find((p) => p.name === playlist.name);
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

    const timeoutRef = useRef(null);
    useEffect(() => {
        setTimeout(() => {
            controlsRef.current.style.visibility = "hidden";
        }, 3000);
    }, []);

    const handleMouseMove = () => {
        // console.log("mouse moved");
        if (!controlsRef.current) return;
        controlsRef.current.style.visibility = "visible";
        containerRef.current.style.cursor = "default";

        if (!isPlaying) return;

        if (controlsRef.current) {
            controlsRef.current.style.visibility = "visible";
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (controlsRef.current) {
                controlsRef.current.style.visibility = "hidden";
                containerRef.current.style.cursor = "none";
            }
        }, 2500); // hide after 3 seconds
    };

    useEffect(() => {
        function onFullscreenChange() {
            // document.fullscreenElement will be null if no element is in fullscreen
            setIsFullScreen(Boolean(document.fullscreenElement));
        }
        document.addEventListener("fullscreenchange", onFullscreenChange);

        onFullscreenChange();

        return () => {
            document.removeEventListener("fullscreenchange", onFullscreenChange);
        };
    }, [isFullScreen]);

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
                        onMouseMove={() => {
                            setTimeout(() => {
                                handleMouseMove();
                            }, 300);
                        }}
                        onTouchMove={() => {
                            setTimeout(() => {
                                handleMouseMove();
                            }, 300);
                        }}
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
                            playbackRate={speed}
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

                        <div
                            className="w-[32%] h-5/10 z-3 absolute top-1/2 translate-y-[-50%] left-0 "
                            onTouchEnd={() => {
                                const now = Date.now();
                                if (now - lastLeftTapRef.current < DOUBLE_TAP_DELAY) {
                                    videoControl("ArrowLeft");
                                    setShowLeftSeek(true);
                                    setTimeout(() => setShowLeftSeek(false), 800);
                                }
                                lastLeftTapRef.current = now;
                            }}
                        ></div>
                        {showLeftSeek && (
                            <MdReplay10
                                className={`absolute left-[20%] top-1/2 transform -translate-y-1/2 lg:hidden ${isFullScreen ? " size-6 " : "size-6"}`}
                            />
                        )}

                        <div
                            className="w-[32%] h-5/10 z-3 absolute top-1/2 translate-y-[-50%] right-0 "
                            onTouchEnd={() => {
                                const now = Date.now();
                                if (now - lastRightTapRef.current < DOUBLE_TAP_DELAY) {
                                    videoControl("ArrowRight");
                                    setShowRightSeek(true);
                                    setTimeout(() => setShowRightSeek(false), 800);
                                }
                                lastRightTapRef.current = now;
                            }}
                        ></div>
                        {showRightSeek && (
                            <MdForward10
                                className={`absolute right-[20%] top-1/2 transform -translate-y-1/2 lg:hidden  ${
                                    isFullScreen ? " size-6 " : "size-6"
                                }`}
                            />
                        )}

                        {/* video controls section */}
                        <Controls
                            ref={controlsRef}
                            isPlaying={isPlaying}
                            isFullScreen={isFullScreen}
                            currentIndex={currentIndex}
                            playlist={playlist}
                            videoControl={videoControl}
                            goTo={goTo}
                            handleChange={handleChange}
                            videoSliderRef={videoSliderRef}
                            handleVolumeChange={handleVolumeChange}
                            volumeSliderRef={volumeSliderRef}
                            secondsProgress={secondsProgress}
                            length={length}
                            progress={progress}
                            muted={muted}
                            volume={volume}
                            formatTime={formatTime}
                            speed={speed}
                            setSpeed={setSpeed}
                        ></Controls>
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
