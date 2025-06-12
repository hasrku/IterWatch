import { div } from "framer-motion/client";
import { useImperativeHandle, forwardRef, useState, useRef, useEffect } from "react";
import { IoMdSkipForward, IoMdSkipBackward, IoIosPlay, IoIosPause, IoMdSettings, IoMdVolumeHigh, IoMdVolumeOff } from "react-icons/io";
import { MdOutlineFullscreen, MdOutlineFullscreenExit, MdForward10, MdReplay10 } from "react-icons/md";

const Controls = forwardRef(
    (
        {
            isPlaying,
            isFullScreen,
            currentIndex,
            playlist,
            videoControl,
            goTo,
            handleChange,
            videoSliderRef,
            handleVolumeChange,
            volumeSliderRef,
            secondsProgress,
            length,
            progress,
            muted,
            volume,
            formatTime,
            speed,
            setSpeed,
        },
        ref
    ) => {
        const [isVisible, setIsVisible] = useState(!isPlaying);
        const [isMouseActive, setIsMouseActive] = useState(true);
        const mouseTimeoutRef = useRef(null);
        const timeoutRef = useRef(null);

        const [showSpeed, setShowSpeed] = useState(false);

        const playBackSpeeds = [
            { key: 0.5, display: "0.5x" },
            { key: 0.75, display: "0.75x" },
            { key: 1, display: "1.0x" },
            { key: 1.25, display: "1.25x" },
            { key: 1.5, display: "1.5x" },
            { key: 2, display: "2.0x" },
        ];

        // Expose setIsVisible to parent via ref
        useImperativeHandle(ref, () => ({
            setIsVisible,
        }));

        useEffect(() => {
            if (!isPlaying || showSpeed) {
                setIsVisible(true);
                return;
            }

            if (isPlaying) {
                setTimeout(() => {
                    setIsVisible(false);
                }, 4000);
            }
        }, [isVisible, isPlaying]);

        const showControls = () => {
            setIsVisible(true);
            setIsMouseActive(true);
            if (isPlaying) {
                setTimeout(() => {
                    setIsVisible(false);
                }, 4000);
            }
        };

        const handleMouseMove = () => {
            setIsMouseActive(true);
            setTimeout(() => {
                setIsMouseActive(false);
            }, 4000);
        };

        const hideControls = () => {
            setIsVisible(false);
        };

        return (
            <div
                className={`absolute z-2 top-0 left-0 flex flex-col justify-between h-full w-full  transition-opacity duration-300 ${
                    isVisible ? "opacity-100" : "opacity-0"
                } ${!isVisible && !isMouseActive ? "hide-cursor" : ""}`}
                onMouseEnter={showControls}
                onMouseLeave={hideControls}
                onTouchStart={showControls}
                onMouseMove={handleMouseMove}
                onTouchEnd={() => {
                    setTimeout(hideControls, 4000);
                }}
            >
                {/* top controls */}
                <div className="w-full flex justify-between items-start bg-linear-0 from-[#26262600] to-[#0f0f0fd2] px-3 pb-2 pt-3">
                    <p className={`font-bold ml-2 flex flex-col lg:font-normal ${isFullScreen ? "text-lg lg:text-3xl" : "lg:text-xl lg:ml-2"} `}>
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
                        step={0.01}
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
                        <div className={`flex gap-3 lg:gap-5 items-center ${isFullScreen ? "lg:gap-8" : ""}`}>
                            <div
                                className={`relative min-w-18 text-center px-2 py-1 rounded-lg transition duration-200 cursor-pointer hover:bg-[#26262637] ${
                                    isFullScreen ? " lg:text-xl" : ""
                                }`}
                                onClick={() => setShowSpeed(!showSpeed)}
                            >
                                <span> {playBackSpeeds.find((p) => p.key === speed).display}</span>

                                {showSpeed && (
                                    <div className="absolute z-5 mb-10 backdrop-blur-xs bg-[#26262652] bottom-0 rounded-t-xl left-0 min-w-18 text-center  py-1 ">
                                        {playBackSpeeds.map(({ key, display }) => (
                                            <div
                                                key={key}
                                                onClick={() => setSpeed(key)}
                                                className={`mb-1 text-[1rem] border-b-1 border-[#787878a5] py-1 cursor-pointer ${
                                                    key === speed ? "bg-[#605f5f93]" : ""
                                                }`}
                                            >
                                                {display}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
            </div>
        );
    }
);

export default Controls;
