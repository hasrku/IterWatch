import React from "react";

const ToggleSwitch = ({ enabled, setEnabled, label }) => {
    return (
        <div className="flex items-center justify-between gap-4">
            {label && <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>}
            <button
                onClick={() => setEnabled(!enabled)}
                className={`${
                    enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
            >
                <span
                    className={`${
                        enabled ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                />
            </button>
        </div>
    );
};

export default ToggleSwitch;
