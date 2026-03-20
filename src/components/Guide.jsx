import Logo from "./Logo";
import ListSidebar from "./ListSidebar";

const Guide = () => {
    return (
        <div className="bg-bg min-h-screen relative text-white px-2 md:px-8 lg:px-16 pt-5 overflow-hidden">
            <div className="flex flex-row items-center justify-between">
                <Logo size="text-2xl" />

                <ListSidebar />
            </div>
            <div className="flex justify-center flex-1 items-start pt-4 bg-bg mb-5">
                <div className="w-full max-w-4xl bg-neutral-900 p-6 sm:p-8 rounded-2xl shadow-lg border border-neutral-800 text-neutral-400">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-neutral-200">How It Works</h1>
                    <div className="space-y-10">
                        {/* 1st option */}
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-300 mb-3 border-b border-neutral-700 pb-2">1. Manual Mode</h2>
                            <p className="mb-4">This mode is for when you already have a list of direct video links.</p>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <li>
                                    <span className="font-semibold text-neutral-300">Name Your Playlist:</span> Enter a descriptive name.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Set Starting Episode:</span> Input the number of the first video
                                    in your list.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Paste Links:</span> Add your video URLs into the large text area,
                                    with each link on a new line.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Add to List:</span> Simply press the{" "}
                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                                        Enter
                                    </kbd>{" "}
                                    key to move the links to the "Added Links" section.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Save:</span> Once your list is complete, click "Save Playlist".
                                </li>
                            </ol>
                        </div>
                        {/* 2nd option */}
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-300 mb-3 border-b border-neutral-700 pb-2">2. Iteration Mode</h2>
                            <p className="mb-4">Use this mode for links that follow a numerical sequence (e.g., `.../ep-01.mp4`, `.../ep-02.mp4`).</p>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <li>
                                    <span className="font-semibold text-neutral-300">Enter Base Link:</span> Paste the common part of the URL. Replace
                                    the episode number with hashes (`#`).
                                </li>
                                <li className="pl-4 text-neutral-500 text-sm">
                                    Example: <code className="bg-neutral-800 px-1 rounded">https://.../episode-##.mp4</code> for numbers like 01, 02.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Define Range:</span> Set the "Start" and "End" episode numbers
                                    for the sequence.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Generate Links:</span> Click the "Generate" button to create the
                                    full list of links automatically.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Name and Save:</span> Give your generated playlist a name and
                                    save it.
                                </li>
                            </ol>
                        </div>
                        {/* 3rd option */}
                        <div>
                            <h2 className="text-2xl font-semibold text-neutral-300 mb-3 border-b border-neutral-700 pb-2">3. Local Video Mode</h2>
                            <p className="mb-4">Use this mode to load and play video files directly from your device.</p>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <li>
                                    <span className="font-semibold text-neutral-300">Load Video:</span> Click the "Load Video" button to open your
                                    device's file picker.
                                </li>
                                <li>
                                    <span className="font-semibold text-neutral-300">Select File:</span> Choose any video file from your device.
                                </li>

                                <li>
                                    <span className="font-semibold text-neutral-300">Change Video:</span> Click "Load Another Video" anytime to select
                                    a different file.
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Guide;
