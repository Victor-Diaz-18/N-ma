import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import Navbar from "../components/Navbar";
import AIChatbot from "../components/AIChatbot";
import { NBCard, NBButton, NBBadge } from "../components/nb";
import ReactMarkdown from "react-markdown";
import { FileText, LinkIcon, BookOpen, ClipboardList, CheckCircle2, Clock, ArrowRight, ArrowLeft, Pencil, Download, HardDriveDownload, Check, Trophy, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Calendar, Users, Target, Award } from "lucide-react";
import { toast } from "sonner";
import { markCourseOffline, isCourseOffline, markFileOffline, isFileOffline, precacheFile } from "../lib/offline";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [course, setCourse] = useState(null);
  const [activeSection, setActiveSection] = useState("general");
  const [lessons, setLessons] = useState([]);
  const [resources, setResources] = useState([]);
  const [activities, setActivities] = useState([]);
  const [offline, setOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [offlineFiles, setOfflineFiles] = useState({});
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const load = async () => {
    const { data: c } = await api.get(`/courses/${id}`);
    setCourse(c);
    const [ls, rs, as] = await Promise.all([
      api.get(`/courses/${id}/lessons`),
      api.get(`/courses/${id}/resources`),
      api.get(`/courses/${id}/activities`),
    ]);
    setLessons(ls.data); setResources(rs.data); setActivities(as.data);
    setOffline(await isCourseOffline(id));
    const fmap = {};
    for (const r of rs.data) {
      if (r.type === "file" && r.file_id) fmap[r.file_id] = await isFileOffline(r.file_id);
    }
    setOfflineFiles(fmap);
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCourseOffline = async () => {
    setDownloading(true);
    try {
      for (const r of resources) {
        if (r.type === "file" && r.file_id) {
          precacheFile(`${API}/files/${r.file_id}`);
          await markFileOffline(r.file_id, { title: r.title, course_id: id });
        }
      }
      await markCourseOffline(id, { title: course.title, subject: course.subject });
      setOffline(true);
      const fmap = { ...offlineFiles };
      for (const r of resources) if (r.type === "file" && r.file_id) fmap[r.file_id] = true;
      setOfflineFiles(fmap);
      toast.success("Curso disponible sin conexión");
    } catch (e) {
      toast.error("No se pudo descargar el curso");
    } finally {
      setDownloading(false);
    }
  };

  const downloadResource = async (r) => {
    if (r.type !== "file" || !r.file_id) return;
    precacheFile(`${API}/files/${r.file_id}`);
    await markFileOffline(r.file_id, { title: r.title, course_id: id });
    setOfflineFiles({ ...offlineFiles, [r.file_id]: true });
    toast.success(`"${r.title}" guardado sin conexión`);
  };

  const enroll = async () => {
    await api.post(`/courses/${id}/enroll`);
    toast.success("¡Inscrito!");
    load();
  };

  const dueDates = useMemo(() => {
    const map = {};
    activities.forEach((a) => {
      if (a.due_date) {
        const d = new Date(a.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        if (!map[d]) map[d] = [];
        map[d].push(a.title);
      }
    });
    return map;
  }, [activities]);

  if (!course) return <div className="min-h-screen"><Navbar /></div>;

  const sections = [
    { id: "general", label: "General", icon: BookOpen },
    { id: "lessons", label: "Contenido", icon: BookOpen, count: lessons.length },
    { id: "resources", label: "Recursos", icon: FileText, count: resources.length },
    { id: "activities", label: "Actividades", icon: ClipboardList, count: activities.length },
  ];

  const cardBg = dark ? "#27272a" : "#fff";
  const textColor = dark ? "#fafafa" : "#1F5A2A";
  const mutedColor = dark ? "#a1a1aa" : "#3E5A3E";

  return (
    <div className="min-h-screen grain" style={{ background: dark ? "#18181b" : "#F5F1E4" }}>
      <Navbar />

      {/* Course Header */}
      <div className="border-b-2" style={{ borderColor: dark ? "#3f3f46" : "#1F5A2A", background: course.cover_color || "#8BC34A" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Link to="/courses" className="inline-flex items-center gap-2 label-caps font-bold nb-press mb-3" style={{ color: "#1F5A2A" }}>
            <ArrowLeft className="w-4 h-4" /> Regresar a mis cursos
          </Link>
          <NBBadge>{course.subject}</NBBadge>
          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase mt-2 leading-[0.95]" style={{ color: "#1F5A2A" }}>{course.title}</h1>
          <div className="label-caps mt-2" style={{ color: "#1F5A2A" }}>Por {course.teacher_name} · {course.student_count} estudiantes</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {course.is_owner && (
              <Link to={`/courses/${id}/manage`}>
                <NBButton variant="dark"><Pencil className="inline w-4 h-4 mr-1" /> Administrar</NBButton>
              </Link>
            )}
            {course.is_enrolled && (
              <Link to={`/courses/${id}/leaderboard`}>
                <NBButton variant="ghost"><Trophy className="inline w-4 h-4 mr-1" /> Ranking</NBButton>
              </Link>
            )}
            {user?.role === "student" && !course.is_enrolled && (
              <NBButton variant="primary" onClick={enroll}>Inscribirse <ArrowRight className="inline w-4 h-4 ml-1" /></NBButton>
            )}
            {course.is_enrolled && (
              offline ? (
                <NBBadge color="#2E8B7F" className="flex items-center gap-1"><Check className="w-3 h-3" /> Offline listo</NBBadge>
              ) : (
                <NBButton variant="teal" onClick={downloadCourseOffline} disabled={downloading}>
                  <HardDriveDownload className="inline w-4 h-4 mr-1" /> {downloading ? "Descargando..." : "Offline"}
                </NBButton>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* Left Sidebar — Sections */}
          <aside className={`${sidebarOpen ? "w-56" : "w-0"} flex-shrink-0 hidden lg:block transition-all duration-200`}>
            <NBCard className="p-0 overflow-hidden">
              <div className="p-3 font-display font-black text-sm uppercase tracking-wider" style={{ background: "#1F5A2A", color: "#fff" }}>
                Secciones del curso
              </div>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold border-b transition-colors ${activeSection === s.id ? "" : ""}`}
                  style={{
                    background: activeSection === s.id ? (dark ? "#3f3f46" : "#e8f5e9") : "transparent",
                    color: activeSection === s.id ? "#8BC34A" : mutedColor,
                    borderColor: dark ? "#3f3f46" : "#e5e7eb",
                  }}
                >
                  <s.icon className="w-4 h-4" />
                  <span className="flex-1">{s.label}</span>
                  {s.count !== undefined && <span className="font-mono text-xs opacity-60">{s.count}</span>}
                </button>
              ))}
            </NBCard>
          </aside>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-20 left-4 z-50 nb-border nb-press p-2"
            style={{ background: cardBg }}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Description */}
            {activeSection === "general" && (
              <>
                <NBCard className="p-6">
                  <div className="font-display font-black text-xl mb-3" style={{ color: textColor }}>Descripción del curso</div>
                  <p style={{ color: mutedColor }}>{course.description}</p>
                </NBCard>

                {/* Quick links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Lecciones", count: lessons.length, icon: BookOpen, section: "lessons", color: "#8BC34A" },
                    { label: "Recursos", count: resources.length, icon: FileText, section: "resources", color: "#A5D6A7" },
                    { label: "Actividades", count: activities.length, icon: ClipboardList, section: "activities", color: "#C5E1A5" },
                    { label: "Ranking", count: null, icon: Trophy, link: `/courses/${id}/leaderboard`, color: "#FF6B6B" },
                  ].map((item) => (
                    <NBCard key={item.label} className="p-4 cursor-pointer nb-press" onClick={() => item.link ? null : setActiveSection(item.section)}>
                      {item.link ? (
                        <Link to={item.link} className="block">
                          <div className="w-10 h-10 nb-border flex items-center justify-center mb-2" style={{ background: item.color }}>
                            <item.icon className="w-5 h-5" style={{ color: "#1F5A2A" }} />
                          </div>
                          <div className="font-bold text-sm" style={{ color: textColor }}>{item.label}</div>
                          {item.count !== null && <div className="font-mono text-xs" style={{ color: mutedColor }}>{item.count} items</div>}
                        </Link>
                      ) : (
                        <>
                          <div className="w-10 h-10 nb-border flex items-center justify-center mb-2" style={{ background: item.color }}>
                            <item.icon className="w-5 h-5" style={{ color: "#1F5A2A" }} />
                          </div>
                          <div className="font-bold text-sm" style={{ color: textColor }}>{item.label}</div>
                          <div className="font-mono text-xs" style={{ color: mutedColor }}>{item.count} items</div>
                        </>
                      )}
                    </NBCard>
                  ))}
                </div>
              </>
            )}

            {/* Lessons — Accordion */}
            {activeSection === "lessons" && (
              <div className="space-y-3">
                {lessons.length === 0 ? <Empty text="Aún no hay lecciones." dark={dark} /> :
                  lessons.map((l, i) => (
                    <NBCard key={l.id} className="overflow-hidden">
                      <button
                        onClick={() => setExpandedLesson(expandedLesson === l.id ? null : l.id)}
                        className="w-full text-left px-5 py-4 flex items-center gap-3 font-bold"
                        style={{ color: textColor }}
                      >
                        <span className="w-8 h-8 nb-border flex items-center justify-center font-display font-black text-sm flex-shrink-0" style={{ background: "#8BC34A", color: "#1F5A2A" }}>{i + 1}</span>
                        <span className="flex-1 font-display font-black text-lg">{l.title}</span>
                        {expandedLesson === l.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      {expandedLesson === l.id && (
                        <div className="px-5 pb-5 pt-0 border-t-2" style={{ borderColor: dark ? "#3f3f46" : "#e5e7eb" }}>
                          <div className="mt-4 prose prose-sm max-w-none prose-headings:font-display prose-strong:text-[#1F5A2A] prose-a:text-[#2E8B7F]"
                            style={{ color: mutedColor }}>
                            <ReactMarkdown>{l.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </NBCard>
                  ))}
              </div>
            )}

            {/* Resources */}
            {activeSection === "resources" && (
              <div className="space-y-3">
                {resources.length === 0 ? <Empty text="Aún no hay recursos." dark={dark} /> :
                  resources.map((r) => (
                    <NBCard key={r.id} className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 nb-border flex items-center justify-center flex-shrink-0" style={{ background: r.type === "link" ? "#A5D6A7" : "#C5E1A5" }}>
                        {r.type === "link" ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={r.type === "link" ? r.url : `${API}/files/${r.file_id}`} target="_blank" rel="noopener noreferrer" className="block">
                          <div className="font-bold truncate" style={{ color: textColor }}>{r.title}</div>
                          {r.description && <div className="text-sm" style={{ color: mutedColor }}>{r.description}</div>}
                        </a>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <NBBadge color={r.type === "link" ? "#A5D6A7" : "#C5E1A5"}>{r.type === "link" ? "enlace" : "archivo"}</NBBadge>
                          {r.type === "file" && r.file_id && (
                            offlineFiles[r.file_id] ? (
                              <NBBadge color="#8BC34A" className="flex items-center gap-1"><Check className="w-3 h-3" /> Offline</NBBadge>
                            ) : (
                              <button onClick={() => downloadResource(r)} className="label-caps underline">
                                <Download className="w-3 h-3 inline" /> Guardar offline
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </NBCard>
                  ))}
              </div>
            )}

            {/* Activities */}
            {activeSection === "activities" && (
              <div className="space-y-3">
                {activities.length === 0 ? <Empty text="Aún no hay actividades." dark={dark} /> :
                  activities.map((a) => (
                    <NBCard key={a.id} className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <NBBadge color={a.type === "quiz" ? "#A5D6A7" : a.type === "exam" ? "#C5E1A5" : "#8BC34A"}>{a.type === "quiz" ? "quiz" : a.type === "exam" ? "examen" : "tarea"}</NBBadge>
                          {a.due_date && <span className="label-caps"><Clock className="w-3 h-3 inline" /> Vence {new Date(a.due_date).toLocaleDateString("es-ES")}</span>}
                          <NBBadge color="#FF6B6B">{a.xp_reward} XP</NBBadge>
                        </div>
                        <div className="font-display font-black text-xl mt-1" style={{ color: textColor }}>{a.title}</div>
                        <div className="text-sm mt-1" style={{ color: mutedColor }}>{a.description}</div>
                        {a.my_submission && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-[#2E8B7F]" />
                            <span className="font-bold">Entregado</span>
                            {a.my_submission.status === "graded" && <span className="font-mono">· Puntaje {a.my_submission.score}/{a.max_points}</span>}
                          </div>
                        )}
                      </div>
                      {user?.role === "student" && course.is_enrolled && (
                        <Link to={`/activities/${a.id}`}>
                          <NBButton variant={a.my_submission ? "ghost" : "primary"}>
                            {a.my_submission ? "Ver" : "Comenzar"}
                          </NBButton>
                        </Link>
                      )}
                    </NBCard>
                  ))}
              </div>
            )}
          </div>

          {/* Right Sidebar — Info */}
          <aside className="w-64 flex-shrink-0 hidden xl:block space-y-4">
            {/* Activities Summary */}
            <NBCard className="p-0 overflow-hidden">
              <div className="p-3 font-display font-black text-sm uppercase tracking-wider" style={{ background: "#1F5A2A", color: "#fff" }}>
                Resumen
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 nb-border flex items-center justify-center" style={{ background: "#8BC34A" }}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: textColor }}>Lecciones</div>
                    <div className="font-mono text-xs" style={{ color: mutedColor }}>{lessons.length} publicadas</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 nb-border flex items-center justify-center" style={{ background: "#A5D6A7" }}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: textColor }}>Recursos</div>
                    <div className="font-mono text-xs" style={{ color: mutedColor }}>{resources.length} disponibles</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 nb-border flex items-center justify-center" style={{ background: "#C5E1A5" }}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: textColor }}>Actividades</div>
                    <div className="font-mono text-xs" style={{ color: mutedColor }}>{activities.length} pendientes</div>
                  </div>
                </div>
              </div>
            </NBCard>

            {/* Mini Calendar */}
            <MiniCalendar dueDates={dueDates} dark={dark} textColor={textColor} mutedColor={mutedColor} />
          </aside>
        </div>
      </div>

      {user?.role === "student" && course?.is_enrolled && (
        <AIChatbot courseId={id} />
      )}
    </div>
  );
}

function MiniCalendar({ dueDates, dark, textColor, mutedColor }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <NBCard className="p-0 overflow-hidden">
      <div className="p-3 font-display font-black text-sm uppercase tracking-wider flex items-center justify-between" style={{ background: "#1F5A2A", color: "#fff" }}>
        <button onClick={prevMonth} className="nb-press p-1"><ChevronLeft className="w-4 h-4" /></button>
        <span>{monthNames[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} className="nb-press p-1"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-[0.6rem] font-bold" style={{ color: mutedColor }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((d, i) => {
            if (d === null) return <div key={`e-${i}`} />;
            const dateStr = new Date(currentYear, currentMonth, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
            const hasActivity = dueDates[dateStr];
            const isToday = d === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
            return (
              <div
                key={d}
                className={`text-xs py-1 rounded font-mono ${isToday ? "font-bold" : ""}`}
                style={{
                  background: hasActivity ? "#8BC34A" : isToday ? (dark ? "#3f3f46" : "#e8f5e9") : "transparent",
                  color: hasActivity ? "#1F5A2A" : isToday ? textColor : mutedColor,
                }}
                title={hasActivity ? hasActivity.join(", ") : ""}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </NBCard>
  );
}

function Empty({ text, dark }) {
  return (
    <NBCard className="p-8 text-center" style={{ color: dark ? "#71717a" : "#4A4A4A" }}>
      {text}
    </NBCard>
  );
}
