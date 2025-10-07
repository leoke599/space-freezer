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
        <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)] transition-colors">
            {/* Navigation drawer button */}
            <div
                id="drawer-navigation"
                className="fixed top-0 left-0 w-64 h-full app-card border-r border-[var(--color-border-subtle)] p-6 shadow-lg transform -translate-x-full transition-transform duration-300"
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
                <a href="/" className="hover:text-blue-500">Dashboard</a>
                <a href="/Temperature" className="hover:text-blue-500">Temperature</a>
                <a href="/Power" className="hover:text-blue-500">Power</a>
                <a href="/Inventory" className="hover:text-blue-500">Inventory</a>
                <a href="/Settings" className="hover:text-blue-500">Settings</a>
                </nav>
            </div>
            <div className="flex items-center app-card p-6 shadow-md border border-[var(--color-border-subtle)] mb-6">
            <button
                onClick={() =>
                document.getElementById("drawer-navigation").classList.toggle("-translate-x-full")
                }
                className="ml-4 font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:text-blue-500 cursor-pointer"
                type="button"
            >
                ☰
            </button>
            <span className="flex-1 text-center text-3xl font-bold">
                Settings
            </span>
            </div>

            {/* Setting Page */}
            <div className="p-4">
                <h1 className="text-2xl font-bold text-white mb-4 not-dark:text-black">Settings (ts doesn't work)</h1>
                <div id="light-mode" className="mb-4 text-white not-dark:text-black">
                    <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white transition"
                    >
                    {theme === "dark" ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default Settings;