import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { MediaPlayer, MediaProvider, useMediaState } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import { IoMdSkipForward, IoMdSkipBackward, IoMdPlay } from "react-icons/io";
import { BsCopy } from "react-icons/bs";
import { FaCheck } from "react-icons/fa6";
import { IoPlay } from "react-icons/io5";

import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";
import NotFound from "./NotFound";
import PlayingAnimation from "./PlayingAnimation";

const VideoTitle = ({ name }) => {
    const controlsVisible = useMediaState("controlsVisible");

    return (
        <div
            className={`
                absolute top-0 left-0 w-full px-4 py-3 z-10
                bg-gradient-to-b from-black/40 to-transparent
                text-neutral-50 pointer-events-none
                transition-opacity duration-300
                ${controlsVisible ? "opacity-100" : "opacity-0"}
            `}
        >
            <p className="text-md font-semibold truncate">{name}</p>
        </div>
    );
};

const Watch = () => {
    const { playlistName } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoverIndex, setHoverIndex] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const containerRef = useRef(null);
    const playerRef = useRef(null);

    const handlePlay = () => {
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.muted = false;
            }
        }, 500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(playlist?.links?.[currentIndex] || "");
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("playlists") || "[]");
        const found = data.find((p) => p.name === playlistName);
        if (found) {
            setPlaylist(found);
            setCurrentIndex(found.currentEp);
            document.title = found.name + " | IterWatch";
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
        setCurrentIndex((prev) => {
            const next = prev + dir;
            return next >= 0 && next < playlist.links.length ? next : prev;
        });
    };

    if (!playlist) return <NotFound />;

    return (
        <div className="flex flex-col h-screen lg:px-10 pt-2 bg-bg overflow-hidden">
            <div className="pl-2 flex items-center justify-between mt-2">
                <Logo size="text-2xl" />
                <ListSidebar />
            </div>

            <div className="flex flex-col h-screen lg:flex-row justify-center gap-0 lg:gap-10 w-full mt-2 lg:mt-4 bg-bg text-white overflow-hidden">
                <div className="h-max lg:h-full text-white flex flex-col  overflow-hidden">
                    <div
                        className="relative h-75 lg:h-fit lg:w-[60vw] overflow-hidden"
                        ref={containerRef}
                    >
                        <MediaPlayer
                            ref={playerRef}
                            // title={`${playlist.name}: episode ${currentIndex + 1}`}
                            src={playlist?.links?.[currentIndex]}
                            aspectRatio="16/9"
                            autoPlay
                            muted
                            playsInline
                            onCanPlay={handlePlay}
                            onEnded={() => goTo(1)}
                        >
                            <MediaProvider />

                            <VideoTitle name={`${playlist.name}: episode ${currentIndex + 1}`} />

                            {/* <DefaultVideoLayout icons={defaultLayoutIcons} /> */}
                            <DefaultVideoLayout
                                icons={defaultLayoutIcons}
                                slots={{
                                    afterPlayButton: (
                                        <>
                                            {/* --- PREVIOUS BUTTON --- */}
                                            <button
                                                className="vds-button episode-skip"
                                                onClick={() => goTo(-1)}
                                                disabled={currentIndex === 0}
                                                aria-label="Previous Episode"
                                                style={{
                                                    opacity: currentIndex === 0 ? 0.5 : 1,
                                                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                <IoMdSkipBackward size={25} />
                                            </button>

                                            {/* --- NEXT BUTTON --- */}
                                            <button
                                                className="vds-button episode-skip"
                                                onClick={() => goTo(1)}
                                                disabled={currentIndex === playlist.links.length - 1}
                                                aria-label="Next Episode"
                                                style={{
                                                    opacity: currentIndex === playlist.links.length - 1 ? 0.5 : 1,
                                                    cursor: currentIndex === playlist.links.length - 1 ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                <IoMdSkipForward size={25} />
                                            </button>
                                        </>
                                    ),
                                }}
                            />
                        </MediaPlayer>
                    </div>

                    <div className="mx-3 text-xl h-9 mt-0 font-bold text-neutral-50 inline-flex items-center">
                        <p>{playlist.name}</p>
                        <span className="text-lg font-medium ml-2 text-neutral-400">
                            Episode: {currentIndex + 1} of {playlist.links.length}
                        </span>
                        <span
                            onClick={handleCopy}
                            className="ml-auto cursor-pointer text-neutral-200 font-normal"
                        >
                            {isCopied ? (
                                <span className=" flex items-center text-sm text-neutral-300 border border-neutral-600 rounded-lg px-2 py-[2px]">
                                    <FaCheck className="size-4 text-green-500 mr-1" /> link copied!
                                </span>
                            ) : (
                                <BsCopy className="size-4" />
                            )}
                        </span>
                    </div>
                </div>

                <div
                    id="playlist-scroll-container"
                    className="w-screen lg:w-[350px] h-[73vh]  mt-3 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-t-xl lg:rounded-lg p-4"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-semibold">Playlist</span>
                        <span className="text-neutral-200">•</span>
                        <span className="text-sm font-normal ml-2 text-neutral-400">
                            {currentIndex + 1} / {playlist.links.length}
                        </span>
                    </div>

                    <div className="playlist-scroll flex flex-col gap-3">
                        {playlist.links.map((link, index) => (
                            <Element
                                name={`episode-${index}`}
                                key={index}
                            >
                                <button
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-full h-fit flex gap-5 items-center cursor-pointer text-left p-2 rounded-md text-sm transition ${
                                        index === currentIndex ? "border-l-[0px] border-blue-400 bg-neutral-700" : "bg-neutral-800 hover:bg-[#2e2e2e]"
                                    }`}
                                    onMouseEnter={() => setHoverIndex(index)}
                                    onMouseLeave={() => setHoverIndex(null)}
                                >
                                    <div className="w-18 h-12 flex items-center justify-center bg-black">
                                        {hoverIndex === index && index !== currentIndex && <IoMdPlay className="size-5" />}
                                        {index === currentIndex && <PlayingAnimation />}
                                    </div>
                                    <div className="">
                                        <p className="font-medium text-neutral-300">Episode {index + playlist.start}</p>
                                        <p className="text-neutral-400">{playlist.name}</p>
                                    </div>
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
