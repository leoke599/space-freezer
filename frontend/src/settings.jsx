import { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";

function Settings() {
    const [s, setS] = useState({});
    const [saving, setSaving] = useState(false);
    
    const fetchSettings = () => {
        fetch(`${API_BASE_URL}/settings`)
            .then(r => r.json())
            .then(setS);
    };
    useEffect(fetchSettings, []);

    const upd = (k,v) => setS(s=>({...s,[k]:v}));

    const save = () => {
        setSaving(true);
        fetch(`${API_BASE_URL}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s)
        })
        .then(() => setSaving(false));
    };

    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "dark"
    );

    useEffect(() => {
        if (theme === "dark") {
        document.documentElement.classList.add("dark");
        } else {
        document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

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
                Settings
            </span>
            </div>

            {/* Settings Page Content */}
            <div className="max-w-5xl mx-auto px-4 pb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">⚙️ System Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Appearance Section */}
                    <section className="app-card border border-[var(--color-border-subtle)] rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🎨</span>
                            <h3 className="text-lg font-bold">Appearance</h3>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[var(--color-panel)] rounded-lg">
                            <div>
                                <div className="font-semibold">Theme Mode</div>
                                <div className="text-sm text-muted">Choose your preferred color scheme</div>
                            </div>
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="px-6 py-3 rounded-lg border-2 border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)] transition-colors font-semibold"
                            >
                                {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                            </button>
                        </div>
                    </section>

                    {/* Temperature Section */}
                    <section className="app-card border border-[var(--color-border-subtle)] rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🌡️</span>
                            <h3 className="text-lg font-bold">Temperature Thresholds</h3>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Number label="Target Temp (°C)" val={s.target_temp_c} onChange={v=>upd("target_temp_c", v)} step="0.1"/>
                            <Number label="Nominal Min (°C)" val={s.temp_nominal_min} onChange={v=>upd("temp_nominal_min", v)} step="0.1"/>
                            <Number label="Nominal Max (°C)" val={s.temp_nominal_max} onChange={v=>upd("temp_nominal_max", v)} step="0.1"/>
                            <Number label="Critical High (°C)" val={s.temp_critical_high} onChange={v=>upd("temp_critical_high", v)} step="0.1"/>
                            <Number label="Critical Low (°C)" val={s.temp_critical_low} onChange={v=>upd("temp_critical_low", v)} step="0.1"/>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="text-sm">
                                <span className="font-semibold">💡 Info:</span> These values determine the color coding on the Temperature page
                                <div className="mt-1 text-xs text-muted">
                                    🟢 Optimal: between Nominal Min and Max | 🟡 Warning: outside nominal but not critical | 🔴 Critical: beyond critical thresholds
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Alerts Section */}
                    <section className="app-card border border-[var(--color-border-subtle)] rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🔔</span>
                            <h3 className="text-lg font-bold">Alert Notifications</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="text-sm">
                                <span className="font-semibold">💡 About Alerts:</span> The system automatically creates popup notifications for:
                                <ul className="mt-2 ml-4 space-y-1 text-xs">
                                    <li>🚨 <strong>Critical:</strong> Expired inventory items, severe temperature issues</li>
                                    <li>⚠️ <strong>Warning:</strong> Items expiring within 2 days, sensor faults</li>
                                    <li>ℹ️ <strong>Info:</strong> Items expiring soon (within 7 days)</li>
                                </ul>
                                <div className="mt-2 text-xs text-muted">
                                    Alerts appear as popup cards in the top-right corner and can be dismissed by clicking the ✕ button. The system checks for new alerts every 5 minutes.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={fetchSettings}
                            className="px-6 py-3 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)] transition-colors"
                        >
                            ↻ Reset Changes
                        </button>
                        <button 
                            onClick={save} 
                            className={`px-6 py-3 rounded-lg transition-colors font-semibold ${
                                saving 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                            disabled={saving}
                        >
                            {saving ? "💾 Saving..." : "💾 Save Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Number({label,val,onChange,step}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-muted mb-2">{label}</div>
      <input 
        type="number" 
        step={step||"1"} 
        value={val ?? ""}
        onChange={e=>{
          const v = e.target.value;
          onChange(v === "" ? undefined : parseFloat(v));
        }}
        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-3 text-[var(--color-text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </label>
  );
}

function Toggle({label,val,onChange}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input 
        type="checkbox" 
        checked={!!val} 
        onChange={e=>onChange(e.target.checked)}
        className="w-5 h-5 rounded border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

export default Settings;