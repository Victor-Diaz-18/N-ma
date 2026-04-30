import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import Navbar from "../components/Navbar";
import { NBCard, NBButton, NBBadge, NBInput, NBTextarea } from "../components/nb";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#FFE156", "#C4A1FF", "#98F5E1", "#FF6B6B", "#4ECDC4", "#FDBA74"];

export function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await api.get("/courses");
    setCourses(data);
  };
  useEffect(() => { load(); }, []);

  const enroll = async (id) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success("Enrolled! +Badge earned");
      load();
    } catch (e) { toast.error("Could not enroll"); }
  };

  const filtered = courses.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.subject.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="courses-page">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="label-caps text-[#4A4A4A]">Catalogue</div>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase">All courses</h1>
          </div>
          {user?.role === "teacher" && (
            <Link to="/courses/new"><NBButton variant="dark" data-testid="courses-new-btn"><Plus className="w-4 h-4 inline mr-1" /> New course</NBButton></Link>
          )}
        </div>

        <NBCard className="p-3 flex items-center gap-2">
          <Search className="w-5 h-5 ml-2" />
          <input placeholder="Search courses..." value={q} onChange={(e) => setQ(e.target.value)}
                 className="flex-1 px-2 py-1.5 font-medium outline-none" data-testid="courses-search-input" />
        </NBCard>

        {filtered.length === 0 ? (
          <NBCard className="p-8 text-center text-[#4A4A4A]">No courses found.</NBCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <NBCard key={c.id} className="overflow-hidden" data-testid={`courses-card-${c.id}`}>
                <div className="h-24 border-b-2 border-black flex items-end p-4" style={{ background: c.cover_color || "#FFE156" }}>
                  <span className="label-caps">{c.subject}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-display font-black text-lg leading-tight">{c.title}</div>
                  <p className="text-sm text-[#4A4A4A] line-clamp-2">{c.description}</p>
                  <div className="text-xs text-[#4A4A4A]">by {c.teacher_name} · {c.student_count} students</div>
                  <div className="flex items-center gap-2 pt-2">
                    <Link to={`/courses/${c.id}`} className="flex-1"><NBButton variant="ghost" className="w-full">Open</NBButton></Link>
                    {user?.role === "student" && !c.is_enrolled && (
                      <NBButton variant="primary" onClick={() => enroll(c.id)} data-testid={`courses-enroll-${c.id}`}>Enroll</NBButton>
                    )}
                    {c.is_enrolled && <NBBadge color="#4ECDC4">Enrolled</NBBadge>}
                  </div>
                </div>
              </NBCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function CourseNew() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [color, setColor] = useState("#FFE156");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post("/courses", { title, description, subject, cover_color: color });
      toast.success("Course created!");
      nav(`/courses/${data.id}/manage`);
    } catch (e) { toast.error("Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] grain">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-black text-4xl uppercase mb-6">New course</h1>
        <NBCard className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-caps block mb-1.5">Title</label>
              <NBInput required value={title} onChange={(e) => setTitle(e.target.value)} data-testid="course-new-title" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Subject</label>
              <NBInput required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math, History..." data-testid="course-new-subject" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Description</label>
              <NBTextarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} data-testid="course-new-desc" />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Cover color</label>
              <div className="flex gap-2">
                {COLORS.map((co) => (
                  <button type="button" key={co} onClick={() => setColor(co)}
                    className={`w-10 h-10 nb-border ${color === co ? "nb-shadow -translate-x-0.5 -translate-y-0.5" : ""}`}
                    style={{ background: co }} data-testid={`course-color-${co}`} />
                ))}
              </div>
            </div>
            <NBButton variant="dark" disabled={loading} type="submit" data-testid="course-new-submit">
              {loading ? "Creating..." : "Create course"}
            </NBButton>
          </form>
        </NBCard>
      </main>
    </div>
  );
}
