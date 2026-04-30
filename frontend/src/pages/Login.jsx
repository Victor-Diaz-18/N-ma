import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NBButton, NBCard, NBInput } from "../components/nb";
import { Zap } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}!`);
      nav("/dashboard");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-6 nb-press inline-flex" data-testid="login-back-home">
          <div className="w-10 h-10 bg-[#FFE156] nb-border nb-shadow-sm flex items-center justify-center">
            <Zap className="w-6 h-6" strokeWidth={3} />
          </div>
          <span className="font-display font-black text-2xl">EduQuest</span>
        </Link>

        <NBCard className="p-8 space-y-5">
          <div>
            <h1 className="font-display font-black text-3xl uppercase">Log in</h1>
            <p className="text-sm text-[#4A4A4A]">Back to your quest.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-caps block mb-1.5">Email</label>
              <NBInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@school.com" data-testid="login-email-input" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Password</label>
              <NBInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••" data-testid="login-password-input" />
            </div>
            {error && <div className="nb-border bg-[#FF6B6B] text-white px-3 py-2 text-sm font-medium" data-testid="login-error">{error}</div>}
            <NBButton type="submit" variant="dark" className="w-full" disabled={loading} data-testid="login-submit-btn">
              {loading ? "Logging in..." : "Log in"}
            </NBButton>
          </form>
          <div className="text-sm text-center">
            No account? <Link to="/register" className="font-bold underline" data-testid="login-register-link">Create one</Link>
          </div>
        </NBCard>
      </div>
    </div>
  );
}
