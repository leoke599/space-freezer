import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("check_out");
  const [scanCode, setScanCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const scanInputRef = useRef(null);

  // Form state
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [tempReq, setTempReq] = useState("");

  const fetchItems = () => {
    axios.get("http://127.0.0.1:8000/items/")
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err));
  };

  const toggleMode = (nextMode) => {
    if (mode !== nextMode) {
      setMode(nextMode);
      setFeedback(null);
      setScanCode("");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [mode, showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/items/", null, {
        params: {
          name,
          quantity,
          location,
          expiration_date: expirationDate || null,
          temperature_requirement: tempReq || null,
        },
      });
      setShowForm(false);
      setName("");
      setQuantity(1);
      setLocation("");
      setExpirationDate("");
      setTempReq("");
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) {
      return;
    }

    try {
      const endpoint = mode === "check_out" ? "check_out" : "check_in";
      const { data } = await axios.post(`http://127.0.0.1:8000/items/${scanCode}/${endpoint}`);

      if (data?.error) {
        setFeedback({ type: "error", message: data.error });
      } else {
        setFeedback({
          type: "success",
          message: data?.message || `Item ${mode === "check_out" ? "checked out" : "checked in"}.`,
        });
        fetchItems();
        setScanCode("");
      }
    } catch (err) {
      const message = err.response?.data?.detail || "Unable to process barcode.";
      setFeedback({ type: "error", message });
    } finally {
      if (scanInputRef.current) {
        scanInputRef.current.focus();
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
        Inventory
      </span>
      </div>

      {/* Inventory Header and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 app-card border border-[var(--color-border-subtle)] p-4 rounded-lg mb-4 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            required
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)]"
          />
          <input
            type="number"
            step="0.1"
            value={tempReq}
            onChange={(e) => setTempReq(e.target.value)}
            placeholder="Temperature requirement"
            className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      )}

      <div className="border border-[var(--color-border-subtle)] rounded-lg p-4 app-card mb-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleMode("check_out")}
              className={`px-4 py-2 rounded transition-colors ${
                mode === "check_out"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "app-panel border border-[var(--color-border-subtle)]"
              }`}
            >
              Check-Out Mode
            </button>
            <button
              type="button"
              onClick={() => toggleMode("check_in")}
              className={`px-4 py-2 rounded transition-colors ${
                mode === "check_in"
                  ? "bg-green-500 text-white shadow-sm"
                  : "app-panel border border-[var(--color-border-subtle)]"
              }`}
            >
              Check-In Mode
            </button>
          </div>
          <span className="text-sm text-muted">
            Barcode scanners typically press Enter for you after a code is read.
          </span>
        </div>
        <form onSubmit={handleScanSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            ref={scanInputRef}
            value={scanCode}
            onChange={(e) => {
              setFeedback(null);
              setScanCode(e.target.value.trim());
            }}
            placeholder={`Scan or enter item code to ${mode === "check_out" ? "check out" : "check in"}`}
            className="flex-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] placeholder:text-slate-500 dark:placeholder:text-slate-400"
            autoComplete="off"
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded ${mode === "check_out" ? "bg-blue-500" : "bg-green-500"} text-white`}
          >
            {mode === "check_out" ? "Check Out" : "Check In"}
          </button>
        </form>
        {feedback && (
          <div
            className={`mt-3 text-sm ${
              feedback.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      <table className="w-full border border-[var(--color-border-subtle)] text-left text-sm app-card shadow-sm">
        <thead>
          <tr className="bg-[var(--color-panel)]">
            <th className="border border-[var(--color-border-subtle)] px-2 py-2 font-semibold uppercase tracking-wide text-xs text-muted">
              Name
            </th>
            <th className="border border-[var(--color-border-subtle)] px-2 py-2 font-semibold uppercase tracking-wide text-xs text-muted">
              Quantity
            </th>
            <th className="border border-[var(--color-border-subtle)] px-2 py-2 font-semibold uppercase tracking-wide text-xs text-muted">
              Location
            </th>
            <th className="border border-[var(--color-border-subtle)] px-2 py-2 font-semibold uppercase tracking-wide text-xs text-muted">
              Expiration
            </th>
            <th className="border border-[var(--color-border-subtle)] px-2 py-2 font-semibold uppercase tracking-wide text-xs text-muted">
              Code
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-[var(--color-border-subtle)] even:bg-[var(--color-panel)]">
              <td className="border border-[var(--color-border-subtle)] px-2 py-2">{item.name}</td>
              <td className="border border-[var(--color-border-subtle)] px-2 py-2">{item.quantity}</td>
              <td className="border border-[var(--color-border-subtle)] px-2 py-2">{item.location || "-"}</td>
              <td className="border border-[var(--color-border-subtle)] px-2 py-2">{item.expiration_date || "-"}</td>
              <td className="border border-[var(--color-border-subtle)] px-2 py-2 font-mono">{item.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
