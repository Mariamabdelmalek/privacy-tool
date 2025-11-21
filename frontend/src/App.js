// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Scan from './Scan';
import Login from './Login';
import Navbar from './components/Navbar';


import './styles/App.scss';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <Router>
      {loggedIn && <Navbar onLogout={handleLogout} />}

      <Routes>
        {!loggedIn ? (
          <>
            <Route 
              path="/login" 
              element={<Login onLogin={() => setLoggedIn(true)} />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/login" />} 
            />
          </>
        ) : (
          <>
          
            <Route path="/scan" element={<Scan />} />
            

            {/* If logged in but URL not found → go to dashboard */}
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
