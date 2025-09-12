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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2 border p-4 rounded mb-4">
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
              <td className="border px-2">{item.name}</td>
              <td className="border px-2">{item.quantity}</td>
              <td className="border px-2">{item.location || "-"}</td>
              <td className="border px-2">{item.expiration_date || "-"}</td>
              <td className="border px-2 font-mono">{item.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
