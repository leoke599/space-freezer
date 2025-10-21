// ExpiryBanner.jsx
import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";

export default function ExpiryBanner() {
  const [next, setNext] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_BASE_URL}/mission/panel`);
      const data = await res.json();
      setNext(data?.inventory?.next || []);
    }
    load();
    const id = setInterval(load, 30_000); // poll
    return () => clearInterval(id);
  }, []);

  if (!next.length) return null;

  const badge = (status) => {
    const map = {
      expired: "bg-red-600 text-white",
      urgent:  "bg-orange-500 text-white",
      soon:    "bg-yellow-500 text-black",
    };
    return map[status] || "bg-gray-300 text-black";
  };

  return (
    <div className="w-full rounded-xl p-3 mb-4 app-card border border-[var(--color-border-subtle)] shadow-sm">
      <div className="font-semibold mb-2">Expiring Items</div>
      <div className="flex flex-wrap gap-2">
        {next.map((n) => (
          <div key={n.id} className="px-3 py-1 rounded-lg border border-[var(--color-border-subtle)] flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${badge(n.status)}`}>{n.status.toUpperCase()}</span>
            <span className="text-sm">{n.name}</span>
            <span className="text-xs text-muted">
              {n.status === "expired" ? `${Math.abs(n.days)}d ago` : `in ${n.days}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
