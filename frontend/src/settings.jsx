import { useEffect, useState } from "react";


function Settings() {
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "dark"
    );

    useEffect(() => {
        if (theme === "dark") {
        document.documentElement.classList.add("dark");
        } else {
        document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <div className="min-h-screen">
            {/* Navigation drawer button */}
            <div
                id="drawer-navigation"
                className="fixed top-0 left-0 w-64 h-full bg-[#1a1a1a] text-white p-6 shadow-lg transform -translate-x-full transition-transform duration-300"
            >
                <button
                onClick={() =>
                    document.getElementById("drawer-navigation").classList.add("-translate-x-full")
                }
                className="mb-4 text-xl"
                >
                ✕
                </button>

                <nav className="flex flex-col gap-4">
                <a href="/" className="hover:text-gray-300">Dashboard</a>
                <a href="/Temperature" className="hover:text-gray-300">Temperature</a>
                <a href="/Power" className="hover:text-gray-300">Power</a>
                <a href="/Inventory" className="hover:text-gray-300">Inventory</a>
                <a href="/Settings" className="hover:text-gray-300">Settings</a>
                </nav>
            </div>
            <div className="flex items-center bg-[#0a0a0a] p-6 shadow-md border border-[#7e7e7e] mb-6">
            <button
                onClick={() =>
                document.getElementById("drawer-navigation").classList.toggle("-translate-x-full")
                }
                className="ml-4 font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border text-white hover:text-gray-300 cursor-pointer"
                type="button"
            >
                ☰
            </button>
            <span className="flex-1 text-center text-3xl font-bold text-white">
                Settings
            </span>
            </div>

            {/* Setting Page */}
            <div className="p-4">
                <h1 className="text-2xl font-bold text-white mb-4 not-dark:text-black">Settings (ts doesn't work)</h1>
                <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white transition"
                >
                {theme === "dark" ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
                </button>
            </div>
        </div>
    );
}


export default Settings;