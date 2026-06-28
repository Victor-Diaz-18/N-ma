import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { useTheme } from "../lib/theme";
import { useCourses } from "../hooks/useCourses";
import { useStats, useUpcoming, useSubmissions } from "../hooks/useGamification";
import Navbar from "../components/Navbar";
import { NBCard, NBButton, NBBadge, NBProgress } from "../components/nb";
import { DashboardSkeleton } from "../components/Skeleton";
import { BookOpen, Trophy, ClipboardList, Zap, Plus, FileCheck2, Award, CalendarClock, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />;
}

function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { stats, loading: statsLoading } = useStats();
  const { courses, loading: coursesLoading } = useCourses();
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { upcoming, loading: upcomingLoading } = useUpcoming();

  const loading = statsLoading || coursesLoading || submissionsLoading || upcomingLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E4] grain">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="student-dashboard">
        <div>
          <div className="label-caps text-[#3E5A3E]">Bienvenido</div>
          <h1 className="font-display font-black text-4xl sm:text-5xl uppercase text-[#1F5A2A]">{user.name}</h1>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          <NBCard color="yellow" className="md:col-span-3 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="label-caps">Tu rango</div>
                <div className="font-display font-black text-5xl mt-1">NV {stats?.level ?? "-"}</div>
                <div className="font-mono text-sm mt-1">{stats?.xp ?? 0} XP totales</div>
              </div>
              <Zap className="w-14 h-14" strokeWidth={2.5} />
            </div>
            <div className="mt-4">
              <div className="label-caps mb-1.5">Progreso al Nivel {stats ? stats.level + 1 : "?"}</div>
              <NBProgress value={stats?.progress_percent ?? 0} color="#A5D6A7" />
            </div>
          </NBCard>

          <NBCard className="md:col-span-3 p-6">
            <div className="label-caps">Insignias ganadas</div>
            <div className="font-display font-black text-4xl">{stats?.earned_badges_count ?? 0} <span className="text-[#3E5A3E] text-xl">/ {stats?.badges?.length ?? 6}</span></div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {stats?.badges?.map((b) => (
                <div key={b.id} className={`aspect-square nb-border flex items-center justify-center ${b.earned ? "" : "opacity-40"}`} style={{ background: b.earned ? b.color : (dark ? "#3f3f46" : "#d1d5db") }} title={b.name} data-testid={`dash-badge-${b.id}`}>
                  <Award className="w-6 h-6" strokeWidth={2.5} style={{ color: b.earned ? "#fff" : (dark ? "#71717a" : "#9ca3af") }} />
                </div>
              ))}
            </div>
          </NBCard>

          <NBCard color="teal" className="md:col-span-2 p-6">
            <div className="label-caps">Inscritos</div>
            <div className="font-display font-black text-5xl">{courses.length}</div>
            <div className="font-mono text-sm">Cursos activos</div>
          </NBCard>
          <NBCard color="purple" className="md:col-span-2 p-6">
            <div className="label-caps">Entregas</div>
            <div className="font-display font-black text-5xl">{submissions.length}</div>
            <div className="font-mono text-sm">Tareas hechas</div>
          </NBCard>
          <NBCard className="md:col-span-2 p-6">
            <Trophy className="w-8 h-8 mb-2" />
            <div className="label-caps">Clasificación</div>
            <Link to="/leaderboard"><NBButton className="w-full mt-2" variant="dark" data-testid="dash-leaderboard-btn">Ver ranking</NBButton></Link>
          </NBCard>
        </div>

        {/* Upcoming activities */}
        <section>
          <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A] mb-4 flex items-center gap-2">
            <CalendarClock className="w-6 h-6" /> Próximas actividades
          </h2>
          {upcoming.length === 0 ? (
            <NBCard className="p-6 text-sm text-[#3E5A3E]">No tienes actividades pendientes. ¡Buen trabajo!</NBCard>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {upcoming.map((u) => (
                <Link key={u.id} to={`/activities/${u.id}`} className="block nb-press" data-testid={`upcoming-${u.id}`}>
                  <NBCard className="p-4 flex items-start gap-3">
                    <div className="w-12 h-12 nb-border flex flex-col items-center justify-center font-display font-black flex-shrink-0" style={{ background: u.course_color || "#8BC34A" }}>
                      {u.due_date ? (
                        <>
                          <span className="text-[0.6rem] leading-none">{new Date(u.due_date).toLocaleDateString("es-ES", { month: "short" }).toUpperCase()}</span>
                          <span className="text-lg leading-none">{new Date(u.due_date).getDate()}</span>
                        </>
                      ) : (
                        <CalendarClock className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-1 flex-wrap">
                        <NBBadge color={u.type === "quiz" ? "#A5D6A7" : "#C5E1A5"}>{u.type === "quiz" ? "quiz" : "tarea"}</NBBadge>
                        <NBBadge color="#8BC34A">{u.xp_reward} XP</NBBadge>
                      </div>
                      <div className="font-display font-black mt-1 truncate">{u.title}</div>
                      <div className="text-xs text-[#3E5A3E] truncate">{u.course_title}</div>
                      {u.due_date && <div className="text-xs font-mono mt-0.5">Vence {new Date(u.due_date).toLocaleDateString("es-ES")}</div>}
                    </div>
                  </NBCard>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My courses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A]">Mis cursos</h2>
            <Link to="/courses"><NBButton variant="ghost" data-testid="dash-browse-courses-btn">Ver todos <Plus className="inline w-4 h-4 ml-1" /></NBButton></Link>
          </div>
          {courses.length === 0 ? (
            <NBCard className="p-8 text-center"><p>Aún no tienes cursos. <Link to="/courses" className="underline font-bold">Explora el catálogo</Link>.</p></NBCard>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => <CourseCard key={c.id} c={c} />)}
            </div>
          )}
        </section>

        {/* Recent submissions */}
        <section>
          <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A] mb-4">Entregas recientes</h2>
          {submissions.length === 0 ? (
            <NBCard className="p-6 text-sm text-[#3E5A3E]">Aún no tienes entregas — envía una para ganar XP.</NBCard>
          ) : (
            <NBCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left label-caps" style={{ background: "#1F5A2A", color: "#fff" }}>
                      <th className="px-4 py-3">Actividad</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(0, 6).map((s) => (
                      <tr key={s.id} className="border-t-2 border-[#1F5A2A]" data-testid={`dash-submission-${s.id}`}>
                        <td className="px-4 py-3 font-bold">{s.activity_title}</td>
                        <td className="px-4 py-3"><NBBadge color={s.type === "quiz" ? "#A5D6A7" : "#C5E1A5"}>{s.type === "quiz" ? "quiz" : "tarea"}</NBBadge></td>
                        <td className="px-4 py-3"><NBBadge color={s.status === "graded" ? "#2E8B7F" : "#8BC34A"}>{s.status === "graded" ? "calificado" : "enviado"}</NBBadge></td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{s.score != null ? `${s.score}/${s.max_points}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </NBCard>
          )}
        </section>
      </main>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const [pending, setPending] = React.useState([]);
  const [metrics, setMetrics] = React.useState(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const subsArr = await Promise.all(
          courses.map((co) =>
            api.get(`/courses/${co.id}/submissions`).then((r) => r.data).catch(() => [])
          )
        );
        const all = subsArr.flat();
        const pendingSubs = all.filter((s) => s.type === "assignment" && s.status !== "graded");
        const gradedSubs = all.filter((s) => s.status === "graded" && s.score != null);

        const totalStudents = courses.reduce((s, c) => s + (c.student_count || 0), 0);
        const avgScore = gradedSubs.length > 0
          ? Math.round(gradedSubs.reduce((s, sub) => s + (sub.score / (sub.max_points || 100)) * 100, 0) / gradedSubs.length)
          : 0;

        setPending(pendingSubs);
        setMetrics({ totalStudents, avgScore, totalSubmissions: all.length, gradedSubmissions: gradedSubs.length });
      } catch (e) {
        console.error(e);
      }
      setLoaded(true);
    })();
  }, [courses]);

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E4] grain">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="teacher-dashboard">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="label-caps text-[#3E5A3E]">Consola del profesor</div>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase text-[#1F5A2A]">{user.name}</h1>
          </div>
          <Link to="/courses/new"><NBButton variant="dark" data-testid="teacher-create-course-btn"><Plus className="inline w-4 h-4 mr-1" /> Nuevo curso</NBButton></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <NBCard color="yellow" className="p-6"><Stat label="Mis cursos" value={courses.length} icon={<BookOpen />} /></NBCard>
          <NBCard color="purple" className="p-6"><Stat label="Estudiantes" value={metrics?.totalStudents ?? courses.reduce((s, c) => s + (c.student_count || 0), 0)} icon={<ClipboardList />} /></NBCard>
          <NBCard color="teal" className="p-6"><Stat label="Por calificar" value={pending.length} icon={<FileCheck2 />} /></NBCard>
          <NBCard className="p-6"><Stat label="Promedio" value={metrics ? `${metrics.avgScore}%` : "—"} icon={<BarChart3 />} /></NBCard>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A]">Mis cursos</h2>
            <Link to="/courses"><NBButton variant="ghost" data-testid="teacher-browse-courses-btn">Ver catálogo <Plus className="inline w-4 h-4 ml-1" /></NBButton></Link>
          </div>
          {loaded && courses.length === 0 ? (
            <NBCard className="p-8 text-center">
              <p className="mb-3">Aún no tienes cursos. Empieza el primero.</p>
              <Link to="/courses/new"><NBButton variant="primary" data-testid="teacher-empty-create-btn">Crear curso</NBButton></Link>
            </NBCard>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => <CourseCard key={c.id} c={c} manage />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display font-black text-2xl uppercase text-[#1F5A2A] mb-4">Pendientes por calificar</h2>
          {pending.length === 0 ? (
            <NBCard className="p-6 text-sm text-[#3E5A3E]">Todo al día ✓</NBCard>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 6).map((s) => (
                <NBCard key={s.id} className="p-4 flex items-center justify-between" data-testid={`teacher-pending-${s.id}`}>
                  <div>
                    <div className="font-display font-black">{s.activity_title}</div>
                    <div className="text-sm text-[#3E5A3E]">por {s.student_name}</div>
                  </div>
                  <Link to={`/courses/${s.course_id}/manage?tab=submissions`}>
                    <NBButton variant="primary">Revisar</NBButton>
                  </Link>
                </NBCard>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="label-caps">{label}</div>
        <div className="font-display font-black text-5xl">{value}</div>
      </div>
      <div className="w-10 h-10">{icon && React.cloneElement(icon, { className: "w-10 h-10", strokeWidth: 2.5 })}</div>
    </div>
  );
}

function CourseCard({ c, manage }) {
  return (
    <Link to={manage ? `/courses/${c.id}/manage` : `/courses/${c.id}`} className="block nb-press" data-testid={`course-card-${c.id}`}>
      <NBCard className="overflow-hidden">
        <div className="h-24 border-b-2 border-[#1F5A2A] flex items-end p-4" style={{ background: c.cover_color || "#8BC34A" }}>
          <span className="label-caps">{c.subject}</span>
        </div>
        <div className="p-4">
          <div className="font-display font-black text-lg leading-tight">{c.title}</div>
          <p className="text-sm text-[#4A4A4A] line-clamp-2 mt-1">{c.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="label-caps">{c.student_count || 0} estudiantes</span>
            <NBBadge color={manage ? "#8BC34A" : "#A5D6A7"}>{manage ? "Administrar" : "Abrir"}</NBBadge>
          </div>
        </div>
      </NBCard>
    </Link>
  );
}
