import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { signInAsGuest } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

export const Welcome: React.FC = () => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const { updateProfile } = useAuth();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      await signInAsGuest();
      await updateProfile(name);
    } catch (error: any) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/admin-restricted-operation') {
        setErrorStatus('DEBES ACTIVAR EL LOGIN ANÓNIMO EN TU CONSOLA DE FIREBASE');
      } else {
        setErrorStatus('FALLO DE CONEXIÓN CON MATRIX. INTÉNTALO DE NUEVO.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-left"
        >
          <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest mb-8">
            Mundial 2026 • Editorial Edition
          </span>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-10 leading-[0.85] italic uppercase font-serif">
            The <span className="text-[#FF3E00]">Next</span> Generation of <span className="underline decoration-[#FF3E00] decoration-8 underline-offset-8">Drafts</span>
          </h1>
          <p className="text-xl text-[#1A1A1A] mb-12 max-w-xl leading-tight font-medium opacity-80">
            Forget boring bets. Experience a <span className="italic font-serif">real-time draft</span>, select your 4 exclusive teams and dominate the office leaderboard.
          </p>

          <form onSubmit={handleJoin} className="max-w-md space-y-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="TU NOMBRE DE USUARIO"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="w-full border-8 border-black p-6 text-xl font-black uppercase tracking-widest focus:outline-none focus:ring-0 placeholder:text-black/20"
                required
              />
              <div className="absolute inset-0 border-8 border-black translate-x-3 translate-y-3 -z-10 bg-[#FF3E00]/10 group-focus-within:translate-x-0 group-focus-within:translate-y-0 transition-all"></div>
            </div>
            
            {errorStatus && (
              <div className="bg-black text-white p-4 border-l-4 border-[#FF3E00] text-[10px] font-black uppercase tracking-widest animate-shake">
                {errorStatus}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full bg-black text-white py-6 text-2xl font-black uppercase tracking-tighter hover:bg-[#FF3E00] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isSubmitting ? 'INITIALIZING...' : 'IDENTIFY & ENTER'}
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">
              No password required // Instant access to Draft Matrix
            </p>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="absolute inset-0 bg-[#FF3E00] rotate-3 -z-10 border-4 border-black"></div>
          <div className="bg-white border-4 border-black p-12 shadow-2xl">
            <div className="space-y-12">
              {[
                {
                  icon: Users,
                  title: "Snake Draft",
                  desc: "Fair turn-based order. Your strategy starts at the selection."
                },
                {
                  icon: ShieldCheck,
                  title: "Exclusive Ownership",
                  desc: "If you pick Brazil, nobody else can. 100% real rivalry."
                },
                {
                  icon: Trophy,
                  title: "The Wildcard",
                  desc: "Pick a dark horse. If they go deep, you double your points."
                }
              ].map((feature, i) => (
                <div key={i} className="flex gap-8 group">
                   <div className="w-16 h-16 border-4 border-black flex-shrink-0 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <feature.icon className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-serif font-black italic uppercase leading-none mb-2">{feature.title}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed max-w-xs">{feature.desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
