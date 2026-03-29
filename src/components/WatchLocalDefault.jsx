import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import React, { useRef, useState } from "react";
import { MediaPlayer, MediaProvider, useMediaState } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";

import { LuUpload } from "react-icons/lu";
import { LiaRedoAltSolid } from "react-icons/lia";

// Separate component so it can use the media context
const VideoTitle = ({ name }) => {
    const controlsVisible = useMediaState("controlsVisible");

    return (
        <div
            className={`
                absolute top-0 left-0 w-full px-4 py-3 z-10
                bg-gradient-to-b from-black/70 to-transparent
                text-neutral-50 pointer-events-none
                transition-opacity duration-300
                ${controlsVisible ? "opacity-100" : "opacity-0"}
            `}
        >
            <p className="text-md font-semibold truncate">{name}</p>
        </div>
    );
};

const WatchLocal = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [videoName, setVideoName] = useState("");
    const fileInputRef = useRef(null);
    const playerRef = useRef(null);
    const [isDrag, setIsDrag] = useState(false);

    const handlePlay = () => {
        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.muted = false;
            }
        }, 500);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDrag(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("video/")) {
            setVideoSrc({ src: file, type: "video/object" });
            setVideoName(file.name);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVideoSrc({ src: file, type: "video/object" });
        setVideoName(file.name);
    };

    return (
        <div className="flex flex-col w-full lg:px-16 pt-2 bg-bg">
            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {!videoSrc ? (
                <div className="flex w-full  justify-center ">
                    <div
                        className={`flex flex-col  lg:w-xl items-center justify-center gap-3 px-12 py-15 lg:aspect-[21/9] 
        border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
        ${isDrag ? "border-blue-500 bg-blue-500/10 " : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800/50"}`}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDrag(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDrag(true);
                        }}
                        onDragLeave={() => setIsDrag(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <LuUpload className={`size-8 transition-colors ${isDrag ? "text-blue-400" : "text-neutral-400"}`} />

                        <p className="text-white text-lg font-medium">
                            Drop a video here or <span className="text-blue-400 hover:text-blue-300">browse</span>
                        </p>
                        <p className="text-sm text-neutral-500">
                            view the local video with <span className="font-semibold">ONE</span> audio track
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-5 justify-center items-start ">
                    <div className="w-screen lg:w-[55vw] ">
                        <MediaPlayer
                            key={videoName}
                            src={videoSrc}
                            aspectRatio="16/9"
                            autoPlay
                            muted
                            playsInline
                            onCanPlay={handlePlay}
                            ref={playerRef}
                            className="relative"
                        >
                            <MediaProvider />

                            {/* Title lives inside MediaPlayer so it shares the media context */}
                            <VideoTitle name={videoName} />

                            <DefaultVideoLayout icons={defaultLayoutIcons} />
                        </MediaPlayer>
                    </div>

                    <button
                        onClick={() => fileInputRef.current.click()}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDrag(true);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDrag(true);
                        }}
                        onDragLeave={() => setIsDrag(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDrag(false);

                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith("video/")) {
                                setVideoSrc({ src: file, type: "video/object" });
                                setVideoName(file.name);
                            }
                        }}
                        className={`flex justify-center items-center gap-3 px-12 py-6 border-2 border-dashed 
    cursor-pointer rounded-lg text-xl text-white transition-all duration-300
    ${isDrag ? "border-blue-500 bg-blue-500/10 " : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800/50"}`}
                    >
                        <LiaRedoAltSolid className={`size-7 transition-colors ${isDrag ? "text-blue-400" : "text-white"}`} />
                        Drop to load video
                    </button>
                </div>
            )}
        </div>
    );
};

export default WatchLocal;
