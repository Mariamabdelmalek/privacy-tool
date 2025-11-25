// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Privacy Tool Logo" className="nav-logo" />
        <h2>Social Media Privacy Tool</h2>
      </div>

      <div className="nav-right">
        {/* React Router navigation */}
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/reports">Reports</Link>

        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
