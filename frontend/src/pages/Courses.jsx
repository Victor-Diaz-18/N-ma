import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCourses } from "../hooks/useCourses";
import Navbar from "../components/Navbar";
import { NBCard, NBButton, NBBadge, NBInput, NBTextarea } from "../components/nb";
import { Plus, Search, ChevronLeft, ChevronRight, BookOpen, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { courseSchema } from "../lib/validations";
import { useFormValidation } from "../hooks/useFormValidation";

const COLORS = ["#8BC34A", "#A5D6A7", "#C5E1A5", "#2E8B7F", "#E0E879", "#FFD0CD"];
const PAGE_SIZE = 12;

export function Courses() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const [tab, setTab] = useState(isTeacher ? "mine" : "catalog");
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { courses: myCourses, loading: myCoursesLoading } = useCourses();

  const loadCatalog = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses?page=${p}&limit=${PAGE_SIZE}`);
      setCourses(data.items);
      setPages(data.pages);
      setTotal(data.total);
      setPage(p);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "catalog") loadCatalog(1);
  }, [tab, loadCatalog]);

  const enroll = async (id) => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success("¡Inscrito! +Insignia ganada");
      loadCatalog();
    } catch (e) { toast.error("No se pudo inscribir"); }
  };

  const filtered = tab === "catalog"
    ? (q ? courses.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.subject.toLowerCase().includes(q.toLowerCase())) : courses)
    : (q ? myCourses.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.subject.toLowerCase().includes(q.toLowerCase())) : myCourses);

  const currentLoading = tab === "catalog" ? loading : myCoursesLoading;

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="courses-page">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="label-caps text-[#3E5A3E]">{isTeacher ? "Gestión de cursos" : "Catálogo"}</div>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase text-[#1F5A2A]">
              {isTeacher ? "Mis cursos" : "Todos los cursos"}
            </h1>
          </div>
          {isTeacher && (
            <Link to="/courses/new"><NBButton variant="dark" data-testid="courses-new-btn"><Plus className="w-4 h-4 inline mr-1" /> Nuevo curso</NBButton></Link>
          )}
        </div>

        {isTeacher && (
          <div className="flex gap-2">
            <button onClick={() => setTab("mine")}
              className={`flex items-center gap-2 px-4 py-2 font-display font-black uppercase text-sm border-2 border-[#1F5A2A] transition-all ${tab === "mine" ? "bg-[#1F5A2A] text-white" : "bg-white text-[#1F5A2A] hover:bg-[#1F5A2A]/10"}`}
              data-testid="courses-tab-mine">
              <FolderOpen className="w-4 h-4" /> Mis cursos
            </button>
            <button onClick={() => setTab("catalog")}
              className={`flex items-center gap-2 px-4 py-2 font-display font-black uppercase text-sm border-2 border-[#1F5A2A] transition-all ${tab === "catalog" ? "bg-[#1F5A2A] text-white" : "bg-white text-[#1F5A2A] hover:bg-[#1F5A2A]/10"}`}
              data-testid="courses-tab-catalog">
              <BookOpen className="w-4 h-4" /> Catálogo
            </button>
          </div>
        )}

        <NBCard className="p-3 flex items-center gap-2">
          <Search className="w-5 h-5 ml-2" />
          <input placeholder={tab === "mine" ? "Buscar en mis cursos..." : "Buscar cursos..."} value={q} onChange={(e) => setQ(e.target.value)}
                 className="flex-1 px-2 py-1.5 font-medium outline-none bg-transparent" data-testid="courses-search-input" />
        </NBCard>

        {currentLoading ? (
          <NBCard className="p-8 text-center text-[#3E5A3E]">Cargando...</NBCard>
        ) : filtered.length === 0 ? (
          <NBCard className="p-8 text-center text-[#3E5A3E]">
            {tab === "mine" ? "No tienes cursos aún. Crea uno nuevo." : "No se encontraron cursos."}
          </NBCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <NBCard key={c.id} className="overflow-hidden" data-testid={`courses-card-${c.id}`}>
                <div className="h-24 border-b-2 border-[#1F5A2A] flex items-end p-4" style={{ background: c.cover_color || "#8BC34A" }}>
                  <span className="label-caps">{c.subject}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="font-display font-black text-lg leading-tight">{c.title}</div>
                  <p className="text-sm text-[#3E5A3E] line-clamp-2">{c.description}</p>
                  <div className="text-xs text-[#3E5A3E]">por {c.teacher_name} · {c.student_count} estudiantes</div>
                  <div className="flex items-center gap-2 pt-2">
                    {isTeacher && tab === "mine" ? (
                      <Link to={`/courses/${c.id}/manage`} className="flex-1"><NBButton variant="primary" className="w-full">Administrar</NBButton></Link>
                    ) : (
                      <>
                        <Link to={`/courses/${c.id}`} className="flex-1"><NBButton variant="ghost" className="w-full">Abrir</NBButton></Link>
                        {user?.role === "student" && !c.is_enrolled && (
                          <NBButton variant="primary" onClick={() => enroll(c.id)} data-testid={`courses-enroll-${c.id}`}>Inscribirse</NBButton>
                        )}
                        {c.is_enrolled && <NBBadge color="#2E8B7F">Inscrito</NBBadge>}
                      </>
                    )}
                  </div>
                </div>
              </NBCard>
            ))}
          </div>
        )}

        {tab === "catalog" && pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4" data-testid="courses-pagination">
            <NBButton
              variant="ghost"
              disabled={page <= 1}
              onClick={() => loadCatalog(page - 1)}
              data-testid="courses-prev-btn"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Anterior
            </NBButton>
            <span className="font-mono text-sm text-[#3E5A3E]">
              Página {page} de {pages} · {total} cursos
            </span>
            <NBButton
              variant="ghost"
              disabled={page >= pages}
              onClick={() => loadCatalog(page + 1)}
              data-testid="courses-next-btn"
            >
              Siguiente <ChevronRight className="w-4 h-4 inline" />
            </NBButton>
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
  const [color, setColor] = useState("#8BC34A");
  const [loading, setLoading] = useState(false);
  const { errors, touched, validate, validateField, touchField } = useFormValidation(courseSchema);

  const formData = { title, subject, description };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    setLoading(true);
    try {
      const { data } = await api.post("/courses", { title, description, subject, cover_color: color });
      toast.success("¡Curso creado!");
      nav(`/courses/${data.id}/manage`);
    } catch (e) { toast.error("Error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E4] grain">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-black text-4xl uppercase mb-6 text-[#1F5A2A]">Nuevo curso</h1>
        <NBCard className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label-caps block mb-1.5">Título</label>
              <NBInput
                value={title}
                onChange={(e) => { setTitle(e.target.value); validateField("title", { ...formData, title: e.target.value }); }}
                onBlur={() => touchField("title")}
                className={errors.title && touched.title ? "border-[#FF6B6B]" : ""}
                placeholder="Ej: Biología Celular"
                data-testid="course-new-title"
              />
              {errors.title && touched.title && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="label-caps block mb-1.5">Materia</label>
              <NBInput
                value={subject}
                onChange={(e) => { setSubject(e.target.value); validateField("subject", { ...formData, subject: e.target.value }); }}
                onBlur={() => touchField("subject")}
                placeholder="Matemáticas, Historia..."
                className={errors.subject && touched.subject ? "border-[#FF6B6B]" : ""}
                data-testid="course-new-subject"
              />
              {errors.subject && touched.subject && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium">{errors.subject}</p>
              )}
            </div>
            <div>
              <label className="label-caps block mb-1.5">Descripción</label>
              <NBTextarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); validateField("description", { ...formData, description: e.target.value }); }}
                onBlur={() => touchField("description")}
                rows={4}
                className={errors.description && touched.description ? "border-[#FF6B6B]" : ""}
                data-testid="course-new-desc"
              />
              {errors.description && touched.description && (
                <p className="text-[#FF6B6B] text-xs mt-1 font-medium">{errors.description}</p>
              )}
            </div>
            <div>
              <label className="label-caps block mb-1.5">Color de portada</label>
              <div className="flex gap-2">
                {COLORS.map((co) => (
                  <button type="button" key={co} onClick={() => setColor(co)}
                    className={`w-10 h-10 nb-border ${color === co ? "nb-shadow -translate-x-0.5 -translate-y-0.5" : ""}`}
                    style={{ background: co }} data-testid={`course-color-${co}`} />
                ))}
              </div>
            </div>
            <NBButton variant="dark" disabled={loading} type="submit" data-testid="course-new-submit">
              {loading ? "Creando..." : "Crear curso"}
            </NBButton>
          </form>
        </NBCard>
      </main>
    </div>
  );
}
