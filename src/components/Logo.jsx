import React from "react";
import { BiSolidCameraMovie } from "react-icons/bi";

const Logo = ({ size = "text-xl" }) => {
    return (
        <a
            href="/"
            className={`flex gap-1 items-center ${size}`}
        >
            <BiSolidCameraMovie className="fill-red" />
            <p className="font-semibold font-sans text-white">IterWatch</p>
        </a>
    );
};

export default Logo;
