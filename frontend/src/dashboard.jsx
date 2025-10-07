import { useEffect, useState } from "react";
import axios from "axios";
import MiniSensorCard from "./MiniSensorCard";
import ExpiryBanner from "./ExpiryBanner";
import MissionPanel from "./MissionPanel";

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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

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
        Dashboard
      </span>
      </div>
      {/* Mission Panel View */}
      <MissionPanel />
      {/* Expiry Banner */}
      <ExpiryBanner />
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
