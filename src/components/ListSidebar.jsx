import { useRef, useState } from "react";
import { IoMdClose, IoLogoGithub, IoIosMenu } from "react-icons/io";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

const ListSidebar = ({ right, top }) => {
    const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");

    const [isOpen, setIsOpen] = useState(false);
    const savedCities = useRef(null);

    const handleIconClick = () => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    };

    return (
        <>
            {!isOpen && (
                <div>
                    <IoIosMenu
                        className={`absolute z-40 right-3 lg:right-16 top-2 size-9 lg:size-11 cursor-pointer fill-white p-1 lg:p-2 rounded-full hover:bg-bglight`}
                        onClick={handleIconClick}
                    />
                </div>
            )}

            <div
                className={`fixed z-50 right-0 top-0 h-screen py-5 px-3 pt-14 rounded-l-xl flex flex-col text-white bg-bglight w-[320px] transition-transform duration-300 ${
                    isOpen ? " translate-x-0" : " translate-x-full"
                }`}
            >
                <IoMdClose
                    className={`absolute left-4 top-4 size-7 cursor-pointer`}
                    onClick={handleIconClick}
                />

                <h2 className={`text-2xl font-semibold text-center mb-6`}>Playlists</h2>
                <div
                    ref={savedCities}
                    className="flex relative flex-col justify-center w-full px-1 gap-4 text-textCol"
                >
                    {playlists.map((item, index) => {
                        return (
                            <Playlist
                                key={index}
                                name={item.name}
                                curr={item.currentEp}
                                epCount={item.links.length}
                            />
                        );
                    })}
                </div>

                <a
                    href="https://github.com/hasrku"
                    className="flex items-center absolute bottom-1 left-1/2 translate-x-[-50%]"
                >
                    <IoLogoGithub /> &nbsp;@
                    <span className="font-mono">hasrku</span>
                </a>
            </div>
            <div
                className={`w-screen h-screen bg-transparent absolute top-0 left-0 z-40 ${isOpen ? "block" : "hidden"}`}
                onClick={handleIconClick}
            ></div>
        </>
    );
};

const Playlist = ({ name, epCount, curr }) => {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    const handleRemove = () => {
        const playlists = JSON.parse(localStorage.getItem("playlists") || "[]");
        const updated = playlists.filter((p) => p.name !== name);
        localStorage.setItem("playlists", JSON.stringify(updated));
        setShowMenu(false);
        navigate(0);
    };

    return (
        <div className="relative">
            <Link
                to={`/watch/${name}`}
                className="mt-2 mx-1 px-4 py-3 bg-bgbg rounded-lg cursor-pointer block"
            >
                <p className="text-xl text-neutral-200 flex items-center ">
                    {name}
                    <span className="ml-2 text-sm text-neutral-500">
                        • {curr + 1} / {epCount} ep
                    </span>
                </p>
            </Link>

            <div
                className="absolute top-1/2 translate-y-[-50%] right-4 cursor-pointer z-20"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMenu(!showMenu);
                }}
            >
                <BsThreeDotsVertical className="text-neutral-400 size-6 hover:text-white" />
            </div>

            {showMenu && (
                <div className="absolute top-10 right-4 bg-neutral-800 shadow-lg p-2 rounded z-30">
                    <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={handleRemove}
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};

export default ListSidebar;
