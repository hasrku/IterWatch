import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-bg text-white text-center px-6">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-2xl mb-2">Page Not Found</p>
            <p className="text-neutral-400 mb-6">The page you are looking for doesn't exist or has been moved.</p>
            <Link
                to="/"
                className="px-5 py-2 bg-bglight text-white rounded-md hover:bg-neutral-700 transition"
            >
                Go Home
            </Link>
        </div>
    );
};

export default NotFound;
