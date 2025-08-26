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
      <h1>Lunar Habitat</h1>
      <div>
        <h1>{message}</h1>
      </div>
    </>
  )
}

export default App