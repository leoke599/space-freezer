import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import MiniSensorCard from "./MiniSensorCard";
import ExpiryBanner from "./ExpiryBanner";
import MissionPanel from "./MissionPanel";

export default function Dashboard() {
  const [tempData, setTempData] = useState([]);
  const [powerData, setPowerData] = useState([]);
  const [items, setItems] = useState([]);
  const [sensorStatus, setSensorStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = () => {
      axios.get(`${API_BASE_URL}/temperature`)
        .then(res => setTempData(res.data))
        .catch(err => console.error(err));

      axios.get(`${API_BASE_URL}/power`)
        .then(res => setPowerData(res.data))
        .catch(err => console.error(err));

      axios.get(`${API_BASE_URL}/items/`)
        .then(res => setItems(res.data))
        .catch(err => console.error(err));

      axios.get(`${API_BASE_URL}/temperature/status`)
        .then(res => setSensorStatus(res.data))
        .catch(err => console.error(err));

      // Fetch alerts (we'll create this endpoint)
      axios.get(`${API_BASE_URL}/alerts`)
        .then(res => setAlerts(res.data))
        .catch(err => console.error(err));
    };

    fetchData();
    const dataInterval = setInterval(fetchData, 60000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Calculate mission stats
  const itemsWithNutrition = items.filter(item => item.calories);
  const totalCalories = itemsWithNutrition.reduce((sum, item) => 
    sum + (item.calories || 0) * (item.quantity || 1), 0
  );
  const daysOfFood = totalCalories / (2000 * 4); // 4 crew members, 2000 cal/day

  // Calculate expiring items
  const getExpiringItems = () => {
    const today = new Date();
    const expiringSoon = items.filter(item => {
      if (!item.expiration_date) return false;
      const expiry = new Date(item.expiration_date);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });
    const expired = items.filter(item => {
      if (!item.expiration_date) return false;
      const expiry = new Date(item.expiration_date);
      return expiry < today;
    });
    return { expiringSoon: expiringSoon.length, expired: expired.length };
  };

  const expiryStats = getExpiringItems();
  const activeAlerts = alerts.filter(a => !a.is_acknowledged);
  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical");
  
  // Get latest sensor readings
  const latestTemp = tempData.length > 0 ? tempData[tempData.length - 1].temperature : null;
  const latestPower = powerData.length > 0 ? powerData[powerData.length - 1].power : null;

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
          <a href="/Nutrition" className="hover:text-blue-500">Nutrition</a>
          <a href="/Settings" className="hover:text-blue-500">Settings</a>
        </nav>
      </div>
      <div className="app-card p-6 shadow-md border border-[var(--color-border-subtle)] mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              document.getElementById("drawer-navigation").classList.toggle("-translate-x-full")
            }
            className="font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:text-blue-500 cursor-pointer"
            type="button"
          >
            ☰
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold">Mission Control Dashboard</h1>
            <p className="text-sm text-muted mt-1">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          <div className="w-9"></div> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* System Health */}
            <div className={`app-card border rounded-lg p-3 shadow-sm ${
              sensorStatus?.status === "ok" && activeAlerts.length === 0
                ? "border-green-400 dark:border-green-600"
                : criticalAlerts.length > 0
                ? "border-red-400 dark:border-red-600"
                : "border-yellow-400 dark:border-yellow-600"
            }`}>
              <div className="text-xs text-muted uppercase tracking-wide mb-1">System</div>
              <div className="text-xl font-bold">
                {sensorStatus?.status === "ok" && activeAlerts.length === 0 ? "✅ OK" : 
                 criticalAlerts.length > 0 ? "🔴 ALERT" : "⚠️ WARN"}
              </div>
              {activeAlerts.length > 0 && (
                <div className="text-xs text-muted mt-1">{activeAlerts.length} alert{activeAlerts.length !== 1 ? "s" : ""}</div>
              )}
            </div>

            {/* Food Supply */}
            <div className="app-card border border-[var(--color-border-subtle)] rounded-lg p-3 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wide mb-1">Food Supply</div>
              <div className="text-xl font-bold">
                {daysOfFood > 0 ? `${daysOfFood.toFixed(0)} days` : "N/A"}
              </div>
              <div className="text-xs text-muted mt-1">{itemsWithNutrition.length} tracked</div>
            </div>

            {/* Total Items */}
            <div className="app-card border border-[var(--color-border-subtle)] rounded-lg p-3 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wide mb-1">Total Items</div>
              <div className="text-xl font-bold">{items.length}</div>
              <div className="text-xs text-muted mt-1">in inventory</div>
            </div>

            {/* Quick Actions */}
            <div className="app-card border border-[var(--color-border-subtle)] rounded-lg p-3 shadow-sm flex flex-col justify-center">
              <a href="/Inventory" className="text-sm font-medium text-blue-500 hover:text-blue-600 mb-1">
                📦 Inventory
              </a>
              <a href="/Nutrition" className="text-sm font-medium text-green-500 hover:text-green-600">
                🥗 Nutrition
              </a>
            </div>
          </div>

          {/* Mission Panel - Your existing component with sensor gauges */}
          <MissionPanel />
        </div>
      </div>
      {/* Expiry Banner - Your existing component */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <ExpiryBanner />
        </div>
      </div>
      
      {/* Sensor Data Graphs */}
      <div className="p-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold mb-6">📊 Sensor Trends</h2>
          <div className="space-y-8">
            <div className="w-full">
              <MiniSensorCard
                title="Temperature"
                color="rgb(75,192,192)"
                data={tempData}
                valueKey="temperature"
                unit="°C"
              />
            </div>
            <div className="w-full">
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
      </div>
    </div>
  );
}
