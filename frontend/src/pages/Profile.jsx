import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import Navbar from "../components/Navbar";
import { NBCard, NBProgress, NBBadge } from "../components/nb";
import { Award, Zap } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => { (async () => { const { data } = await api.get("/me/stats"); setStats(data); })(); }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="profile-page">
        <NBCard className="p-6 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 nb-border flex items-center justify-center text-3xl font-display font-black" style={{ background: user.avatar_color || "#FFE156" }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="label-caps">{user.role}</div>
            <h1 className="font-display font-black text-4xl uppercase">{user.name}</h1>
            <div className="text-sm text-[#4A4A4A]">{user.email}</div>
          </div>
          <NBBadge color="#C4A1FF">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}</NBBadge>
        </NBCard>

        {user.role === "student" && stats && (
          <>
            <div className="grid md:grid-cols-3 gap-5">
              <NBCard color="yellow" className="p-6">
                <Zap className="w-8 h-8 mb-2" strokeWidth={2.5} />
                <div className="label-caps">Level</div>
                <div className="font-display font-black text-5xl">{stats.level}</div>
                <div className="label-caps mt-2">{stats.xp} XP earned</div>
              </NBCard>
              <NBCard color="purple" className="p-6">
                <div className="label-caps">Next level</div>
                <div className="font-display font-black text-3xl mb-3">{stats.next_level_xp} XP</div>
                <NBProgress value={stats.progress_percent} color="#FFE156" />
              </NBCard>
              <NBCard color="teal" className="p-6">
                <div className="label-caps">Stats</div>
                <div className="font-mono text-lg font-bold mt-2">{stats.courses_enrolled} courses</div>
                <div className="font-mono text-lg font-bold">{stats.submissions_count} tasks</div>
                <div className="font-mono text-lg font-bold">{stats.earned_badges_count} badges</div>
              </NBCard>
            </div>

            <section>
              <h2 className="font-display font-black text-2xl uppercase mb-4">Badges</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {stats.badges.map((b) => (
                  <div key={b.id} className={`nb-border p-4 text-center ${b.earned ? "nb-shadow" : "opacity-40"}`} style={{ background: b.earned ? b.color : "#fff" }} data-testid={`profile-badge-${b.id}`}>
                    <Award className="w-8 h-8 mx-auto mb-1" strokeWidth={2.5} />
                    <div className="font-display font-black text-sm leading-tight">{b.name}</div>
                    <div className="text-[0.65rem] mt-1">{b.description}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
