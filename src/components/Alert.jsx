import { motion, AnimatePresence } from "framer-motion";

const Alert = ({ status, message }) => {
    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed top-5 left-1/2 -translate-x-1/2 w-[300px] rounded-xl flex flex-col px-3 py-2 bg-neutral-700 shadow-lg z-50"
        >
            <p className="text-xl text-neutral-200">{status}</p>
            <p className="text-[1rem] text-neutral-400">{message}</p>
        </motion.div>
    );
};

export default Alert;
