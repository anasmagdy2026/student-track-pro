import { useState, useEffect } from 'react';
import { GraduationCap, Atom, FlaskConical } from 'lucide-react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 2800),
      setTimeout(() => onFinish(), 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${phase >= 5 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, hsl(217 91% 20%) 0%, hsl(217 91% 35%) 40%, hsl(217 91% 45%) 100%)',
      }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${8 + (i % 4) * 6}px`,
              height: `${8 + (i % 4) * 6}px`,
              left: `${10 + (i * 7) % 80}%`,
              top: `${5 + (i * 11) % 85}%`,
              background: i % 2 === 0 ? 'hsl(38 92% 50%)' : 'hsl(0 0% 100%)',
              animation: `splash-float ${3 + (i % 3)}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Icon */}
      <div
        className={`relative mb-6 transition-all duration-700 ease-out ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
          style={{
            background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(38 92% 60%))',
            boxShadow: '0 8px 32px hsl(38 92% 50% / 0.4)',
          }}
        >
          <GraduationCap className="w-12 h-12 text-white" />
          
          {/* Orbiting icons */}
          <div
            className={`absolute transition-all duration-700 delay-300 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}
            style={{ animation: 'splash-orbit 4s linear infinite', transformOrigin: '50% 50%' }}
          >
            <Atom className="w-5 h-5 text-white/60 absolute -top-8 -right-4" />
          </div>
          <div
            className={`absolute transition-all duration-700 delay-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}
            style={{ animation: 'splash-orbit 5s linear infinite reverse', transformOrigin: '50% 50%' }}
          >
            <FlaskConical className="w-5 h-5 text-white/60 absolute -bottom-8 -left-4" />
          </div>
        </div>

        {/* Pulse ring */}
        <div
          className={`absolute inset-0 rounded-3xl transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}
          style={{
            animation: 'splash-pulse-ring 2s ease-out infinite',
            border: '2px solid hsl(38 92% 50% / 0.3)',
          }}
        />
      </div>

      {/* Name */}
      <h1
        className={`text-3xl font-extrabold text-white mb-2 transition-all duration-700 ease-out ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ fontFamily: 'Cairo, sans-serif', textShadow: '0 2px 16px hsl(217 91% 10% / 0.5)' }}
      >
        مستر محمد مجدي
      </h1>

      {/* Subtitle */}
      <p
        className={`text-lg font-semibold mb-1 transition-all duration-700 ease-out delay-200 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ color: 'hsl(38 92% 65%)', fontFamily: 'Cairo, sans-serif' }}
      >
        أستاذ الكيمياء والعلوم المتكاملة
      </p>

      {/* Divider line */}
      <div
        className={`h-0.5 rounded-full my-4 transition-all duration-700 ease-out ${phase >= 3 ? 'w-32 opacity-100' : 'w-0 opacity-0'}`}
        style={{ background: 'linear-gradient(90deg, transparent, hsl(38 92% 50%), transparent)' }}
      />

      {/* System name */}
      <p
        className={`text-sm text-white/60 transition-all duration-700 ease-out ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        نظام متابعة الطلاب
      </p>

      {/* Loading dots */}
      <div className={`flex gap-1.5 mt-8 transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'hsl(38 92% 50%)',
              animation: 'splash-bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-float {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes splash-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splash-pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes splash-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
