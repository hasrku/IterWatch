import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import React, { useRef, useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

const WatchLocal = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [videoName, setVideoName] = useState("");
    const fileInputRef = useRef(null);
    const playerRef = useRef(null);

    const handlePlay = () => {
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.muted = false;
            }
        }, 500);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVideoSrc({ src: file, type: "video/object" }); // File object, not blob URL
        setVideoName(file.name);
    };

    return (
        <div className="flex flex-col lg:px-16 pt-2 bg-bg">
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {!videoSrc ? (
                <div className="flex items-center justify-center h-64">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-semibold transition"
                    >
                        Load Video
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center w-full">
                    <div className="w-screen lg:w-[55vw] max-w-5xl">
                        <MediaPlayer
                            key={videoName}
                            title={videoName}
                            src={videoSrc}
                            aspectRatio="16/9"
                            autoPlay
                            muted
                            playsInline
                            onCanPlay={handlePlay}
                            ref={playerRef}
                        >
                            <MediaProvider />
                            <DefaultVideoLayout icons={defaultLayoutIcons} />
                        </MediaPlayer>
                    </div>

                    {/* <p className="mt-3 text-neutral-300 text-sm">
                        Now Playing: <span className="text-white font-semibold">{videoName}</span>
                    </p> */}
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white"
                    >
                        Load Another Video
                    </button>
                </div>
            )}
        </div>
    );
};

export default WatchLocal;
