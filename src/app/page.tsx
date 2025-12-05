import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main 
      className="min-h-screen text-[#c5c6c7] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #2a1f18 0%, #1a1410 40%, #0b0c10 100%)",
      }}
    >
      {/* Brick pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 47px, #3a2618 47px, #3a2618 48px, transparent 48px),
            linear-gradient(180deg, transparent 23px, #3a2618 23px, #3a2618 24px, transparent 24px)
          `,
          backgroundSize: "48px 24px",
        }}
      />

      {/* Landing artwork - positioned as hero */}
      <div className="relative w-full max-w-2xl mb-8">
        <div className="relative aspect-square rounded-lg overflow-hidden border-4 border-[#3a2618] shadow-2xl">
          <Image
            src="/assets/landing.png"
            alt="Alin's Basement"
            fill
            className="object-cover"
            priority
          />
          {/* Fallback gradient if image not loaded */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a1f18]/50 to-[#1a1410]/80 pointer-events-none" />
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        {/* Title */}
        <header className="text-center space-y-3">
          <h1 
            className="text-4xl md:text-6xl font-black tracking-wider"
            style={{
              fontFamily: "'Press Start 2P', 'VT323', monospace",
              color: "#8b7355",
              textShadow: "4px 4px 0 #3a2618, -2px -2px 0 #c9a959, 0 0 20px rgba(201,169,89,0.3)",
              letterSpacing: "0.08em",
            }}
          >
            ALIN&apos;S
            <br />
            BASEMENT
          </h1>
          <p className="text-[#c9a959]/80 text-sm md:text-base font-mono max-w-md mx-auto">
            Clean the mess. Fix the servers. Try not to lose your mind in the dark.
          </p>
        </header>

        {/* Main CTA */}
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/game"
            className="group relative px-10 py-4 rounded-lg font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(180deg, #c3073f 0%, #950740 100%)",
              boxShadow: "0 4px 0 #5c0320, 0 8px 20px rgba(195, 7, 63, 0.4)",
              color: "#fff",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            <span className="relative z-10">ENTER BASEMENT</span>
            <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link
            href="/requirements"
            className="text-[#66fcf1]/70 hover:text-[#66fcf1] text-sm font-mono transition-colors underline underline-offset-4"
          >
            View Requirements &amp; PRD
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid gap-3 md:grid-cols-2 mt-8">
          <div 
            className="rounded-lg p-4 text-sm"
            style={{
              background: "linear-gradient(135deg, #1a1410 0%, #12161e 100%)",
              border: "2px solid #3a2618",
            }}
          >
            <div className="text-[#c9a959] font-bold uppercase text-xs tracking-wider mb-2">
              Survival Mechanics
            </div>
            <ul className="space-y-1 text-[#8b7355]">
              <li>• Sanity drains over time</li>
              <li>• Clean trash to restore mental health</li>
              <li>• Coffee boosts stamina</li>
              <li>• Sprint with SHIFT (uses stamina)</li>
            </ul>
          </div>
          <div 
            className="rounded-lg p-4 text-sm"
            style={{
              background: "linear-gradient(135deg, #1a1410 0%, #12161e 100%)",
              border: "2px solid #3a2618",
            }}
          >
            <div className="text-[#c9a959] font-bold uppercase text-xs tracking-wider mb-2">
              Your Mission
            </div>
            <ul className="space-y-1 text-[#8b7355]">
              <li>• Boot up the main server</li>
              <li>• Clean up all the trash</li>
              <li>• Don&apos;t let sanity hit zero</li>
              <li>• Survive the basement</li>
            </ul>
          </div>
        </div>

        {/* Tech stack footer */}
        <footer className="text-center text-xs text-[#3a2618] pt-6">
          Built with Next.js + Phaser + Zustand
        </footer>
      </div>
    </main>
  );
}
