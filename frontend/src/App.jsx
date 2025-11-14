import './App.css'
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Temperature from './temperature';
import Inventory from './inventory';
import Dashboard from './dashboard';
import Power from './power';
import Settings from './settings';
import Nutrition from './nutrition';
import AlertNotifications from './AlertNotifications';

function App() {
  return (
    <Router>
      <AlertNotifications />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/temperature" element={<Temperature />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/power" element={<Power />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
