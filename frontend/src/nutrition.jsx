import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";

export default function Nutrition() {
  const [items, setItems] = useState([]);
  const [crewSize, setCrewSize] = useState(4);
  const [missionDays, setMissionDays] = useState(30);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 300,
    fat: 70,
    fiber: 25,
    sodium: 2300,
    sugar: 50,
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/items/`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Filter items that have nutrition data
  const itemsWithNutrition = items.filter(item => 
    item.calories || item.protein || item.carbs || item.fat
  );

  // Calculate total nutrition across all inventory
  const totalNutrition = itemsWithNutrition.reduce((acc, item) => {
    const qty = item.quantity || 1;
    return {
      calories: acc.calories + (item.calories || 0) * qty,
      protein: acc.protein + (item.protein || 0) * qty,
      carbs: acc.carbs + (item.carbs || 0) * qty,
      fat: acc.fat + (item.fat || 0) * qty,
      fiber: acc.fiber + (item.fiber || 0) * qty,
      sodium: acc.sodium + (item.sodium || 0) * qty,
      sugar: acc.sugar + (item.sugar || 0) * qty,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0 });

  // Calculate mission requirements (crew size × mission days × daily goals)
  const missionRequirements = {
    calories: dailyGoals.calories * crewSize * missionDays,
    protein: dailyGoals.protein * crewSize * missionDays,
    carbs: dailyGoals.carbs * crewSize * missionDays,
    fat: dailyGoals.fat * crewSize * missionDays,
    fiber: dailyGoals.fiber * crewSize * missionDays,
    sodium: dailyGoals.sodium * crewSize * missionDays,
    sugar: dailyGoals.sugar * crewSize * missionDays,
  };

  // Calculate days of food available per nutrient
  const daysAvailable = {
    calories: totalNutrition.calories / (dailyGoals.calories * crewSize),
    protein: totalNutrition.protein / (dailyGoals.protein * crewSize),
    carbs: totalNutrition.carbs / (dailyGoals.carbs * crewSize),
    fat: totalNutrition.fat / (dailyGoals.fat * crewSize),
    fiber: totalNutrition.fiber / (dailyGoals.fiber * crewSize),
    sodium: totalNutrition.sodium / (dailyGoals.sodium * crewSize),
  };

  const NutritionBar = ({ label, value, max, unit, color }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const days = value / (max / missionDays);
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{label}</span>
          <span className="text-muted">
            {value.toFixed(0)} / {max.toFixed(0)} {unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-muted mt-1">
          {days.toFixed(1)} days of supply ({percentage.toFixed(0)}% of {missionDays}-day mission)
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)] text-[var(--color-text-primary)] transition-colors">
      {/* Navigation drawer */}
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

      {/* Header */}
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
          Nutrition Dashboard
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Mission Settings */}
          <div className="app-card border border-[var(--color-border-subtle)] p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">🚀 Mission Parameters</h2>
            
            {/* Crew & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Crew Size</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={crewSize}
                  onChange={(e) => setCrewSize(parseInt(e.target.value) || 1)}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)]"
                />
                <p className="text-xs text-muted mt-1">Number of crew members</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mission Duration</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={missionDays}
                  onChange={(e) => setMissionDays(parseInt(e.target.value) || 1)}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)]"
                />
                <p className="text-xs text-muted mt-1">Days</p>
              </div>
            </div>

            {/* Daily Nutrition Goals */}
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted">Daily Nutrition Goals (per person)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Calories</label>
                <input
                  type="number"
                  min="1000"
                  max="5000"
                  step="100"
                  value={dailyGoals.calories}
                  onChange={(e) => setDailyGoals({...dailyGoals, calories: parseInt(e.target.value) || 2000})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">kcal</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Protein</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  step="5"
                  value={dailyGoals.protein}
                  onChange={(e) => setDailyGoals({...dailyGoals, protein: parseInt(e.target.value) || 50})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">g</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Carbs</label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={dailyGoals.carbs}
                  onChange={(e) => setDailyGoals({...dailyGoals, carbs: parseInt(e.target.value) || 300})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">g</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fat</label>
                <input
                  type="number"
                  min="20"
                  max="200"
                  step="5"
                  value={dailyGoals.fat}
                  onChange={(e) => setDailyGoals({...dailyGoals, fat: parseInt(e.target.value) || 70})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">g</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Fiber</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={dailyGoals.fiber}
                  onChange={(e) => setDailyGoals({...dailyGoals, fiber: parseInt(e.target.value) || 25})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">g</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sodium</label>
                <input
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={dailyGoals.sodium}
                  onChange={(e) => setDailyGoals({...dailyGoals, sodium: parseInt(e.target.value) || 2300})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">mg</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Sugar</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="5"
                  value={dailyGoals.sugar}
                  onChange={(e) => setDailyGoals({...dailyGoals, sugar: parseInt(e.target.value) || 50})}
                  className="w-full rounded border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-2 text-[var(--color-text-primary)] text-sm"
                />
                <p className="text-xs text-muted mt-1">g</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded">
              <p className="text-sm">
                <strong>Total Mission Requirements:</strong> {(dailyGoals.calories * crewSize * missionDays).toLocaleString()} calories, 
                {' '}{(dailyGoals.protein * crewSize * missionDays).toLocaleString()}g protein,
                {' '}{(dailyGoals.carbs * crewSize * missionDays).toLocaleString()}g carbs,
                {' '}{(dailyGoals.fat * crewSize * missionDays).toLocaleString()}g fat
                {' '}for {crewSize} crew × {missionDays} days
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted mb-1">Total Items</h3>
              <p className="text-3xl font-bold">{items.length}</p>
            </div>
            <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted mb-1">Items w/ Nutrition Data</h3>
              <p className="text-3xl font-bold">{itemsWithNutrition.length}</p>
            </div>
            <div className="app-card border border-[var(--color-border-subtle)] p-4 rounded-lg shadow-sm">
              <h3 className="text-sm text-muted mb-1">Total Calories Available</h3>
              <p className="text-3xl font-bold">{totalNutrition.calories.toFixed(0)}</p>
            </div>
          </div>

          {/* Total Nutrition Breakdown */}
          <div className="app-card border border-[var(--color-border-subtle)] p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">📊 Inventory vs. Mission Requirements</h2>
            <p className="text-sm text-muted mb-4">
              Combined nutrition from all {itemsWithNutrition.length} items compared to {missionDays}-day mission needs
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted">Macronutrients</h3>
                <NutritionBar 
                  label="Calories" 
                  value={totalNutrition.calories} 
                  max={missionRequirements.calories}
                  unit="kcal" 
                  color="bg-blue-500" 
                />
                <NutritionBar 
                  label="Protein" 
                  value={totalNutrition.protein} 
                  max={missionRequirements.protein}
                  unit="g" 
                  color="bg-red-500" 
                />
                <NutritionBar 
                  label="Carbohydrates" 
                  value={totalNutrition.carbs} 
                  max={missionRequirements.carbs}
                  unit="g" 
                  color="bg-yellow-500" 
                />
                <NutritionBar 
                  label="Fat" 
                  value={totalNutrition.fat} 
                  max={missionRequirements.fat}
                  unit="g" 
                  color="bg-purple-500" 
                />
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted">Other Nutrients</h3>
                <NutritionBar 
                  label="Fiber" 
                  value={totalNutrition.fiber} 
                  max={missionRequirements.fiber}
                  unit="g" 
                  color="bg-green-500" 
                />
                <NutritionBar 
                  label="Sodium" 
                  value={totalNutrition.sodium} 
                  max={missionRequirements.sodium}
                  unit="mg" 
                  color="bg-orange-500" 
                />
                <NutritionBar 
                  label="Sugar" 
                  value={totalNutrition.sugar} 
                  max={missionRequirements.sugar}
                  unit="g" 
                  color="bg-pink-500" 
                />
              </div>
            </div>
          </div>

          {/* Items with Nutrition Data */}
          <div className="app-card border border-[var(--color-border-subtle)] p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">🥗 Items by Nutrition</h2>
            
            {itemsWithNutrition.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p className="mb-2">No items with nutrition data yet.</p>
                <p className="text-sm">Add nutrition information when creating items in the Inventory page.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="text-left p-2 font-semibold uppercase tracking-wide text-xs text-muted">Item</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Qty</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Serving</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Cal</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Protein</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Carbs</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Fat</th>
                      <th className="text-center p-2 font-semibold uppercase tracking-wide text-xs text-muted">Fiber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsWithNutrition.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-panel)]">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-center text-muted">{item.serving_size || "-"}</td>
                        <td className="p-2 text-center">{item.calories ? `${item.calories} kcal` : "-"}</td>
                        <td className="p-2 text-center">{item.protein ? `${item.protein}g` : "-"}</td>
                        <td className="p-2 text-center">{item.carbs ? `${item.carbs}g` : "-"}</td>
                        <td className="p-2 text-center">{item.fat ? `${item.fat}g` : "-"}</td>
                        <td className="p-2 text-center">{item.fiber ? `${item.fiber}g` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="app-card border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span>💡</span> Mission Planning Guide
            </h3>
            <ul className="text-sm space-y-1 text-muted">
              <li>• Adjust crew size and mission duration to calculate requirements</li>
              <li>• Progress bars show how many days of food you have for the crew</li>
              <li>• Green bars (100%+) = enough food for the mission</li>
              <li>• Red/orange bars (&lt;100%) = need to stock up on those nutrients</li>
              <li>• Example: 4 crew × 30 days × 2000 cal/day = 240,000 calories needed</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
