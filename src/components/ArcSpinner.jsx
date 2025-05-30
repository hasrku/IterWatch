import React from "react";
import { motion } from "framer-motion";

const ArcSpinner = ({ color = "#3b82f6", size = 50, thickness = 4, speed = 1.0, trackColor = "transparent" }) => {
    return (
        <div className="relative h-full w-full">
            {/* Background track (optional) */}
            <motion.div
                style={{
                    border: `${thickness}px solid ${trackColor}`,
                }}
                className={`absolute w-full h-full rounded-full `}
            />

            {/* Animated arc */}
            <motion.div
                className={`absolute w-full h-full rounded-full `}
                style={{
                    border: `${thickness}px solid transparent`,
                    borderTopColor: color,
                }}
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed,
                }}
            />
        </div>
    );
};

export default ArcSpinner;
