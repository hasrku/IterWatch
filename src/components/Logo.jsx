import React from "react";
import { BiSolidCameraMovie } from "react-icons/bi";

const Logo = ({ size = "text-xl" }) => {
    return (
        <a
            href="/"
            className={`flex gap-1 font-bold items-center ${size} w-max`}
        >
            <BiSolidCameraMovie className="fill-red" />
            <p className="font-medium font-sans text-white">IterWatch</p>
        </a>
    );
};

export default Logo;
