import React from "react";
import { Link } from "react-router-dom";
import './index.css';

function Dashboard() {
  return (
    <div className="bg-[#505050] min-h-screen ">
      {/* Navigation drawer button */}
      <div className="flex items-center bg-gray-700 p-6 shadow-md">
        <button
          style={{ color: "#242424" }}
          className="ml-4 font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border-1"
          type="button"
          data-drawer-target="drawer-navigation"
          data-drawer-show="drawer-navigation"
          aria-controls="drawer-navigation"
        >
          ☰
        </button>
        <span className="flex-1 text-center text-3xl font-bold">Dashboard</span>
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
      <Link to="/temperature" className="text-3xl font-bold mt-20 ml-24 text-white">Temperature</Link>
      <div className="flex justify-center mt-8 h-screen">
        <div className="w-[90%] h-[60%] bg-gray rounded-lg shadow-md p-4 text-white flex items-center justify-center border-2 border-black">
          <h1 className="text-2xl">Filler (imagine its a graph)</h1>
        </div>
      </div>
      {/* Power Consumption */}
      <Link to="/power" className="text-3xl font-bold mt-8 ml-24 text-white">Power Consumption</Link>
      <div className="flex justify-center mt-8 mb-8 h-screen">
        <div className="w-[90%] h-[60%] bg-gray rounded-lg shadow-md p-4 text-white flex items-center justify-center border-2 border-black">
          <h1 className="text-2xl">Filler (imagine its a graph)</h1>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
