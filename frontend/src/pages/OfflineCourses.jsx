import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../lib/theme";
import Navbar from "../components/Navbar";
import { NBCard, NBButton } from "../components/nb";
import { listOfflineCourses, deleteCourseOffline, getOfflineSize, formatBytes } from "../lib/offline";
import { WifiOff, Trash2, ArrowLeft, Download, HardDrive } from "lucide-react";
import { toast } from "sonner";

export default function OfflineCourses() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [courses, setCourses] = useState([]);
  const [storage, setStorage] = useState({ used: 0, quota: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cs, st] = await Promise.all([listOfflineCourses(), getOfflineSize()]);
    setCourses(cs.sort((a, b) => (b.saved_at || 0) - (a.saved_at || 0)));
    setStorage(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id, title) => {
    if (!window.confirm(`¿Eliminar "${title}" del almacenamiento offline?`)) return;
    await deleteCourseOffline(id);
    toast.success(`"${title}" eliminado`);
    load();
  };

  const textColor = dark ? "#fafafa" : "#1F5A2A";
  const mutedColor = dark ? "#a1a1aa" : "#3E5A3E";
  const borderColor = dark ? "#3f3f46" : "#e5e7eb";

  return (
    <div className="min-h-screen grain" style={{ background: dark ? "#18181b" : "#F5F1E4" }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6" data-testid="offline-page">
        <Link to="/courses" className="inline-flex items-center gap-2 label-caps font-bold nb-press">
          <ArrowLeft className="w-4 h-4" /> Volver a cursos
        </Link>

        <div className="flex items-end gap-3">
          <HardDrive className="w-10 h-10" strokeWidth={2.5} style={{ color: "#8BC34A" }} />
          <div>
            <div className="label-caps" style={{ color: mutedColor }}>Cursos guardados</div>
            <h1 className="font-display font-black text-4xl sm:text-5xl uppercase" style={{ color: textColor }}>Offline</h1>
          </div>
        </div>

        {/* Storage info */}
        {storage.quota > 0 && (
          <NBCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: textColor }}>Almacenamiento usado</span>
              <span className="font-mono text-sm" style={{ color: mutedColor }}>
                {formatBytes(storage.used)} / {formatBytes(storage.quota)}
              </span>
            </div>
            <div className="h-3 nb-border overflow-hidden" style={{ background: dark ? "#27272a" : "#fff" }}>
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min((storage.used / storage.quota) * 100, 100)}%`,
                  background: storage.used / storage.quota > 0.8 ? "#FF6B6B" : "#8BC34A",
                }}
              />
            </div>
          </NBCard>
        )}

        {loading ? (
          <NBCard className="p-8 text-center" style={{ color: mutedColor }}>Cargando...</NBCard>
        ) : courses.length === 0 ? (
          <NBCard className="p-12 text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: mutedColor }} />
            <div className="font-display font-black text-xl mb-2" style={{ color: textColor }}>Sin cursos offline</div>
            <p className="text-sm mb-4" style={{ color: mutedColor }}>Descarga cursos desde su página de detalle para verlos sin conexión.</p>
            <Link to="/courses">
              <NBButton variant="primary">Explorar cursos</NBButton>
            </Link>
          </NBCard>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <NBCard key={c.id} className="p-4 flex items-center gap-4">
                <div
                  className="w-14 h-14 nb-border flex items-center justify-center flex-shrink-0 font-display font-black text-lg"
                  style={{ background: c.cover_color || "#8BC34A", color: "#1F5A2A" }}
                >
                  {c.title?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/courses/${c.id}`} className="block">
                    <div className="font-display font-black text-lg truncate" style={{ color: textColor }}>{c.title}</div>
                  </Link>
                  <div className="text-xs" style={{ color: mutedColor }}>
                    {c.subject && <span className="mr-2">{c.subject}</span>}
                    {c.saved_at && <span>Guardado {new Date(c.saved_at).toLocaleDateString("es-ES")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/courses/${c.id}`}>
                    <NBButton variant="ghost" className="text-xs">Ver</NBButton>
                  </Link>
                  <button
                    onClick={() => remove(c.id, c.title)}
                    className="nb-border p-2 nb-press"
                    style={{ background: "#FF6B6B", color: "#fff" }}
                    title="Eliminar offline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </NBCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
