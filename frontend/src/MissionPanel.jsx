// MissionPanel.jsx
import { useEffect, useState } from "react";

function Card({ title, value, unit, status }) {
  const color = {
    nominal: "border-emerald-500",
    elevated: "border-amber-500",
    critical: "border-rose-600",
  }[status] || "border-neutral-500";
  return (
    <div className={`rounded-2xl p-4 border ${color} app-card shadow-sm`}>
      <div className="text-sm text-muted">{title}</div>
      <div className="text-3xl font-bold">{value}{unit && <span className="text-lg ml-1">{unit}</span>}</div>
      <div className="text-xs mt-1 uppercase tracking-wide text-muted">{status}</div>
    </div>
  );
}

export default function MissionPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("http://127.0.0.1:8000/mission/panel");
      setData(await res.json());
    }
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  const { temperature, power, humidity, inventory } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Temperature" value={temperature?.value?.toFixed(1)} unit={temperature?.unit} status={temperature?.status}/>
      <Card title="Power" value={power?.value?.toFixed(1)} unit={power?.unit} status={power?.status}/>
      <Card title="Humidity" value={humidity ? humidity.value?.toFixed(0) : "--"} unit={humidity ? humidity.unit : ""} status={humidity ? humidity.status : "nominal"}/>
      <div className="rounded-2xl p-4 border border-[var(--color-border-subtle)] app-card shadow-sm">
        <div className="text-sm text-muted">Inventory</div>
        <div className="text-3xl font-bold">{inventory.total} items</div>
        <div className="mt-2 text-xs">
          <div>Expired: <span className="text-rose-600 dark:text-rose-400">{inventory.expiring.expired}</span></div>
          <div>Urgent: <span className="text-orange-500 dark:text-orange-300">{inventory.expiring.urgent}</span></div>
          <div>Soon: <span className="text-yellow-500 dark:text-yellow-300">{inventory.expiring.soon}</span></div>
        </div>
      </div>
    </div>
  );
}
