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
  const [timeRange, setTimeRange] = useState("all"); // all, hour, day, week
  const [lastUpdate, setLastUpdate] = useState(null);
  const [settings, setSettings] = useState({
    temp_nominal_min: -2,
    temp_nominal_max: 2,
    temp_critical_low: -5,
    temp_critical_high: 5
  });

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
        .then((res) => {
          setData(res.data);
          setLastUpdate(new Date());
        })
        .catch((err) => console.error(err));
    };

    const fetchSensorStatus = () => {
      axios.get(`${API_BASE_URL}/temperature/status`)
        .then((res) => setSensorStatus(res.data))
        .catch((err) => console.error(err));
    };

    const fetchSettings = () => {
      axios.get(`${API_BASE_URL}/settings`)
        .then((res) => {
          setSettings({
            temp_nominal_min: res.data.temp_nominal_min ?? -2,
            temp_nominal_max: res.data.temp_nominal_max ?? 2,
            temp_critical_low: res.data.temp_critical_low ?? -5,
            temp_critical_high: res.data.temp_critical_high ?? 5
          });
        })
        .catch((err) => console.error(err));
    };

    fetchData();
    fetchSensorStatus();
    fetchSettings();
    const interval = setInterval(() => {
      fetchData();
      fetchSensorStatus();
      fetchSettings(); // Also refresh settings in case they change
    }, 60000); // update every 60s

    return () => clearInterval(interval);
  }, []);

  // Filter data based on time range
  const getFilteredData = () => {
    if (timeRange === "all" || !data.length) return data;
    
    const now = new Date();
    const cutoff = new Date();
    
    switch(timeRange) {
      case "hour":
        cutoff.setHours(now.getHours() - 1);
        break;
      case "day":
        cutoff.setHours(now.getHours() - 24);
        break;
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.timestamp) >= cutoff);
  };

  const filteredData = getFilteredData();

  // Calculate statistics
  const getStats = () => {
    if (!filteredData.length) return null;
    
    const temps = filteredData.map(item => item.temperature);
    const current = temps[temps.length - 1];
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    
    // Calculate trend (compare last 10% vs first 10%)
    const segmentSize = Math.max(1, Math.floor(temps.length * 0.1));
    const recentAvg = temps.slice(-segmentSize).reduce((a, b) => a + b, 0) / segmentSize;
    const oldAvg = temps.slice(0, segmentSize).reduce((a, b) => a + b, 0) / segmentSize;
    const trend = recentAvg > oldAvg + 0.5 ? "rising" : recentAvg < oldAvg - 0.5 ? "falling" : "stable";
    
    return { current, min, max, avg, trend };
  };

  const stats = getStats();

  // Download CSV
  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Temperature (°C)\n"
      + filteredData.map(item => `${item.timestamp},${item.temperature}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `temperature_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = {
    labels: filteredData.map(item => {
      const date = new Date(item.timestamp);
      return timeRange === "all" || timeRange === "week" 
        ? date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        : date.toLocaleTimeString();
    }),
    datasets: [
      {
        label: "Temperature (°C)",
        data: filteredData.map(item => item.temperature),
        borderColor: "rgb(75,192,192)",
        backgroundColor: "rgba(75,192,192,0.1)",
        fill: true,
        tension: 0.3,
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
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">🌡️ Temperature Monitoring</h1>
            {lastUpdate && (
              <div className="text-sm text-muted">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
                <div className="text-xs text-muted mb-1">Current Temp</div>
                <div className="text-3xl font-bold text-blue-500">{stats.current.toFixed(1)}°C</div>
                <div className="text-xs mt-1 flex items-center gap-1">
                  {stats.trend === "rising" && <span className="text-red-500">↗️ Rising</span>}
                  {stats.trend === "falling" && <span className="text-blue-500">↘️ Falling</span>}
                  {stats.trend === "stable" && <span className="text-green-500">→ Stable</span>}
                </div>
              </div>
              
              <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
                <div className="text-xs text-muted mb-1">Average</div>
                <div className="text-3xl font-bold">{stats.avg}°C</div>
                <div className="text-xs mt-1 text-muted">Over selected range</div>
              </div>
              
              <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
                <div className="text-xs text-muted mb-1">Minimum</div>
                <div className="text-3xl font-bold text-blue-400">{stats.min.toFixed(1)}°C</div>
                <div className="text-xs mt-1 text-muted">Coldest reading</div>
              </div>
              
              <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
                <div className="text-xs text-muted mb-1">Maximum</div>
                <div className="text-3xl font-bold text-red-400">{stats.max.toFixed(1)}°C</div>
                <div className="text-xs mt-1 text-muted">Warmest reading</div>
              </div>
            </div>
          )}

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
              <div className="mb-6 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span className="text-sm font-medium">Sensor operating normally</span>
                </div>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange("hour")}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    timeRange === "hour"
                      ? "bg-blue-500 text-white"
                      : "app-panel border border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)]"
                  }`}
                >
                  Last Hour
                </button>
                <button
                  onClick={() => setTimeRange("day")}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    timeRange === "day"
                      ? "bg-blue-500 text-white"
                      : "app-panel border border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)]"
                  }`}
                >
                  24 Hours
                </button>
                <button
                  onClick={() => setTimeRange("week")}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    timeRange === "week"
                      ? "bg-blue-500 text-white"
                      : "app-panel border border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)]"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeRange("all")}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    timeRange === "all"
                      ? "bg-blue-500 text-white"
                      : "app-panel border border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)]"
                  }`}
                >
                  All Data
                </button>
              </div>
              
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Temperature Chart */}
            <div className="app-card border border-[var(--color-border-subtle)] p-6 rounded-lg shadow-sm mb-6">
              <div className="h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Temperature Ranges Info */}
            <div className="app-card border border-[var(--color-border-subtle)] rounded-lg shadow-sm p-4 mb-6">
              <h2 className="text-lg font-bold mb-3">📋 Temperature Ranges (from Settings)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-400 dark:border-green-600">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <div className="font-semibold text-sm">Optimal Range</div>
                    <div className="text-lg font-bold">{settings.temp_nominal_min}°C to {settings.temp_nominal_max}°C</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600">
                  <span className="text-2xl">🟡</span>
                  <div>
                    <div className="font-semibold text-sm">Warning Range</div>
                    <div className="text-sm font-mono">
                      {settings.temp_critical_low}°C to {settings.temp_nominal_min}°C
                      <br />
                      {settings.temp_nominal_max}°C to {settings.temp_critical_high}°C
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-600">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <div className="font-semibold text-sm">Critical Range</div>
                    <div className="text-sm font-mono">
                      ≤ {settings.temp_critical_low}°C
                      <br />
                      ≥ {settings.temp_critical_high}°C
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-muted">
                💡 You can adjust these ranges in the <a href="/Settings" className="text-blue-500 hover:underline">Settings</a> page
              </div>
            </div>

            {/* Recent Readings Table */}
            <div className="app-card border border-[var(--color-border-subtle)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 bg-[var(--color-panel)] border-b border-[var(--color-border-subtle)]">
                <h2 className="text-lg font-bold">Recent Readings</h2>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-panel)] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-muted">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-muted">
                        Temperature
                      </th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice().reverse().slice(0, 50).map((item, idx) => {
                      const temp = item.temperature;
                      
                      // Determine status based on settings
                      let status, statusColor;
                      if (temp <= settings.temp_critical_low || temp >= settings.temp_critical_high) {
                        status = "🔴 Critical";
                        statusColor = "bg-red-50 dark:bg-red-900/20";
                      } else if (temp < settings.temp_nominal_min || temp > settings.temp_nominal_max) {
                        status = "🟡 Warning";
                        statusColor = "bg-yellow-50 dark:bg-yellow-900/20";
                      } else {
                        status = "🟢 Optimal";
                        statusColor = "";
                      }
                      
                      return (
                        <tr key={idx} className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)] transition-colors ${statusColor}`}>
                          <td className="px-4 py-3">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            {temp.toFixed(1)}°C
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-[var(--color-panel)] border-t border-[var(--color-border-subtle)] text-sm text-muted">
                Showing last {Math.min(50, filteredData.length)} readings of {filteredData.length} total
              </div>
            </div>
        </div>
    </div>
  );
}
