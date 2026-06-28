import { useState } from "react";
import { X, Sparkles, FileText, ClipboardCheck, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

const ACTIVITY_TYPES = [
  { id: "quiz", label: "Quiz", icon: ClipboardCheck, desc: "Preguntas de opción múltiple" },
  { id: "exam", label: "Examen", icon: FileText, desc: "Evaluación mixta con varios tipos" },
  { id: "assignment", label: "Tarea", icon: BookOpen, desc: "Actividad práctica con instrucciones" },
];

export default function AIGenerateModal({ open, onClose, courseId, onSaved }) {
  const [step, setStep] = useState("type"); // type | loading | preview
  const [activityType, setActivityType] = useState("quiz");
  const [numQuestions, setNumQuestions] = useState(5);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
      const msg = e.response?.data?.detail || "Error al generar actividad";
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

  const regenerate = () => {
    generate();
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
      <div className="bg-white nb-border nb-shadow w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-xl font-extrabold uppercase tracking-wide">
              Generar actividad con IA
            </h2>
          </div>
          <button onClick={reset} className="nb-press p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Type Selection */}
        {step === "type" && (
          <div className="p-5 space-y-4">
            {error && (
              <div className="bg-red-50 border-2 border-red-400 p-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <p className="font-bold text-sm uppercase tracking-wide">
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
                    className={`p-4 nb-border nb-press text-left ${
                      selected
                        ? "bg-[#C5E1A5] border-2 border-black"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <div className="font-extrabold text-lg">{t.label}</div>
                    <div className="text-xs font-medium text-gray-600 mt-1">
                      {t.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {(activityType === "quiz" || activityType === "exam") && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide mb-1">
                  Número de preguntas
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-3 py-2 nb-border bg-white font-bold"
                >
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} preguntas
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={generate}
              className="w-full bg-black text-white py-3 nb-border nb-press font-extrabold uppercase tracking-wide text-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Generar
            </button>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="p-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-extrabold text-lg uppercase tracking-wide">
              Generando contenido...
            </p>
            <p className="text-sm text-gray-500 font-medium">
              La IA está creando tu actividad
            </p>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && preview && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide mb-1">
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 nb-border bg-white font-bold"
                placeholder="Título de la actividad"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 nb-border bg-white font-bold min-h-[80px] resize-y"
                placeholder="Descripción de la actividad"
              />
            </div>

            {/* Quiz/Exam preview */}
            {(activityType === "quiz" || activityType === "exam") && preview.questions && (
              <div className="space-y-3">
                <p className="text-sm font-extrabold uppercase tracking-wide">
                  {preview.questions.length} preguntas generadas
                </p>
                {preview.questions.map((q, i) => (
                  <div key={i} className="bg-gray-50 border-2 border-gray-200 p-3">
                    <p className="font-bold text-sm mb-2">
                      <span className="bg-black text-white px-2 py-0.5 mr-2 text-xs font-extrabold">
                        P{i + 1}
                      </span>
                      {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-1 ml-8">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className={`text-xs font-medium px-2 py-1 ${
                            j === q.correct_index
                              ? "bg-[#C5E1A5] border border-[#8BC34A]"
                              : "bg-white border border-gray-200"
                          }`}
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
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1">
                      Instrucciones
                    </p>
                    <div className="bg-gray-50 border-2 border-gray-200 p-3 text-sm whitespace-pre-wrap">
                      {preview.instructions}
                    </div>
                  </div>
                )}
                {preview.objectives && (
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1">
                      Objetivos
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {preview.objectives.map((o, i) => (
                        <li key={i} className="font-medium">{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {preview.criteria && (
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide mb-1">
                      Criterios de evaluación
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      {preview.criteria.map((c, i) => (
                        <li key={i} className="font-medium">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t-2 border-gray-100">
              <button
                onClick={regenerate}
                className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 nb-border nb-press font-bold uppercase tracking-wide text-sm"
              >
                ↻ Volver a generar
              </button>
              <button
                onClick={() => save("draft")}
                className="flex-1 bg-white hover:bg-gray-50 py-3 nb-border nb-press font-bold uppercase tracking-wide text-sm"
              >
                Guardar como borrador
              </button>
              <button
                onClick={() => save("published")}
                className="flex-1 bg-[#C5E1A5] hover:bg-[#b5d195] py-3 nb-border nb-press font-extrabold uppercase tracking-wide text-sm"
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
