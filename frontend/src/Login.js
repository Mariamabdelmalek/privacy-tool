// src/Login.js
import React, { useState } from "react";
import { login, createAccount } from "./services/authService";
import './styles/App.scss';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await createAccount(username, password);
        alert("Account created! You can now log in.");
        setIsRegister(false);
      } else {
        const user = await login(username, password);
        localStorage.setItem("token", `fake-token-${user.username}`);
        onLogin();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2>{isRegister ? "Create Account" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Sign Up" : "Login"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <p>
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="toggle-btn">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
