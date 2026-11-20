import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import LoginLayout from "../components/LoginLayout";
import { api } from "../api";
import { useAction } from "../hooks";

export default function Login({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const action = useAction();

  function handleLogin(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const username = fields.get("username").trim();
    const password = fields.get("password");
    if (!username || !password) return;

    action.run(async () => {
      onLogin(await api("session/login/", { method: "POST", body: { username, password } }));
    });
  }

  return (
    <LoginLayout>
      <div className="login-heading">
        <h1>Operator sign-in</h1>
        <p>Use your operator account to access the fleet dashboard.</p>
      </div>
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username"
            autoCapitalize="none" spellCheck={false} required />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" name="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" required />
            <button type="button" className="password-toggle" aria-controls="password"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {action.error && <p className="operation-error" role="alert">{action.error}</p>}
        <button className="btn btn-navy login-submit" type="submit" disabled={action.busy}>
          {action.busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </LoginLayout>
  );
}
