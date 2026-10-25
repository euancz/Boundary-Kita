
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (!username.trim() || !password) {
      return;
    }

    // UI demonstration only.
    // Django authentication will be added later.
    navigate("/dashboard");
  }

  return (
    <div className="login-wrapper">
      <div className="storyboard-page login-card">
        <header className="storyboard-header">
          BOUNDARY-KITA
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="jeepney-logo">JEEP</div>

          <h3>Operator Login</h3>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-navy" type="submit">
            LOG IN
          </button>

          <a href="#forgot-password">Forgot password?</a>
        </form>
      </div>
    </div>
  );
}
