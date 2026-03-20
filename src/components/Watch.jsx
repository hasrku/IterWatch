import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import { IoMdSkipForward, IoMdSkipBackward } from "react-icons/io";
import { BsCopy } from "react-icons/bs";
import { FaCheck } from "react-icons/fa6";

import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";
import NotFound from "./NotFound";

const Watch = () => {
    const { playlistName } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
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
        <div className="flex flex-col h-screen lg:px-16 pt-2 bg-bg overflow-hidden">
            <div className="pl-2 flex items-center justify-between mt-2">
                <Logo size="text-2xl" />
                <ListSidebar />
            </div>

            <div className="flex flex-col h-screen lg:flex-row justify-center items-center gap-0 lg:gap-15 w-full mt-2 lg:mt-4 bg-bg text-white overflow-hidden">
                <div className="h-max lg:h-full text-white flex flex-col lg:justify-center overflow-hidden">
                    <div
                        className="relative h-75 lg:h-fit lg:w-[55vw] overflow-hidden"
                        ref={containerRef}
                    >
                        <MediaPlayer
                            ref={playerRef}
                            title={`${playlist.name}: episode ${currentIndex + 1}`}
                            src={playlist?.links?.[currentIndex]}
                            aspectRatio="16/9"
                            autoPlay
                            muted
                            playsInline
                            onCanPlay={handlePlay}
                            onEnded={() => goTo(1)}
                        >
                            <MediaProvider />
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
                    className="w-screen lg:w-[300px] h-[73vh] mt-3 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-t-xl lg:rounded-xl p-4"
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
