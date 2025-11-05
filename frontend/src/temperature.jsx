import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend
);

export default function Temperature() {
  const [data, setData] = useState([]);
  const [sensorStatus, setSensorStatus] = useState(null);

  const dismissAlert = (alertId) => {
    axios.post(`${API_BASE_URL}/alerts/${alertId}/acknowledge`)
      .then(() => {
        // Refresh sensor status after dismissing
        axios.get(`${API_BASE_URL}/temperature/status`)
          .then((res) => setSensorStatus(res.data))
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error("Error dismissing alert:", err));
  };

  useEffect(() => {
    const fetchData = () => {
      axios.get(`${API_BASE_URL}/temperature`)
        .then((res) => setData(res.data))
        .catch((err) => console.error(err));
    };

    const fetchSensorStatus = () => {
      axios.get(`${API_BASE_URL}/temperature/status`)
        .then((res) => setSensorStatus(res.data))
        .catch((err) => console.error(err));
    };

    fetchData();
    fetchSensorStatus();
    const interval = setInterval(() => {
      fetchData();
      fetchSensorStatus();
    }, 60000); // update every 60s

    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Temperature (°C)",
        data: data.map(item => item.temperature),
        borderColor: "rgb(75,192,192)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 20, // Limit visible ticks
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Temperature Over Time'
      }
    }
  };

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
        Temperature
      </span>
      </div>

        {/* Temperature Page Content */}
        <div className="p-4 flex justify-center">
          <div className="w-[90%] max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">Temperature Monitoring</h1>

            {/* Sensor Status Banner */}
            {sensorStatus && sensorStatus.status !== "ok" && (
              <div className={`mb-4 p-4 rounded-lg border ${
                sensorStatus.status === "fault" 
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600" 
                  : "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600"
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {sensorStatus.status === "fault" ? "⚠️" : "🔌"}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {sensorStatus.status === "fault" ? "Sensor Fault Detected" : "No Sensor Data"}
                    </h3>
                    <p className="text-sm">
                      {sensorStatus.message}
                    </p>
                    {sensorStatus.status === "fault" && (
                      <p className="text-sm mt-2 italic">
                        💡 Tip: Check if the sensor connection is secure or if the resistor has moved.
                      </p>
                    )}
                  </div>
                  {sensorStatus.alert_id && (
                    <button
                      onClick={() => dismissAlert(sensorStatus.alert_id)}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Dismiss this alert"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* OK Status Indicator */}
            {sensorStatus && sensorStatus.status === "ok" && (
              <div className="mb-4 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span className="text-sm font-medium">Sensor operating normally</span>
                </div>
              </div>
            )}

            {/* Contained scrollable chart box */}
            <div className="app-card border border-[var(--color-border-subtle)] p-4 h-[60vh] overflow-x-auto w-[80%] shadow-sm">
              <div style={{ width: Math.max(800, data.length * 50), height: '100%' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
