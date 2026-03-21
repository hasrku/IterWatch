import { motion } from "framer-motion";

const PlayingAnimation = () => {
    // We'll keep the keyframes simple
    const keyframes = [0.2, 1, 0.4, 0.8, 0.2];

    return (
        <div className="flex items-end justify-center gap-[2px] h-3 w-6">
            {/* Bar 1 - Very Slow */}
            <motion.span
                animate={{ scaleY: keyframes }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="w-[2px] h-full bg-neutral-600 origin-bottom"
            />
            {/* Bar 2 - Medium Slow */}
            <motion.span
                animate={{ scaleY: keyframes }}
                transition={{
                    duration: 2.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                }}
                className="w-[2px] h-full bg-neutral-600 origin-bottom"
            />
            {/* Bar 3 - Slightly Faster but still calm */}
            <motion.span
                animate={{ scaleY: keyframes }}
                transition={{
                    duration: 2.0,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                }}
                className="w-[2px] h-full bg-neutral-600 origin-bottom"
            />
        </div>
    );
};

export default PlayingAnimation;
