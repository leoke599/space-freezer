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

function Power() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      axios.get(`${API_BASE_URL}/power`)
        .then((res) => setData(res.data))
        .catch((err) => console.error(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // update every 60s

    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Power (W)",
        data: data.map(item => item.power),
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
        text: 'Power Usage Over Time'
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
                Power
            </span>
            </div>

          {/* PowerPage Content */}
          <div className="p-4 flex justify-center">
            <div className="w-[90%] max-w-4xl">
              <h1 className="text-2xl font-bold mb-4">Power Usage Monitoring</h1>

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


export default Power;
