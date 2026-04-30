import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, API } from "../lib/api";
import { useAuth } from "../lib/auth";
import Navbar from "../components/Navbar";
import { NBCard, NBButton, NBBadge } from "../components/nb";
import { FileText, LinkIcon, BookOpen, ClipboardList, CheckCircle2, Clock, ArrowRight, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState("lessons");
  const [lessons, setLessons] = useState([]);
  const [resources, setResources] = useState([]);
  const [activities, setActivities] = useState([]);

  const load = async () => {
    const { data: c } = await api.get(`/courses/${id}`);
    setCourse(c);
    const [ls, rs, as] = await Promise.all([
      api.get(`/courses/${id}/lessons`),
      api.get(`/courses/${id}/resources`),
      api.get(`/courses/${id}/activities`),
    ]);
    setLessons(ls.data); setResources(rs.data); setActivities(as.data);
  };
  useEffect(() => { load(); }, [id]);

  const enroll = async () => {
    await api.post(`/courses/${id}/enroll`);
    toast.success("Enrolled!");
    load();
  };

  if (!course) return <div className="min-h-screen"><Navbar /></div>;

  const tabs = [
    { id: "lessons", label: "Lessons", icon: BookOpen, count: lessons.length },
    { id: "resources", label: "Resources", icon: FileText, count: resources.length },
    { id: "activities", label: "Activities", icon: ClipboardList, count: activities.length },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="course-detail">
        {/* Header */}
        <NBCard className="overflow-hidden">
          <div className="h-32 border-b-2 border-black flex items-end p-6" style={{ background: course.cover_color || "#FFE156" }}>
            <div>
              <NBBadge>{course.subject}</NBBadge>
              <h1 className="font-display font-black text-4xl sm:text-5xl uppercase mt-2 leading-[0.95]">{course.title}</h1>
            </div>
          </div>
          <div className="p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[220px]">
              <p className="text-[#4A4A4A]">{course.description}</p>
              <div className="label-caps mt-3">By {course.teacher_name} · {course.student_count} students</div>
            </div>
            <div className="flex gap-2">
              {course.is_owner && (
                <Link to={`/courses/${id}/manage`}>
                  <NBButton variant="dark" data-testid="course-manage-btn"><Pencil className="inline w-4 h-4 mr-1" /> Manage</NBButton>
                </Link>
              )}
              {user?.role === "student" && !course.is_enrolled && (
                <NBButton variant="primary" onClick={enroll} data-testid="course-enroll-btn">Enroll <ArrowRight className="inline w-4 h-4 ml-1" /></NBButton>
              )}
              {course.is_enrolled && <NBBadge color="#4ECDC4">Enrolled</NBBadge>}
            </div>
          </div>
        </NBCard>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 nb-border nb-press font-bold text-sm uppercase tracking-wider ${tab === t.id ? "bg-[#FFE156] nb-shadow" : "bg-white"}`}
              data-testid={`course-tab-${t.id}`}>
              <t.icon className="w-4 h-4 inline mr-1" /> {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "lessons" && (
          <div className="space-y-3">
            {lessons.length === 0 ? <Empty text="No lessons yet." /> :
              lessons.map((l) => (
                <NBCard key={l.id} className="p-5" data-testid={`lesson-${l.id}`}>
                  <div className="font-display font-black text-xl">{l.title}</div>
                  <div className="mt-2 prose prose-sm max-w-none whitespace-pre-wrap">{l.content}</div>
                </NBCard>
              ))}
          </div>
        )}

        {tab === "resources" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {resources.length === 0 ? <Empty text="No resources yet." /> :
              resources.map((r) => (
                <a key={r.id} href={r.type === "link" ? r.url : `${API}/files/${r.file_id}`} target="_blank" rel="noopener noreferrer"
                   className="nb-press block" data-testid={`resource-${r.id}`}>
                  <NBCard className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 nb-border flex items-center justify-center" style={{ background: r.type === "link" ? "#C4A1FF" : "#98F5E1" }}>
                      {r.type === "link" ? <LinkIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{r.title}</div>
                      {r.description && <div className="text-sm text-[#4A4A4A]">{r.description}</div>}
                      <NBBadge color={r.type === "link" ? "#C4A1FF" : "#98F5E1"} className="mt-1">{r.type}</NBBadge>
                    </div>
                  </NBCard>
                </a>
              ))}
          </div>
        )}

        {tab === "activities" && (
          <div className="space-y-3">
            {activities.length === 0 ? <Empty text="No activities yet." /> :
              activities.map((a) => (
                <NBCard key={a.id} className="p-5 flex items-start justify-between gap-4" data-testid={`activity-${a.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <NBBadge color={a.type === "quiz" ? "#C4A1FF" : "#98F5E1"}>{a.type}</NBBadge>
                      {a.due_date && <span className="label-caps"><Clock className="w-3 h-3 inline" /> Due {new Date(a.due_date).toLocaleDateString()}</span>}
                      <NBBadge color="#FFE156">{a.xp_reward} XP</NBBadge>
                    </div>
                    <div className="font-display font-black text-xl mt-1">{a.title}</div>
                    <div className="text-sm text-[#4A4A4A] mt-1">{a.description}</div>
                    {a.my_submission && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#4ECDC4]" />
                        <span className="font-bold">Submitted</span>
                        {a.my_submission.status === "graded" && <span className="font-mono">· Score {a.my_submission.score}/{a.max_points}</span>}
                      </div>
                    )}
                  </div>
                  {user?.role === "student" && course.is_enrolled && (
                    <Link to={`/activities/${a.id}`}>
                      <NBButton variant={a.my_submission ? "ghost" : "primary"} data-testid={`activity-open-${a.id}`}>
                        {a.my_submission ? "View" : "Start"}
                      </NBButton>
                    </Link>
                  )}
                </NBCard>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Empty({ text }) {
  return <NBCard className="p-6 text-center text-[#4A4A4A]">{text}</NBCard>;
}
