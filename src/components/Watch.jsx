import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import { IoMdSkipForward, IoMdSkipBackward } from "react-icons/io";

import { Element, scroller } from "react-scroll";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import Logo from "./Logo";
import ListSidebar from "./ListSidebar";
import NotFound from "./NotFound";

const Watch = () => {
    const { playlistName } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef(null);
    const playerRef = useRef(null);

    const handlePlay = () => {
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.muted = false;
            }
        }, 500);
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
        setCurrentIndex((prev) => {
            const next = prev + dir;
            return next >= 0 && next < playlist.links.length ? next : prev;
        });
    };

    if (!playlist) return <NotFound />;

    return (
        <div className="flex flex-col h-screen lg:px-16 pt-2 bg-bg overflow-hidden">
            <div className="pl-2">
                <Logo size="text-2xl" />
            </div>

            <ListSidebar />

            <div className="flex flex-col h-screen lg:flex-row justify-center items-center gap-0 lg:gap-15 w-full mt-2 lg:mt-4 bg-bg text-white overflow-hidden">
                <div className="h-max lg:h-full text-white flex flex-col lg:justify-center overflow-hidden">
                    <div
                        className="relative h-90 lg:h-fit lg:w-[55vw] overflow-hidden"
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
                                                className="vds-button"
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
                                                className="vds-button"
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

                    <h2 className="text-xl ml-1 mt-1 font-bold text-neutral-50">
                        {playlist.name}
                        <span className="text-lg font-medium ml-2 text-neutral-400">
                            Episode: {currentIndex + 1} of {playlist.links.length}
                        </span>
                    </h2>
                </div>

                <div
                    id="playlist-scroll-container"
                    className="w-screen lg:w-[300px] h-[75vh] mt-4 lg:mt-0 overflow-y-auto bg-neutral-800 rounded-xl p-4"
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
