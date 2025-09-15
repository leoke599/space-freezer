import { useEffect, useState } from "react";
import axios from "axios";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchItems();
  }, []);

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

  return (
    <div className="min-h-screen">
      {/* Navigation drawer button */}
      <div
        id="drawer-navigation"
        className="fixed top-0 left-0 w-64 h-full bg-[#1a1a1a] text-white p-6 shadow-lg transform -translate-x-full transition-transform duration-300"
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
          <a href="/" className="hover:text-gray-300">Dashboard</a>
          <a href="/Temperature" className="hover:text-gray-300">Temperature</a>
          <a href="/Power" className="hover:text-gray-300">Power</a>
          <a href="/Inventory" className="hover:text-gray-300">Inventory</a>
          <a href="/Settings" className="hover:text-gray-300">Settings</a>
        </nav>
      </div>
      <div className="flex items-center bg-[#0a0a0a] p-6 shadow-md border border-[#7e7e7e] mb-6">
      <button
        onClick={() =>
          document.getElementById("drawer-navigation").classList.toggle("-translate-x-full")
        }
        className="ml-4 font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border text-white hover:text-gray-300 cursor-pointer"
        type="button"
      >
        ☰
      </button>
      <span className="flex-1 text-center text-3xl font-bold text-white">
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
        <form onSubmit={handleSubmit} className="space-y-2 border p-4 rounded mb-4 text-white">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            required
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="border p-2 rounded w-full"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            step="0.1"
            value={tempReq}
            onChange={(e) => setTempReq(e.target.value)}
            placeholder="Temperature requirement"
            className="border p-2 rounded w-full"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </form>
      )}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2">Name</th>
            <th className="border px-2">Quantity</th>
            <th className="border px-2">Location</th>
            <th className="border px-2">Expiration</th>
            <th className="border px-2">Code</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 text-white border-black">{item.name}</td>
              <td className="border px-2 text-white border-black">{item.quantity}</td>
              <td className="border px-2 text-white border-black">{item.location || "-"}</td>
              <td className="border px-2 text-white border-black">{item.expiration_date || "-"}</td>
              <td className="border px-2 font-mono text-white border-black">{item.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
