import { Line } from "react-chartjs-2";


export default function MiniSensorCard({ title, color, data, valueKey, unit }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a1a] text-white p-8 rounded-2xl shadow-lg w-full h-64 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const recent = data.slice(-10);
  const latest = recent.at(-1)?.[valueKey];

  const chartData = {
    labels: recent.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        data: recent.map(d => d[valueKey]),
        borderColor: color,
        fill: false,
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-[#1a1a1a] text-white p-8 rounded-2xl shadow-lg flex flex-col justify-between w-full h-64">
      {/* Top section: title and latest value */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-5xl font-bold">{latest?.toFixed(1) ?? "--"} {unit}</p>
      </div>

      {/* Bottom section: chart */}
      <div className="flex-1">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
