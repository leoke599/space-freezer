import { useEffect, useState } from "react";
import axios from "axios";
import MiniSensorCard from "./MiniSensorCard";

export default function Dashboard() {
  const [tempData, setTempData] = useState([]);
  const [powerData, setPowerData] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      axios.get("http://127.0.0.1:8000/temperature")
        .then(res => setTempData(res.data))
        .catch(err => console.error(err));

      axios.get("http://127.0.0.1:8000/power")
        .then(res => setPowerData(res.data))
        .catch(err => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Sensor cards */}
      <div className="p-8 flex flex-col gap-8 items-center">
        <div className="w-[90%]">
          <MiniSensorCard
            title="Temperature"
            color="rgb(75,192,192)"
            data={tempData}
            valueKey="temperature"
            unit="°C"
          />
        </div>
        <div className="w-[90%]">
          <MiniSensorCard
            title="Power"
            color="rgb(255,99,132)"
            data={powerData}
            valueKey="power"
            unit="W"
          />
        </div>
      </div>
    </div>
  );
}
