// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import "./styles/App.scss";


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
            {/* Login routes */}
            <Route
              path="/login"
              element={<Login onLogin={() => setLoggedIn(true)} />}
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <>
            {/* Protected routes */}
             {/* Default redirect when logged in */}
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
            
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
