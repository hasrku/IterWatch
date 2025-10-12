import React, { useState } from "react";

const PlaylistCreator = ({ showAlert }) => {
    const [name, setName] = useState("");
    const [links, setLinks] = useState([]);
    const [linkInput, setLinkInput] = useState("");

    // Saves the playlist to localStorage
    const saveLinks = () => {
        if (!name || links.length === 0) {
            showAlert("Error", "Please fill in the playlist name, starting episode, and add at least one link.");
            return;
        }
        const playlist = {
            name,
            currentEp: 0,
            start: 1,
            epProgress: 0,
            links,
        };
        const existingPlaylists = JSON.parse(localStorage.getItem("playlists") || "[]");
        localStorage.setItem("playlists", JSON.stringify([...existingPlaylists, playlist]));
        showAlert("Success", "Playlist saved successfully!");

        // Reset the form fields after saving
        setName("");
        setLinks([]);
        setLinkInput("");
    };

    // Adds links from the textarea to the list when Enter is pressed
    const handleLinkInputKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const newLinks = linkInput
                .split("\n")
                .map((link) => link.trim())
                .filter((link) => link); // Filter out any empty strings

            if (newLinks.length > 0) {
                setLinks((prevLinks) => [...prevLinks, ...newLinks]);
                setLinkInput(""); // Clear the textarea after adding
            }
        }
    };

    // Removes a specific link from the list
    const removeLink = (indexToRemove) => {
        setLinks((prevLinks) => prevLinks.filter((_, index) => index !== indexToRemove));
    };

    return (
        // Using `bg-bg` as the main background as requested
        <div className="bg-bg flex justify-center items-center font-sans w-full md:px-35">
            <div className="w-full p-0 sm:p-0 rounded-2xl shadow-lg ">
                <h1 className="text-2xl sm:text-2xl  text-center mb-8 text-neutral-200">Enter Links Manually</h1>

                <div className="flex flex-col lg:flex-row lg:gap-8">
                    {/* Left Column: Form Inputs */}
                    <div className="flex flex-col lg:w-1/2">
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Playlist Name"
                                // Using neutral shades inspired by your snippet
                                className="flex-grow bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-neutral-300 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-neutral-600 transition-all"
                            />
                        </div>
                        <textarea
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyDown={handleLinkInputKeyDown}
                            placeholder="Paste links here (one per line) and press Enter to add..."
                            className="w-full flex-grow min-h-[150px] bg-neutral-800 border border-neutral-700 p-3 rounded-lg text-neutral-300 placeholder-neutral-500 resize-y outline-none focus:ring-2 focus:ring-neutral-600 transition-all"
                        />
                    </div>

                    {/* Right Column: Added Links List */}
                    <div className="mt-8 lg:mt-0 lg:w-1/2 flex flex-col">
                        <h3 className="text-lg font-semibold text-neutral-400 border-b border-neutral-700 pb-2 mb-4">Added Links ({links.length})</h3>
                        <div className="flex-grow overflow-y-auto max-h-64 lg:max-h-[288px] pr-2">
                            {links.length > 0 ? (
                                links.map((link, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-center bg-neutral-800/50 px-3 py-2 rounded-md mb-2 text-sm"
                                    >
                                        <span className="truncate mr-4 text-neutral-300">{`Ep ${1 + index}: ${link}`}</span>
                                        <button
                                            onClick={() => removeLink(index)}
                                            className="text-neutral-500 text-2xl font-light hover:text-red-500 transition-colors"
                                            aria-label="Remove link"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-center items-center h-full text-neutral-500">Links will appear here...</div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={saveLinks}
                    className="w-full p-4 mt-8 text-base font-bold text-neutral-200 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                    disabled={!name || links.length === 0}
                >
                    Save Playlist
                </button>
            </div>
        </div>
    );
};

export default PlaylistCreator;
