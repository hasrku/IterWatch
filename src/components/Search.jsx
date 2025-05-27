import { useState, useRef } from "react";
import { CiSearch } from "react-icons/ci";
import { IoCloseOutline, IoRefresh } from "react-icons/io5";

const Search = ({ baseLink, setBaseLink, showAlert }) => {
    const inputRef = useRef(null);
    const [name, setName] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [links, setLinks] = useState([]);

    const generateLinks = () => {
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        const hashMatch = baseLink.match(/#+/);
        if (!hashMatch || isNaN(startNum) || isNaN(endNum)) {
            showAlert("Error", "Invalid format. Please use the format like .##.");
            return;
        }

        const hashPattern = hashMatch[0];
        const padLength = hashPattern.length;

        const newLinks = [];
        for (let i = startNum; i <= endNum; i++) {
            const padded = i.toString().padStart(padLength, "0");
            const link = baseLink.replace(hashPattern, padded);
            newLinks.push(link);
        }
        setLinks(newLinks);
    };

    // Function to save links
    const saveLinks = () => {
        if (!name || links.length === 0) return;

        const playlist = {
            name,
            currentEp: 0,
            start: parseInt(start),
            epProgress: 0,
            links,
        };

        const existing = JSON.parse(localStorage.getItem("playlists") || "[]");

        existing.push(playlist);

        localStorage.setItem("playlists", JSON.stringify(existing));

        showAlert("Success", "Playlist saved successfully!");
    };

    return (
        <div className="flex mt-16 px-5 flex-col justify-center items-center">
            <p className="text-neutral-300 text-2xl">Usage</p>
            <p className="text-neutral-400 whitespace-pre-line">
                Direct video link with `###` (e.g., https://.../episode.###.mp4).{"\n"}
                `###` represents the part of the link where the episode number appears.{"\n"}
                For example, if the link is https://.../episode.05.mp4, it has only 2 digits for the episode number,{"\n"}
                so you should write: https://.../episode.##.mp4
            </p>

            <div className="w-full flex mt-10 justify-center items-center ">
                <input
                    type="text"
                    ref={inputRef}
                    placeholder="enter base link"
                    value={baseLink}
                    onChange={(e) => setBaseLink(e.target.value)}
                    className=" lg:text-xl pl-5 pr-13 max-w-3xl w-[100%] py-2 bg-bgbg rounded-l-4xl border-2 border-bglight"
                />
                <div className="flex relative justify-center items-center bg-bglight px-2 lg:px-4 py-1 lg:py-1.5 rounded-r-4xl cursor-pointer">
                    {baseLink && (
                        <div
                            className="absolute right-12 lg:right-17 rounded-full  top-1/2 transform -translate-y-1/2 p-2 text-white hover:bg-neutral-700/90"
                            onClick={() => {
                                setBaseLink("");
                                inputRef.current?.focus();
                            }}
                        >
                            <IoCloseOutline size={35} />
                        </div>
                    )}
                    <CiSearch size={35} />
                </div>
            </div>
            <p className="mt-12 text-center mb-5 text-xl lg:text-2xl">enter start and end episode</p>
            <div className="flex gap-4  justify-center">
                <input
                    type="number"
                    placeholder="Start"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-25 px-4 py-2 bg-bgbg border border-bglight rounded"
                />
                <input
                    type="number"
                    placeholder="End"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-25 px-4 py-2 bg-bgbg border border-bglight rounded"
                />
            </div>
            {links.length == 0 ? (
                <button
                    onClick={generateLinks}
                    disabled={!baseLink || !start || !end}
                    className={`mt-10 w-50 px-6 py-2 rounded font-semibold transition ${
                        !baseLink || !start || !end
                            ? "bg-bglight/50 text-gray-400 cursor-not-allowed"
                            : "bg-bglight cursor-pointer hover:bg-bglight/80"
                    }`}
                >
                    Generate Links
                </button>
            ) : (
                <>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                        placeholder="Name"
                        className="text-xl px-5 mt-10 pr-13  max-w-[450px] py-2 bg-bgbg rounded-4xl border-2 border-bglight"
                    />
                    <div className="flex mt-5 gap-4 justify-center">
                        <button
                            disabled={!name}
                            className={` w-max px-5 py-2 rounded transition ${
                                !name ? "bg-bglight/50 text-gray-400 cursor-not-allowed" : "bg-bglight cursor-pointer hover:bg-bglight/80"
                            }`}
                            onClick={saveLinks}
                        >
                            Save Links
                        </button>
                        <button
                            onClick={() => {
                                setLinks([]);
                            }}
                            className={` w-max px-5 py-2 rounded transition bg-bglight cursor-pointer hover:bg-bglight/80`}
                        >
                            <IoRefresh size={25} />
                        </button>
                    </div>
                </>
            )}

            <div className="mt-6 mb-6 space-y-1 ">
                {links.map((link, idx) => (
                    <div key={idx}>
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline break-all"
                        >
                            {link}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
