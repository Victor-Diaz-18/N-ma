import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import Navbar from "../components/Navbar";
import { NBCard, NBProgress, NBBadge } from "../components/nb";
import { Award, Zap, BookOpen, Users, BarChart3 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [teacherStats, setTeacherStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (user?.role === "student") {
          const { data } = await api.get("/me/stats");
          setStats(data);
        } else if (user?.role === "teacher") {
          const { data } = await api.get("/me/teacher-stats");
          setTeacherStats(data);
        }
      } catch (e) { /* ignore */ }
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="profile-page">
        <NBCard className="p-6 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 nb-border flex items-center justify-center text-3xl font-display font-black" style={{ background: user.avatar_color || "#8BC34A" }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="label-caps">{user.role === "teacher" ? "profesor" : "estudiante"}</div>
            <h1 className="font-display font-black text-4xl uppercase text-[#1F5A2A]">{user.name}</h1>
            <div className="text-sm text-[#3E5A3E]">{user.email}</div>
          </div>
          <NBBadge color="#A5D6A7">Se unió el {user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES") : ""}</NBBadge>
        </NBCard>

        {user.role === "student" && stats && (
          <>
            <div className="grid md:grid-cols-3 gap-5">
              <NBCard color="yellow" className="p-6">
                <Zap className="w-8 h-8 mb-2" strokeWidth={2.5} />
                <div className="label-caps">Nivel</div>
                <div className="font-display font-black text-5xl">{stats.level}</div>
                <div className="label-caps mt-2">{stats.xp} XP ganados</div>
              </NBCard>
              <NBCard color="purple" className="p-6">
                <div className="label-caps">Siguiente nivel</div>
                <div className="font-display font-black text-3xl mb-3">{stats.next_level_xp} XP</div>
                <NBProgress value={stats.progress_percent} color="#8BC34A" />
              </NBCard>
              <NBCard color="teal" className="p-6">
                <div className="label-caps">Estadísticas</div>
                <div className="font-mono text-lg font-bold mt-2">{stats.courses_enrolled} cursos</div>
                <div className="font-mono text-lg font-bold">{stats.submissions_count} tareas</div>
                <div className="font-mono text-lg font-bold">{stats.earned_badges_count} insignias</div>
              </NBCard>
            </div>

            <section>
              <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A] mb-4">Insignias</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {stats.badges.map((b) => (
                  <div key={b.id} className={`nb-border p-4 text-center ${b.earned ? "nb-shadow" : "opacity-40"}`} style={{ background: b.earned ? b.color : (dark ? "#3f3f46" : "#d1d5db") }} data-testid={`profile-badge-${b.id}`}>
                    <Award className="w-8 h-8 mx-auto mb-1" strokeWidth={2.5} style={{ color: b.earned ? "#fff" : (dark ? "#71717a" : "#9ca3af") }} />
                    <div className="font-display font-black text-sm leading-tight" style={{ color: b.earned ? "#fff" : (dark ? "#d4d4d8" : "#374151") }}>{BADGE_NAMES_ES[b.id]?.name || b.name}</div>
                    <div className="text-[0.65rem] mt-1" style={{ color: b.earned ? "#fff" : (dark ? "#a1a1aa" : "#6b7280") }}>{BADGE_NAMES_ES[b.id]?.desc || b.description}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {user.role === "teacher" && teacherStats && (
          <div className="grid md:grid-cols-2 gap-5">
            <NBCard color="yellow" className="p-6">
              <BookOpen className="w-8 h-8 mb-2" strokeWidth={2.5} />
              <div className="label-caps">Mis cursos</div>
              <div className="font-display font-black text-5xl">{teacherStats.total_courses}</div>
            </NBCard>
            <NBCard color="purple" className="p-6">
              <Users className="w-8 h-8 mb-2" strokeWidth={2.5} />
              <div className="label-caps">Estudiantes totales</div>
              <div className="font-display font-black text-5xl">{teacherStats.total_students}</div>
            </NBCard>
            <NBCard color="teal" className="p-6">
              <BarChart3 className="w-8 h-8 mb-2" strokeWidth={2.5} />
              <div className="label-caps">Promedio general</div>
              <div className="font-display font-black text-5xl">{teacherStats.avg_score_percent}%</div>
            </NBCard>
            <NBCard className="p-6">
              <Award className="w-8 h-8 mb-2" strokeWidth={2.5} />
              <div className="label-caps">Entregas calificadas</div>
              <div className="font-display font-black text-5xl">{teacherStats.graded_submissions}</div>
              <div className="text-sm text-[#3E5A3E]">de {teacherStats.total_submissions} totales</div>
            </NBCard>
          </div>
        )}
      </main>
    </div>
  );
}

const BADGE_NAMES_ES = {
  first_enroll: { name: "Primeros Pasos", desc: "Te inscribiste en tu primer curso" },
  first_submission: { name: "Pionero", desc: "Entregaste tu primera actividad" },
  quiz_master: { name: "Maestro del Quiz", desc: "Sacaste 90%+ en un quiz" },
  level_5: { name: "Estrella Naciente", desc: "Llegaste al Nivel 5" },
  level_10: { name: "Erudito", desc: "Llegaste al Nivel 10" },
  three_courses: { name: "Polímata", desc: "Te inscribiste en 3+ cursos" },
};
