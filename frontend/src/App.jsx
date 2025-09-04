import './App.css'
import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(res => res.json())
      .then(data => setMessage(data.message))
  }, []);

  return (
    <>
      {/* Background and font styles */}
      <div className="bg-[#505050] min-h-screen">
        {/* Navigation drawer button */}
        <div className="flex items-center h-16">
          <button
          style={{ color: "#242424" }}
          className="ml-4 font-medium rounded-lg text-lg px-3 py-3 w-9 h-9 flex items-center justify-center border-1"
          type="button"
          data-drawer-target="drawer-navigation"
          data-drawer-show="drawer-navigation"
          aria-controls="drawer-navigation">
          ☰
          </button>
        <span className="flex-1 text-center text-xl">Dashboard</span>
      </div>

        {/* Drawer Component */}
        <div id="drawer-navigation" className="fixed top-0 left-0 z-40 w-64 h-screen p-4 overflow-y-auto transition-transform -translate-x-full bg-gray-50" tabindex="-1" aria-labelledby="drawer-navigation-label">
        </div>
        {/* Main Content */}
        <h1 className="text-2xl"> Kyle </h1>
        <div>
          <h1>{message}</h1>
        </div>
      </div>
    </>
  )
}

export default App