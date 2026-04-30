import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NBButton, NBCard, NBInput } from "../components/nb";
import { Zap, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") === "teacher" ? "teacher" : "student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const u = await register({ name, email, password, role });
      toast.success(`Welcome, ${u.name}!`);
      nav("/dashboard");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-6 nb-press inline-flex" data-testid="register-back-home">
          <div className="w-10 h-10 bg-[#FFE156] nb-border nb-shadow-sm flex items-center justify-center">
            <Zap className="w-6 h-6" strokeWidth={3} />
          </div>
          <span className="font-display font-black text-2xl">EduQuest</span>
        </Link>

        <NBCard className="p-8 space-y-5">
          <div>
            <h1 className="font-display font-black text-3xl uppercase">Sign up</h1>
            <p className="text-sm text-[#4A4A4A]">Start your quest in under a minute.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`nb-border p-4 nb-press text-left ${role === "student" ? "bg-[#C4A1FF] nb-shadow" : "bg-white"}`}
              data-testid="register-role-student"
            >
              <GraduationCap className="w-6 h-6 mb-2" />
              <div className="font-display font-black">Student</div>
              <div className="text-xs">Learn & earn XP</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`nb-border p-4 nb-press text-left ${role === "teacher" ? "bg-[#FFE156] nb-shadow" : "bg-white"}`}
              data-testid="register-role-teacher"
            >
              <BookOpen className="w-6 h-6 mb-2" />
              <div className="font-display font-black">Teacher</div>
              <div className="text-xs">Create & grade</div>
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-caps block mb-1.5">Full name</label>
              <NBInput required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" data-testid="register-name-input" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Email</label>
              <NBInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" data-testid="register-email-input" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Password</label>
              <NBInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 chars" data-testid="register-password-input" />
            </div>
            {error && <div className="nb-border bg-[#FF6B6B] text-white px-3 py-2 text-sm font-medium" data-testid="register-error">{error}</div>}
            <NBButton type="submit" variant="dark" className="w-full" disabled={loading} data-testid="register-submit-btn">
              {loading ? "Creating..." : `Create ${role} account`}
            </NBButton>
          </form>

          <div className="text-sm text-center">
            Already in? <Link to="/login" className="font-bold underline" data-testid="register-login-link">Log in</Link>
          </div>
        </NBCard>
      </div>
    </div>
  );
}
