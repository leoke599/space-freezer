import React from "react";
import { Link } from "react-router-dom";
import './index.css';

function Dashboard() {
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
        Dashboard
      </span>
      </div>

      {/* Drawer Component */}
      <div
        id="drawer-navigation"
        className="fixed top-0 left-0 z-40 w-64 h-screen p-4 overflow-y-auto transition-transform -translate-x-full"
        tabIndex="-1"
        aria-labelledby="drawer-navigation-label"
      >
        {/* drawer links go here later */}
      </div>

      {/* Main Page Content */}
      {/* Temperature */}
      <Link to="/temperature" className="text-3xl font-bold text-white ml-24">Temperature</Link>
      <div className="flex justify-center mt-4 h-screen">
        <div className="w-[90%] h-[60%] bg-gray rounded-lg shadow-md p-4 text-white flex items-center justify-center border-2 border-black">
          <h1 className="text-2xl">Filler (imagine its a graph)</h1>
        </div>
      </div>
      {/* Power Consumption */}
      <Link to="/power" className="text-3xl font-bold ml-24 text-white">Power Consumption</Link>
      <div className="flex justify-center mt-4 mb-8 h-screen">
        <div className="w-[90%] h-[60%] bg-gray rounded-lg shadow-md p-4 text-white flex items-center justify-center border-2 border-black">
          <h1 className="text-2xl">Filler (imagine its a graph)</h1>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
