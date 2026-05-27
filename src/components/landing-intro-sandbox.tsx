"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Crown, Flame, Gem, Hammer, Pickaxe, Ship, Swords, Trees } from "lucide-react";

const TOTAL_RUNTIME_MS = 25000;

const STAGES = [
  {
    name: "The Village",
    label: "Ideation",
    color: "#34D399",
    icon: Trees,
    assets: ["/assets/fan-tasy/House_Hay_1.png", "/assets/fan-tasy/BulletinBoard_1.png"],
  },
  {
    name: "The Forest",
    label: "Research",
    color: "#22C55E",
    icon: Trees,
    assets: ["/assets/fan-tasy/Bush_Emerald_3.png", "/assets/fan-tasy/Flowers_White.png"],
  },
  {
    name: "The Arena",
    label: "Testing",
    color: "#C084FC",
    icon: Swords,
    assets: ["/assets/dungeon/items%20and%20trap_animation/torch/torch_1.png", "/assets/dungeon/items%20and%20trap_animation/peaks/peaks_1.png"],
  },
  {
    name: "Artisan's Quarter",
    label: "Design / Launch",
    color: "#FBBF24",
    icon: Hammer,
    assets: ["/assets/fan-tasy/Crate_Medium_Closed.png", "/assets/fan-tasy/Bench_1.png"],
  },
  {
    name: "The Mine",
    label: "Investment",
    color: "#A1A1AA",
    icon: Pickaxe,
    assets: ["/assets/dungeon/items%20and%20trap_animation/keys/keys_1_1.png", "/assets/dungeon/items%20and%20trap_animation/mini_chest/mini_chest_1.png"],
  },
  {
    name: "The Harbour",
    label: "Scaling",
    color: "#60A5FA",
    icon: Ship,
    assets: ["/assets/fan-tasy/Crate_Water_1.png", "/assets/fan-tasy/Banner_Stick_1_Purple.png"],
  },
];

export default function LandingIntroSandbox() {
  const [stage, setStage] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setStage(0);
    setClosing(false);
    const timeline = [
      { at: 900, value: 1 },
      { at: 2500, value: 2 },
      { at: 5000, value: 3 },
      { at: 10000, value: 4 },
      { at: 15000, value: 5 },
      { at: 20000, value: 6 },
      { at: 24400, value: 7 },
    ];
    const timers = timeline.map(({ at, value }) =>
      window.setTimeout(() => setStage(value), at),
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (stage !== 7) return;
    setClosing(true);
  }, [stage]);

  return (
    <div
      role="dialog"
      aria-label="Ibhaveda intro preview"
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#070A0F] text-white"
      style={{
        opacity: closing ? 0 : 1,
        transition: "opacity 700ms ease",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(247,214,109,0.12),transparent_26%),radial-gradient(circle_at_74%_78%,rgba(124,58,237,0.15),transparent_34%),linear-gradient(180deg,#070A0F_0%,#0A0D12_58%,#05070B_100%)]" />
      <PixelField />

      <button
        type="button"
        onClick={() => setClosing(true)}
        className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition hover:border-white/20 hover:text-white"
      >
        Skip intro
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/[0.05]">
        <div
          className="h-full bg-gradient-to-r from-[#4B1E91] via-[#E48AA6] to-[#F7D66D] shadow-[0_0_24px_rgba(247,214,109,0.35)]"
          style={{ animation: `intro-progress ${TOTAL_RUNTIME_MS}ms linear forwards` }}
        />
      </div>

      <div className="relative z-10 grid min-h-dvh place-items-center px-4 py-9 sm:px-6">
        {stage < 3 && <OpeningHook stage={stage} />}
        {stage === 3 && <ProductLaunch activeStep={stage} />}
        {stage === 4 && <BossGate />}
        {stage === 5 && <VillageCheckpoint />}
        {stage >= 6 && <StageRun />}
      </div>

      <style>{`
        @keyframes intro-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes drift-pixel {
          from { transform: translate3d(0, 0, 0) scale(1); opacity: 0.32; }
          50% { opacity: 0.86; }
          to { transform: translate3d(var(--x), var(--y), 0) scale(0.8); opacity: 0; }
        }
        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(18px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 0 rgba(247,214,109,0), 0 0 80px rgba(124,58,237,0.16); }
          50% { box-shadow: 0 0 44px rgba(247,214,109,0.16), 0 0 120px rgba(124,58,237,0.24); }
        }
        @keyframes panel-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes runner-move {
          0% { left: 14%; top: 66%; }
          28% { left: 31%; top: 50%; }
          56% { left: 50%; top: 60%; }
          84%, 100% { left: 70%; top: 38%; }
        }
        @keyframes checkpoint-glow {
          0%, 100% { box-shadow: 0 0 16px rgba(247,214,109,0.14); transform: scale(1); }
          50% { box-shadow: 0 0 34px rgba(247,214,109,0.45); transform: scale(1.08); }
        }
        @keyframes card-step {
          from { opacity: 0.35; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes boss-hit {
          0%, 100% { transform: translateX(0); filter: brightness(1); }
          20% { transform: translateX(-5px); filter: brightness(1.8); }
          40% { transform: translateX(5px); }
        }
        @keyframes strike-through {
          from { width: 0%; opacity: 0.2; }
          to { width: calc(100% - 32px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function OpeningHook({ stage }: { stage: number }) {
  if (stage < 2) {
    return (
      <section className="flex w-full max-w-4xl flex-col items-center text-center">
        <p className="text-xs font-bold uppercase tracking-[0.42em] text-[#F7D66D]">
          Before Ibhaveda
        </p>
        <div
          className="mt-8 grid w-full gap-4 sm:grid-cols-2"
          style={{ animation: "reveal-up 700ms ease both" }}
        >
          <StrikeLine text="Traditional incubators? Gatekept." delayMs={500} />
          <StrikeLine text="Ideas stuck in group chats." delayMs={1150} />
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full max-w-5xl flex-col items-center text-center">
      <div
        className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl sm:h-36 sm:w-36"
        style={{ animation: "logo-pulse 2400ms ease-in-out infinite" }}
      >
        <img src="/ibhaveda-logo.jpg" alt="Ibhaveda logo" className="h-full w-full object-cover" />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.42em] text-[#F7D66D]">
        Ibhaveda
      </p>
      <h1
        className="mt-4 max-w-4xl font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
        style={{ animation: "reveal-up 800ms ease both" }}
      >
        What if building your startup felt like playing a video game?
      </h1>
    </section>
  );
}

function ProductLaunch({ activeStep }: { activeStep: number }) {
  return (
    <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left" style={{ animation: "reveal-up 700ms ease both" }}>
        <div
          className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl sm:h-36 sm:w-36"
          style={{ animation: "logo-pulse 2400ms ease-in-out infinite" }}
        >
          <img src="/ibhaveda-logo.jpg" alt="Ibhaveda logo" className="h-full w-full object-cover" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.42em] text-[#F7D66D]">
          Ibhaveda
        </p>
        <h1 className="mt-4 max-w-xl font-display text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Post an idea. Meet likely collaborators.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
          Ibhaveda matches you with people most likely to become free collaborators.
        </p>
      </div>

      <LiveSiteFrame activeStep={activeStep} />
    </section>
  );
}

function StrikeLine({ text, delayMs }: { text: string; delayMs: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left text-sm font-bold text-slate-300 sm:text-base">
      <span className="relative z-10">{text}</span>
      <span
        className="absolute left-4 top-1/2 z-20 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-[#E48AA6] to-transparent shadow-[0_0_14px_rgba(228,138,166,0.55)]"
        style={{ animation: `strike-through 650ms ${delayMs}ms cubic-bezier(0.65,0,0.35,1) forwards` }}
      />
    </div>
  );
}

function LiveSiteFrame({ activeStep }: { activeStep: number }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0B111A]/95 shadow-2xl" style={{ animation: "reveal-up 800ms ease both" }}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Feed
        </div>
      </div>

      <div className="grid min-h-[440px] gap-0 md:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-white/10 p-4 md:block">
          <div className="mb-5 flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-bold">Ibhaveda</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Builder Network</p>
            </div>
          </div>
          {["Feed", "My Ideas", "World Map", "Requests"].map((item, index) => (
            <div
              key={item}
              className={`mb-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                index === 0 ? "bg-indigo-500/15 text-white" : "text-slate-500"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="relative p-4 sm:p-6">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-500/20 text-sm font-black text-indigo-200">A</div>
              <div>
                <p className="text-sm font-bold">Write your idea</p>
                <p className="text-xs text-slate-500">AI-powered study planner for exam week</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {["Edtech", "AI", "Productivity"].map((tag) => (
                <span key={tag} className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-center text-[11px] font-semibold text-indigo-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="my-3 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F7D66D]">
            <span className="h-px w-16 bg-[#F7D66D]/30" />
            Matching likely free collaborators
            <span className="h-px w-16 bg-[#F7D66D]/30" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Riya", "Research", "92%", "#34D399"],
              ["Arjun", "Build", "88%", "#60A5FA"],
              ["Unnati", "Launch", "84%", "#F7D66D"],
            ].map(([name, role, match, color], index) => (
              <div
                key={name}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                style={{
                  opacity: activeStep >= 1 || index === 0 ? 1 : 0.38,
                  transform: activeStep >= 1 ? "translateY(0)" : `translateY(${index * 8}px)`,
                  transition: "opacity 500ms ease, transform 500ms ease",
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-black text-black" style={{ background: color }}>
                    {name[0]}
                  </div>
                    <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">{role}</p>
                  </div>
                </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-black" style={{ color }}>
                    {match}
                  </div>
                </div>
                <div className="mb-2 rounded-xl border border-white/10 bg-black/20 px-2.5 py-2">
                  <p className="text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-slate-500">
                    Free collaborator fit
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${70 + index * 8}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#F7D66D]/25 bg-[#F7D66D]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#F7D66D]">Invite collaborators</span>
              <ArrowRight className="h-4 w-4 text-[#F7D66D]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VillageCheckpoint() {
  return (
    <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
      <VillageMap />
      <div className="grid gap-4" style={{ animation: "reveal-up 700ms ease both" }}>
        <MiniHud />
        <TaskCard done label="T1" text="Define the user" />
        <TaskCard done label="T2" text="Validate the problem" />
        <TaskCard label="T3" text="Upload proof" highlighted />
      </div>
    </section>
  );
}

function VillageMap() {
  const checkpoints = [
    { left: "15%", top: "68%", active: true },
    { left: "32%", top: "52%", active: true },
    { left: "51%", top: "62%", active: true },
    { left: "72%", top: "40%", active: false },
  ];

  return (
    <div className="relative min-h-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-[#10151F] shadow-2xl" style={{ animation: "reveal-up 700ms ease both" }}>
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_72%,rgba(52,211,153,0.18),transparent_30%),radial-gradient(circle_at_72%_35%,rgba(247,214,109,0.16),transparent_26%)]" />

      <img src="/assets/fan-tasy/House_Hay_2.png" alt="" className="absolute left-[9%] top-[13%] h-24 w-24 object-contain [image-rendering:pixelated]" />
      <img src="/assets/fan-tasy/House_Hay_4_Purple.png" alt="" className="absolute right-[10%] top-[15%] h-28 w-28 object-contain [image-rendering:pixelated]" />
      <img src="/assets/fan-tasy/BulletinBoard_1.png" alt="" className="absolute bottom-[15%] left-[13%] h-16 w-16 object-contain [image-rendering:pixelated]" />
      <img src="/assets/fan-tasy/Flowers_Red.png" alt="" className="absolute bottom-[22%] right-[15%] h-12 w-12 object-contain [image-rendering:pixelated]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M17 72 C 28 58, 33 54, 37 54 S 48 64, 53 63 S 63 48, 75 42" fill="none" stroke="rgba(247,214,109,0.35)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 2" />
      </svg>

      {checkpoints.map((point, index) => (
        <div
          key={index}
          className="absolute grid h-14 w-14 place-items-center border bg-[#0B111A]/90 text-sm font-black"
          style={{
            left: point.left,
            top: point.top,
            borderColor: point.active ? "#F7D66D" : "rgba(255,255,255,0.16)",
            color: point.active ? "#F7D66D" : "rgba(255,255,255,0.45)",
            animation: point.active ? "checkpoint-glow 1700ms ease-in-out infinite" : undefined,
          }}
        >
          {index + 1}
        </div>
      ))}

      <div className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2" style={{ animation: "runner-move 5000ms ease-in-out forwards" }}>
        <SpriteFrame
          src="/assets/fan-tasy/Character_Idle.png"
          className="h-full w-full drop-shadow-[0_0_18px_rgba(247,214,109,0.55)]"
        />
      </div>

      <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#F7D66D] backdrop-blur">
        The Village
      </div>
    </div>
  );
}

function StageRun() {
  return (
    <section className="w-full max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl object-cover" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F7D66D]">World map</p>
            <p className="text-lg font-black">Stages unlock visually</p>
          </div>
        </div>
        <Pill>6 of 8 shown</Pill>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage, index) => (
          <StageCard key={stage.name} stage={stage} index={index} />
        ))}
      </div>
    </section>
  );
}

function StageCard({ stage, index }: { stage: (typeof STAGES)[number]; index: number }) {
  const Icon = stage.icon;
  return (
    <div
      className="relative min-h-[168px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0B111A] p-4 shadow-xl"
      style={{ animation: `card-step 520ms ${index * 95}ms ease both` }}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl" style={{ background: `${stage.color}33` }} />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: stage.color }}>
              {stage.label}
            </p>
            <h3 className="mt-2 text-xl font-black text-white">{stage.name}</h3>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
            <Icon className="h-5 w-5" style={{ color: stage.color }} />
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div className="flex gap-2">
            {stage.assets.map((asset) => (
              <img key={asset} src={asset} alt="" className="h-14 w-14 object-contain [image-rendering:pixelated]" />
            ))}
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-300">
            {index + 1}
          </div>
        </div>
      </div>
    </div>
  );
}

function BossGate() {
  return (
    <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="relative min-h-[460px] overflow-hidden rounded-[28px] border border-white/10 bg-[#080B11] p-5 shadow-2xl">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(247,214,109,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(247,214,109,0.09)_1px,transparent_1px)] [background-size:28px_28px]" />
        <img
          src="/assets/dungeon/character%20and%20tileset/demonstration.png"
          alt=""
          className="absolute bottom-0 left-0 h-full w-full object-cover opacity-20 [image-rendering:pixelated]"
        />
        <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between">
          <div className="flex items-center justify-between">
            <Pill>Boss gate</Pill>
            <Pill>Stage clear</Pill>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-5">
            <Fighter label="Builder" icon={<Crown className="h-9 w-9 text-[#F7D66D]" />} />
            <div className="pb-8 text-[#F7D66D]">
              <Swords className="h-10 w-10" />
            </div>
            <div style={{ animation: "boss-hit 420ms ease 3" }}>
              <Fighter
                label="Doubt Boss"
                image="/assets/dungeon/Character_animation/monsters_idle/skull/v1/skull_v1_1.png"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span>Boss HP</span>
              <span>8%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[8%] rounded-full bg-gradient-to-r from-[#E48AA6] to-[#F7D66D]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4" style={{ animation: "reveal-up 700ms ease both" }}>
        <RewardCard icon={<Flame className="h-5 w-5" />} title="Level up" value="+75 XP" />
        <RewardCard icon={<Gem className="h-5 w-5" />} title="Gold checkpoint" value="Proof accepted" />
        <div className="rounded-[24px] border border-[#F7D66D]/25 bg-[#F7D66D]/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-[0.24em] text-[#F7D66D]">Next biome unlocked</span>
            <ArrowRight className="h-5 w-5 text-[#F7D66D]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Fighter({ label, icon, image }: { label: string; icon?: React.ReactNode; image?: string }) {
  return (
    <div className="text-center">
      <div className="grid h-24 w-24 place-items-center border border-[#F7D66D]/35 bg-[#F7D66D]/10 shadow-[0_0_42px_rgba(247,214,109,0.16)]">
        {image ? (
          <img src={image} alt="" className="h-16 w-16 object-contain [image-rendering:pixelated]" />
        ) : (
          icon
        )}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-300">{label}</p>
    </div>
  );
}

function SpriteFrame({ src, className }: { src: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: `url("${src}")`,
        backgroundPosition: "0% 0%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "400% 400%",
        imageRendering: "pixelated",
      }}
    />
  );
}

function MiniHud() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0B111A]/95 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Stage 1</p>
          <p className="text-xl font-black">The Village</p>
        </div>
        <Pill>3 / 4 CP</Pill>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#34D399] to-[#F7D66D]" />
      </div>
    </div>
  );
}

function TaskCard({ label, text, done, highlighted }: { label: string; text: string; done?: boolean; highlighted?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlighted ? "border-[#F7D66D]/35 bg-[#F7D66D]/10" : "border-white/10 bg-white/[0.04]"}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-bold text-white">{text}</p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-full ${done ? "bg-emerald-400 text-black" : "border border-[#F7D66D]/40 text-[#F7D66D]"}`}>
          {done ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
}

function RewardCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F7D66D]/10 text-[#F7D66D]">{icon}</div>
          <p className="text-lg font-black">{title}</p>
        </div>
        <span className="text-sm font-bold text-[#F7D66D]">{value}</span>
      </div>
    </div>
  );
}

function PixelField() {
  const pixels = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        id: index,
        left: 8 + ((index * 23) % 84),
        top: 7 + ((index * 31) % 80),
        delay: (index % 9) * 260,
        size: 7 + (index % 4) * 3,
        x: `${(index % 2 === 0 ? 1 : -1) * (24 + (index % 5) * 10)}px`,
        y: `${-24 - (index % 6) * 12}px`,
        color: ["#F7D66D", "#E48AA6", "#7C3AED", "#45D5FF"][index % 4],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pixels.map((pixel) => (
        <span
          key={pixel.id}
          className="absolute block"
          style={{
            left: `${pixel.left}%`,
            top: `${pixel.top}%`,
            width: pixel.size,
            height: pixel.size,
            background: pixel.color,
            opacity: 0,
            animation: `drift-pixel 4200ms ${pixel.delay}ms ease-in-out infinite`,
            "--x": pixel.x,
            "--y": pixel.y,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {children}
    </span>
  );
}
