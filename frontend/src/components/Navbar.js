// src\components\Navbar.js
import React from "react";
import logo from "../assets/logo.png";
export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Privacy Tool Logo" className="nav-logo" />
      <h2>Social Media Privacy Tool</h2>
      </div>
      <div className="nav-right">
        <a href="/">Dashboard</a>
        <a href="/report">Report</a>
        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
