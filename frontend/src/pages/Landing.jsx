import React from "react";
import { Link } from "react-router-dom";
import { NBButton, NBBadge, NBCard } from "../components/nb";
import { Zap, Trophy, BookOpen, Sparkles, ArrowRight, Users, Star, Target } from "lucide-react";

const MARQUEE_WORDS = ["Learn", "Teach", "Level Up", "Earn XP", "Unlock Badges", "Climb Leaderboards"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] grain">
      {/* Top nav */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#FFE156] nb-border nb-shadow-sm flex items-center justify-center">
            <Zap className="w-6 h-6" strokeWidth={3} />
          </div>
          <span className="font-display font-black text-2xl">EduQuest</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login"><NBButton variant="ghost" data-testid="landing-login-btn">Login</NBButton></Link>
          <Link to="/register"><NBButton variant="dark" data-testid="landing-register-btn">Sign up</NBButton></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <NBBadge color="#98F5E1" className="animate-bounce-in">Neo-Learning Platform</NBBadge>
            <NBBadge color="#C4A1FF" className="animate-bounce-in" style={{animationDelay: "0.1s"}}>Gamified XP</NBBadge>
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight uppercase">
            Teach. Learn. <br/>
            <span className="bg-[#FFE156] nb-border px-3 inline-block my-1">Level up.</span>
          </h1>
          <p className="text-lg max-w-xl text-[#4A4A4A] leading-relaxed">
            A bold classroom where teachers craft courses, upload resources, and grade activities — while students earn XP, unlock badges, and race up the leaderboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register?role=teacher">
              <NBButton variant="primary" className="text-base px-7 py-3.5" data-testid="hero-teacher-cta">
                I'm a teacher <ArrowRight className="inline w-4 h-4 ml-1" />
              </NBButton>
            </Link>
            <Link to="/register?role=student">
              <NBButton variant="purple" className="text-base px-7 py-3.5" data-testid="hero-student-cta">
                I'm a student <ArrowRight className="inline w-4 h-4 ml-1" />
              </NBButton>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 max-w-md">
            <Stat value="100+" label="XP per task" />
            <Stat value="6" label="Badges" />
            <Stat value="∞" label="Courses" />
          </div>
        </div>

        {/* Right visual panel */}
        <div className="lg:col-span-5 space-y-4">
          <NBCard color="yellow" className="p-6 rotate-1 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <div className="label-caps text-black/60">Level 7</div>
                <div className="font-display font-black text-3xl">ALEX ·  1,420 XP</div>
              </div>
              <Trophy className="w-10 h-10" strokeWidth={2.5} />
            </div>
            <div className="mt-4 h-5 nb-border bg-white overflow-hidden">
              <div className="h-full bg-[#C4A1FF]" style={{ width: "65%", borderRight: "2px solid #0A0A0A" }} />
            </div>
            <div className="label-caps mt-2">Next: Level 8</div>
          </NBCard>

          <NBCard color="white" className="p-5 -rotate-1 animate-slide-up" style={{animationDelay: "0.1s"}}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#FF6B6B] nb-border flex items-center justify-center">
                <Star className="w-6 h-6 text-white" fill="white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-display font-black text-lg">Quiz Master</div>
                <div className="text-sm text-[#4A4A4A]">Scored 95% on Physics Quiz #3</div>
                <div className="label-caps mt-1 text-[#4ECDC4]">+50 XP · Unlocked</div>
              </div>
            </div>
          </NBCard>

          <NBCard color="teal" className="p-5 rotate-1 animate-slide-up" style={{animationDelay: "0.2s"}}>
            <div className="label-caps">Upcoming activity</div>
            <div className="font-display font-black text-xl mt-1">Essay — The Cold War</div>
            <div className="text-sm">Due Friday · Worth 120 XP</div>
          </NBCard>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y-2 border-black bg-black text-[#FFE156] overflow-hidden py-4">
        <div className="flex animate-marquee whitespace-nowrap gap-12 font-display font-black text-3xl uppercase">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
            <span key={i} className="flex items-center gap-12">
              {w} <Sparkles className="inline w-6 h-6" />
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        <Feature icon={<BookOpen className="w-7 h-7" />} title="Build rich courses" body="Upload PDFs & videos, embed YouTube & Drive links, and write lesson pages in rich text." color="#FFE156" />
        <Feature icon={<Target className="w-7 h-7" />} title="Assignments + Quizzes" body="Schedule tasks with due dates. Auto-grade quizzes. Review and grade file submissions." color="#98F5E1" />
        <Feature icon={<Trophy className="w-7 h-7" />} title="Gamify everything" body="Students earn XP, level up, collect badges, and climb the course leaderboard." color="#C4A1FF" />
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="font-display font-black text-4xl sm:text-5xl mb-10 uppercase">How it works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <NBCard className="p-8">
            <NBBadge color="#FFE156">For Teachers</NBBadge>
            <ol className="mt-4 space-y-3 font-medium">
              <Step n="01">Create a course & set the vibe</Step>
              <Step n="02">Add lessons, resources, activities</Step>
              <Step n="03">Review submissions, grade with feedback</Step>
              <Step n="04">Watch your class level up</Step>
            </ol>
          </NBCard>
          <NBCard color="purple" className="p-8">
            <NBBadge color="#FDFBF7">For Students</NBBadge>
            <ol className="mt-4 space-y-3 font-medium">
              <Step n="01">Browse and enroll in any course</Step>
              <Step n="02">Study lessons & download resources</Step>
              <Step n="03">Submit assignments or ace quizzes</Step>
              <Step n="04">Earn XP, unlock badges, top the leaderboard</Step>
            </ol>
          </NBCard>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-16 border-y-2 border-black">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="font-display font-black text-4xl sm:text-6xl uppercase">Your classroom. Unlocked.</h2>
          <p className="text-[#FDFBF7]/80">Free to start. Invite students in minutes.</p>
          <div className="flex justify-center gap-3">
            <Link to="/register"><NBButton variant="primary" className="text-base px-8 py-4" data-testid="cta-register-btn">Get started</NBButton></Link>
            <Link to="/login"><NBButton variant="ghost" className="text-base px-8 py-4" data-testid="cta-login-btn">Login</NBButton></Link>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-sm">
        <span className="font-mono">EduQuest © 2026</span>
        <span className="font-mono">Built with love & 2px borders.</span>
      </footer>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="nb-border bg-white p-3 text-center">
      <div className="font-display font-black text-2xl">{value}</div>
      <div className="label-caps text-[0.6rem]">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body, color }) {
  return (
    <NBCard className="p-6 space-y-3">
      <div className="w-14 h-14 nb-border flex items-center justify-center" style={{ background: color }}>{icon}</div>
      <h3 className="font-display font-black text-2xl">{title}</h3>
      <p className="text-[#4A4A4A]">{body}</p>
    </NBCard>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="font-mono font-bold bg-black text-white px-2 py-0.5 text-xs">{n}</span>
      <span>{children}</span>
    </li>
  );
}
