import React from "react";
import { Link } from "react-router-dom";
import { NBButton, NBBadge, NBCard } from "../components/nb";
import { useTheme } from "../lib/theme";
import { Trophy, BookOpen, Sparkles, ArrowRight, Star, Target, Users, Zap, Award, ChevronRight, Github, ExternalLink, Sun, Moon } from "lucide-react";

const LOGO_URL = "/logo.png";
const MARQUEE_WORDS = ["Aprende", "Enseña", "Sube de nivel", "Gana XP", "Desbloquea insignias", "Escala el ranking"];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="min-h-screen grain" style={{ background: dark ? "#18181b" : "#F5F1E4", color: dark ? "#fafafa" : "#1F5A2A" }}>
      {/* Top nav */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="NUMA" className="w-12 h-12 nb-border nb-shadow-sm object-cover bg-white" />
          <div className="leading-tight">
            <div className="font-display font-black text-2xl">NUMA</div>
            <div className="label-caps text-[0.6rem]" style={{ color: dark ? "#a1a1aa" : "#3E8E41" }}>Plantas & Bienestar</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="px-3 py-2 nb-border nb-press"
            style={{ background: dark ? "#27272a" : "white", color: dark ? "#fafafa" : "#1F5A2A" }}
            title={dark ? "Modo claro" : "Modo oscuro"}
            data-testid="theme-toggle-landing"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/login"><NBButton variant="ghost" data-testid="landing-login-btn">Entrar</NBButton></Link>
          <Link to="/register"><NBButton variant="dark" data-testid="landing-register-btn">Registrarse</NBButton></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <NBBadge color="#C5E1A5" className="animate-bounce-in">Plataforma educativa</NBBadge>
            <NBBadge color="#A5D6A7" className="animate-bounce-in" style={{animationDelay: "0.1s"}}>XP gamificado</NBBadge>
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight uppercase">
            Enseña. Aprende. <br/>
            <span className="nb-border px-3 inline-block my-1" style={{ background: "#8BC34A", color: "#1F5A2A" }}>Florece.</span>
          </h1>
          <p className="text-lg max-w-xl leading-relaxed" style={{ color: dark ? "#a1a1aa" : "#3E5A3E" }}>
            Un aula viva donde los profesores crean cursos, suben recursos y califican actividades — mientras los estudiantes ganan XP, desbloquean insignias y escalan el ranking.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register?role=teacher">
              <NBButton variant="primary" className="text-base px-7 py-3.5" data-testid="hero-teacher-cta">
                Soy profesor <ArrowRight className="inline w-4 h-4 ml-1" />
              </NBButton>
            </Link>
            <Link to="/register?role=student">
              <NBButton variant="purple" className="text-base px-7 py-3.5" data-testid="hero-student-cta">
                Soy estudiante <ArrowRight className="inline w-4 h-4 ml-1" />
              </NBButton>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 max-w-md">
            <Stat value="100+" label="XP por tarea" dark={dark} />
            <Stat value="6" label="Insignias" dark={dark} />
            <Stat value="∞" label="Cursos" dark={dark} />
          </div>
        </div>

        {/* Right visual panel */}
        <div className="lg:col-span-5 space-y-4">
          <NBCard color="yellow" className="p-6 rotate-1 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="label-caps" style={{ color: dark ? "#a1a1aa" : "rgba(31,90,42,0.7)" }}>Nivel 7</div>
                <div className="font-display font-black text-3xl">ALEX · 1,420 XP</div>
              </div>
              <Trophy className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <div className="mt-4 h-5 nb-border overflow-hidden" style={{ background: dark ? "#18181b" : "white" }}>
              <div className="h-full bg-[#A5D6A7] transition-all duration-700" style={{ width: "65%", borderRight: "2px solid #1F5A2A" }} />
            </div>
            <div className="label-caps mt-2">Siguiente: Nivel 8</div>
          </NBCard>

          <NBCard color="white" className="p-5 -rotate-1 animate-slide-up" style={{animationDelay: "0.1s"}}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 nb-border flex items-center justify-center shrink-0" style={{ background: "#FF6B6B" }}>
                <Star className="w-6 h-6 text-white" fill="white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-display font-black text-lg">Maestro del Quiz</div>
                <div className="text-sm" style={{ color: dark ? "#a1a1aa" : "#3E5A3E" }}>Sacó 95% en el Quiz de Botánica #3</div>
                <div className="label-caps mt-1" style={{ color: "#2E8B7F" }}>+50 XP · Desbloqueada</div>
              </div>
            </div>
          </NBCard>

          <NBCard color="teal" className="p-5 rotate-1 animate-slide-up" style={{animationDelay: "0.2s"}}>
            <div className="label-caps">Próxima actividad</div>
            <div className="font-display font-black text-xl mt-1">Ensayo — Plantas Medicinales</div>
            <div className="text-sm" style={{ color: dark ? "#a1a1aa" : "#3E5A3E" }}>Vence el viernes · Vale 120 XP</div>
          </NBCard>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y-2 py-4" style={{ borderColor: "#1F5A2A", background: "#1F5A2A", color: "#8BC34A" }}>
        <div className="flex animate-marquee whitespace-nowrap gap-12 font-display font-black text-3xl uppercase">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
            <span key={i} className="flex items-center gap-12">
              {w} <Sparkles className="inline w-6 h-6" />
            </span>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <section className="border-b-2" style={{ background: "#8BC34A", borderColor: "#1F5A2A" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <StatBlock icon={<Users className="w-6 h-6" />} value="50+" label="Estudiantes activos" />
          <StatBlock icon={<BookOpen className="w-6 h-6" />} value="12+" label="Cursos publicados" />
          <StatBlock icon={<Zap className="w-6 h-6" />} value="1,000+" label="XP otorgados" />
          <StatBlock icon={<Award className="w-6 h-6" />} value="200+" label="Insignias desbloqueadas" />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        <Feature icon={<BookOpen className="w-7 h-7" />} title="Crea cursos ricos" body="Sube PDFs y videos, inserta enlaces de YouTube y Drive, y redacta lecciones en texto enriquecido." color={dark ? "#2d3a1e" : "#8BC34A"} number="01" dark={dark} />
        <Feature icon={<Target className="w-7 h-7" />} title="Tareas + Quizzes" body="Programa actividades con fecha límite. Auto-califica quizzes. Revisa y puntúa entregas de archivos." color={dark ? "#1e3020" : "#C5E1A5"} number="02" dark={dark} />
        <Feature icon={<Trophy className="w-7 h-7" />} title="Gamifica todo" body="Los estudiantes ganan XP, suben de nivel, coleccionan insignias y escalan el ranking del curso." color={dark ? "#1e2e28" : "#A5D6A7"} number="03" dark={dark} />
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="font-display font-black text-4xl sm:text-5xl mb-10 uppercase">Cómo funciona</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <NBCard className="p-8">
            <NBBadge color="#8BC34A">Para profesores</NBBadge>
            <ol className="mt-4 space-y-3 font-medium">
              <Step n="01">Crea un curso y define su estilo</Step>
              <Step n="02">Agrega lecciones, recursos y actividades</Step>
              <Step n="03">Revisa entregas y califica con feedback</Step>
              <Step n="04">Observa cómo tu clase sube de nivel</Step>
            </ol>
          </NBCard>
          <NBCard color="purple" className="p-8">
            <NBBadge color="#F5F1E4">Para estudiantes</NBBadge>
            <ol className="mt-4 space-y-3 font-medium">
              <Step n="01">Explora e inscríbete en cualquier curso</Step>
              <Step n="02">Estudia las lecciones y descarga recursos</Step>
              <Step n="03">Entrega tareas o domina los quizzes</Step>
              <Step n="04">Gana XP, desbloquea insignias, lidera el ranking</Step>
            </ol>
          </NBCard>
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y-2 py-16" style={{ background: "#1F5A2A", borderColor: "#1F5A2A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase text-white">Stack tecnológico</h2>
          <p className="text-white/70 max-w-2xl mx-auto">Construido con tecnologías modernas y desplegado en la nube.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <TechBadge name="FastAPI" desc="Backend" />
            <TechBadge name="MongoDB" desc="Base de datos" />
            <TechBadge name="React" desc="Frontend" />
            <TechBadge name="Vercel" desc="Deploy" />
          </div>
          <div className="pt-4">
            <a href="https://github.com/Victor-Diaz-18/N-ma" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-mono text-sm nb-border bg-[#2a4a2e] px-4 py-2 hover:bg-[#3a5a3e] nb-press">
              <Github className="w-4 h-4" />
              Ver código fuente
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-b-2" style={{ background: "#8BC34A", borderColor: "#1F5A2A" }}>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="font-display font-black text-4xl sm:text-6xl uppercase" style={{ color: "#1F5A2A" }}>Tu aula. Desbloqueada.</h2>
          <p className="text-lg" style={{ color: "#2a4a2e" }}>Gratis para empezar. Invita a tus estudiantes en minutos.</p>
          <div className="flex justify-center gap-3">
            <Link to="/register">
              <NBButton variant="dark" className="text-base px-8 py-4 nb-press" data-testid="cta-register-btn">
                Comenzar <ChevronRight className="inline w-4 h-4 ml-1" />
              </NBButton>
            </Link>
            <Link to="/login">
              <NBButton variant="ghost" className="text-base px-8 py-4" data-testid="cta-login-btn">Entrar</NBButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
        <span className="font-mono">NUMA © 2026 · Plantas medicinales y bienestar.</span>
        <div className="flex gap-4">
          <a href="https://github.com/Victor-Diaz-18/N-ma" target="_blank" rel="noopener noreferrer" className="font-mono hover:opacity-80 transition-colors flex items-center gap-1">
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label, dark }) {
  return (
    <div className="nb-border p-3 text-center nb-shadow-sm" style={{ background: dark ? "#27272a" : "white" }}>
      <div className="font-display font-black text-2xl">{value}</div>
      <div className="label-caps text-[0.6rem]">{label}</div>
    </div>
  );
}

function StatBlock({ icon, value, label }) {
  return (
    <div className="space-y-2 text-[#1F5A2A]">
      <div className="flex justify-center">{icon}</div>
      <div className="font-display font-black text-3xl">{value}</div>
      <div className="label-caps text-[0.7rem]">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body, color, number, dark }) {
  return (
    <NBCard className="p-6 space-y-3 group hover:nb-shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 nb-border flex items-center justify-center" style={{ background: color, color: dark ? "#fafafa" : "#1F5A2A" }}>{icon}</div>
        <span className="font-mono font-bold text-4xl transition-colors" style={{ color: dark ? "rgba(250,250,250,0.15)" : "rgba(31,90,42,0.2)" }}>{number}</span>
      </div>
      <h3 className="font-display font-black text-2xl">{title}</h3>
      <p style={{ color: dark ? "#a1a1aa" : "#4A4A4A" }}>{body}</p>
    </NBCard>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-mono font-bold bg-[#1F5A2A] text-white px-2 py-0.5 text-xs">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function TechBadge({ name, desc }) {
  return (
    <div className="nb-border bg-[#2a4a2e] p-4 text-center nb-press">
      <div className="font-display font-black text-lg">{name}</div>
      <div className="label-caps text-[0.6rem] text-white/60">{desc}</div>
    </div>
  );
}
