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

            {/* Setting Page */}
            <div className="p-4">
                <h1 className="text-2xl font-bold">Settings</h1>
                <div id="light-mode" className="mb-4 text-white not-dark:text-black">
                    <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white transition"
                    >
                    {theme === "dark" ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
                    </button>
                </div>
            </div>
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                <section className="border rounded-2xl p-4">
                    <h3 className="font-semibold mb-3">Safety & Thresholds</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                    <Number label="Target Temp (°C)" val={s.target_temp_c} onChange={v=>upd("target_temp_c", v)} step="0.1"/>
                    <Number label="Nominal Min" val={s.temp_nominal_min} onChange={v=>upd("temp_nominal_min", v)} step="0.1"/>
                    <Number label="Nominal Max" val={s.temp_nominal_max} onChange={v=>upd("temp_nominal_max", v)} step="0.1"/>
                    <Number label="Critical High" val={s.temp_critical_high} onChange={v=>upd("temp_critical_high", v)} step="0.1"/>
                    <Number label="Critical Low" val={s.temp_critical_low} onChange={v=>upd("temp_critical_low", v)} step="0.1"/>
                    </div>
                </section>

                <section className="border rounded-2xl p-4">
                    <h3 className="font-semibold mb-3">Alerts</h3>
                    <Toggle label="Enable Alerts" val={!!s.alerts_enabled} onChange={v=>upd("alerts_enabled", v)}/>
                    <Number label="Alert Debounce (s)" val={s.alert_debounce_s} onChange={v=>upd("alert_debounce_s", v)} />
                </section>

                <button onClick={save} className="px-4 py-2 rounded-xl border">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}

function Number({label,val,onChange,step}) {
  return (
    <label className="text-sm">
      <div className="text-neutral-400 mb-1">{label}</div>
      <input type="number" step={step||"1"} value={val ?? ""}
        onChange={e=>{
          const v = e.target.value;
          // send undefined when empty so parent state stays empty,
          // but keep input controlled by using "" for the value prop
          onChange(v === "" ? undefined : parseFloat(v));
        }}
        className="w-full rounded-lg bg-neutral-900 border p-2"/>
    </label>
  );
}
function Toggle({label,val,onChange}) {
  return (
    <label className="flex items-center gap-3">
      <input type="checkbox" checked={!!val} onChange={e=>onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

export default Settings;