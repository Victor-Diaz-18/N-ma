import { useState } from "react";
import { useTheme } from "../lib/theme";
import { X, Sparkles, FileText, ClipboardCheck, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

const ACTIVITY_TYPES = [
  { id: "quiz", label: "Quiz", icon: ClipboardCheck, desc: "Preguntas de opción múltiple" },
  { id: "exam", label: "Examen", icon: FileText, desc: "Evaluación mixta con varios tipos" },
  { id: "assignment", label: "Tarea", icon: BookOpen, desc: "Actividad práctica con instrucciones" },
];

export default function AIGenerateModal({ open, onClose, courseId, onSaved }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [step, setStep] = useState("type");
  const [activityType, setActivityType] = useState("quiz");
  const [numQuestions, setNumQuestions] = useState(5);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const s = {
    modal: { background: dark ? "#27272a" : "#fff" },
    card: { background: dark ? "#3f3f46" : "#fff" },
    cardHover: { background: dark ? "#52525b" : "#f9fafb" },
    input: { background: dark ? "#3f3f46" : "#fff", color: dark ? "#fafafa" : "#1a1a1a" },
    textPrimary: { color: dark ? "#fafafa" : "#1a1a1a" },
    textSecondary: { color: dark ? "#a1a1aa" : "#4A4A4A" },
    textMuted: { color: dark ? "#71717a" : "#6b7280" },
    border: { borderColor: dark ? "#52525b" : "#000" },
    borderLight: { borderColor: dark ? "#52525b" : "#e5e7eb" },
    divider: { borderColor: dark ? "#3f3f46" : "#f3f4f6" },
    previewQ: { background: dark ? "#18181b" : "#f9fafb", borderColor: dark ? "#3f3f46" : "#e5e7eb" },
    previewOpt: { background: dark ? "#27272a" : "#fff", borderColor: dark ? "#3f3f46" : "#e5e7eb" },
    previewNum: { background: dark ? "#fafafa" : "#000", color: dark ? "#18181b" : "#fff" },
  };

  const generate = async () => {
    setStep("loading");
    setError(null);
    try {
      const { data } = await api.post("/ai/generate-activity", {
        course_id: courseId,
        activity_type: activityType,
        num_questions: numQuestions,
      });
      setPreview(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setStep("preview");
    } catch (e) {
      const detail = e.response?.data?.detail || "Error al generar actividad";
      const msg = e.response?.status === 429
        ? "Límite de solicitudes alcanzado. Espera unos minutos e intenta de nuevo."
        : detail;
      setError(msg);
      setStep("type");
      toast.error(msg);
    }
  };

  const save = async (status) => {
    const payload = {
      title,
      description,
      type: activityType === "assignment" ? "assignment" : "quiz",
      due_date: null,
      max_points: 100,
      xp_reward: 50,
      status,
    };
    if (activityType === "quiz" || activityType === "exam") {
      payload.quiz_questions = (preview.questions || []).map((q) => ({
        question: q.question,
        options: q.options,
        correct_index: Number(q.correct_index),
      }));
    }
    try {
      await api.post(`/courses/${courseId}/activities`, payload);
      toast.success(status === "draft" ? "Guardado como borrador" : "Actividad publicada");
      onSaved?.();
      reset();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al guardar");
    }
  };

  const reset = () => {
    setStep("type");
    setPreview(null);
    setError(null);
    setTitle("");
    setDescription("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div style={s.modal} className="nb-border nb-shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ ...s.border, borderBottomWidth: 2, borderBottomStyle: "solid" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={s.textPrimary} />
            <h2 className="text-xl font-extrabold uppercase tracking-wide" style={s.textPrimary}>
              Generar actividad con IA
            </h2>
          </div>
          <button onClick={reset} className="nb-press p-1" style={{ background: dark ? "#3f3f46" : "#f3f4f6" }}>
            <X className="w-5 h-5" style={s.textPrimary} />
          </button>
        </div>

        {/* Step: Type Selection */}
        {step === "type" && (
          <div className="p-5 space-y-4">
            {error && (
              <div className="border-2 border-red-400 p-3 text-sm font-medium" style={{ background: dark ? "#3f1111" : "#fef2f2", color: dark ? "#fca5a5" : "#991b1b" }}>
                {error}
              </div>
            )}

            <p className="font-bold text-sm uppercase tracking-wide" style={s.textPrimary}>
              Tipo de actividad:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ACTIVITY_TYPES.map((t) => {
                const Icon = t.icon;
                const selected = activityType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActivityType(t.id)}
                    className="p-4 nb-border nb-press text-left"
                    style={selected
                      ? { background: "#C5E1A5", borderColor: "#000", borderWidth: 2 }
                      : { ...s.card, ...s.border }
                    }
                  >
                    <Icon className="w-6 h-6 mb-2" style={s.textPrimary} />
                    <div className="font-extrabold text-lg" style={s.textPrimary}>{t.label}</div>
                    <div className="text-xs font-medium mt-1" style={s.textMuted}>{t.desc}</div>
                  </button>
                );
              })}
            </div>

            {(activityType === "quiz" || activityType === "exam") && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                  Número de preguntas
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-3 py-2 nb-border font-bold"
                  style={s.input}
                >
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} preguntas</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={generate}
              className="w-full py-3 nb-border nb-press font-extrabold uppercase tracking-wide text-lg flex items-center justify-center gap-2"
              style={dark
                ? { background: "#8BC34A", color: "#18181b", borderColor: "#000" }
                : { background: "#1a1a1a", color: "#fff", borderColor: "#000" }
              }
            >
              <Sparkles className="w-5 h-5" /> Generar
            </button>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="p-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#8BC34A" }} />
            <p className="font-extrabold text-lg uppercase tracking-wide" style={s.textPrimary}>
              Generando contenido...
            </p>
            <p className="text-sm font-medium" style={s.textMuted}>
              La IA está creando tu actividad
            </p>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && preview && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 nb-border font-bold"
                style={s.input}
                placeholder="Título de la actividad"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 nb-border font-bold min-h-[80px] resize-y"
                style={s.input}
                placeholder="Descripción de la actividad"
              />
            </div>

            {/* Quiz/Exam preview */}
            {(activityType === "quiz" || activityType === "exam") && preview.questions && (
              <div className="space-y-3">
                <p className="text-sm font-extrabold uppercase tracking-wide" style={s.textPrimary}>
                  {preview.questions.length} preguntas generadas
                </p>
                {preview.questions.map((q, i) => (
                  <div key={i} className="p-3" style={{ ...s.previewQ, border: "2px solid" }}>
                    <p className="font-bold text-sm mb-2" style={s.textPrimary}>
                      <span className="px-2 py-0.5 mr-2 text-xs font-extrabold" style={s.previewNum}>
                        P{i + 1}
                      </span>
                      {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-1 ml-8">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className="text-xs font-medium px-2 py-1"
                          style={j === q.correct_index
                            ? { background: "#C5E1A5", border: "1px solid #8BC34A" }
                            : s.previewOpt
                          }
                        >
                          {String.fromCharCode(65 + j)}) {opt}
                          {j === q.correct_index && " ✓"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assignment preview */}
            {activityType === "assignment" && (
              <div className="space-y-3">
                {preview.instructions && (
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                      Instrucciones
                    </p>
                    <div className="p-3 text-sm whitespace-pre-wrap" style={{ ...s.previewQ, border: "2px solid" }}>
                      {preview.instructions}
                    </div>
                  </div>
                )}
                {preview.objectives && (
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                      Objetivos
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {preview.objectives.map((o, i) => (
                        <li key={i} className="font-medium" style={s.textPrimary}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.criteria && (
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1" style={s.textPrimary}>
                      Criterios de evaluación
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {preview.criteria.map((c, i) => (
                        <li key={i} className="font-medium" style={s.textPrimary}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2" style={{ borderTop: "2px solid", borderColor: dark ? "#3f3f46" : "#f3f4f6" }}>
              <button
                onClick={() => generate()}
                className="flex-1 py-3 nb-border nb-press font-bold uppercase tracking-wide text-sm"
                style={{ background: dark ? "#3f3f46" : "#f3f4f6", color: dark ? "#fafafa" : "#1a1a1a" }}
              >
                ↻ Volver a generar
              </button>
              <button
                onClick={() => save("draft")}
                className="flex-1 py-3 nb-border nb-press font-bold uppercase tracking-wide text-sm"
                style={s.card}
              >
                Guardar como borrador
              </button>
              <button
                onClick={() => save("published")}
                className="flex-1 py-3 nb-border nb-press font-extrabold uppercase tracking-wide text-sm"
                style={{ background: "#C5E1A5", color: "#1a1a1a" }}
              >
                Publicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
