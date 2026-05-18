import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export const Welcome: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsSubmitting(true);
    setErrorStatus(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorStatus('INICIO DE SESION CANCELADO. VUELVE A INTENTARLO. (LOGIN CANCELED. TRY AGAIN.)');
      } else {
        setErrorStatus('NO SE PUDO COMPLETAR EL LOGIN CON GOOGLE. INTENTALO DE NUEVO. (GOOGLE LOGIN FAILED. TRY AGAIN.)');
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
            Mundial 2026 • Edicion editorial (Editorial edition)
          </span>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-10 leading-[0.85] italic uppercase font-serif">
            La <span className="text-[#FF3E00]">nueva</span> generacion de <span className="underline decoration-[#FF3E00] decoration-8 underline-offset-8">porras</span>
          </h1>
          <p className="text-xl text-[#1A1A1A] mb-12 max-w-xl leading-tight font-medium opacity-80">
            Entra con tu cuenta de Google y la app te ubicara automaticamente en tu liga (Enter with Google and get placed in your league automatically).
          </p>

          <div className="max-w-md space-y-4">
            {errorStatus && (
              <div className="bg-black text-white p-4 border-l-4 border-[#FF3E00] text-[10px] font-black uppercase tracking-widest animate-shake">
                {errorStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleJoin}
              disabled={isSubmitting}
              className="w-full bg-black text-white py-6 text-2xl font-black uppercase tracking-tighter hover:bg-[#FF3E00] transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isSubmitting ? 'CONECTANDO (CONNECTING)...' : 'ENTRAR CON GOOGLE (ENTER WITH GOOGLE)'}
              <LogIn className="w-8 h-8" />
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">
              Una cuenta, varias ligas // Identidad segura por usuario (One account, multiple leagues)
            </p>
          </div>
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
                  title: "Draft serpiente (Snake draft)",
                  desc: "Turnos justos por orden. Tu estrategia empieza en la seleccion."
                },
                {
                  icon: ShieldCheck,
                  title: "Propiedad exclusiva (Exclusive ownership)",
                  desc: "Si eliges Brasil, nadie mas puede tomarlo. Rivalidad real al 100%."
                },
                {
                  icon: Trophy,
                  title: "El tapado (Wildcard)",
                  desc: "Elige un tapado. Si llega lejos, duplicas tus puntos."
                }
              ].map((feature, i) => (
                <div key={i} className="flex gap-8 group">
                   <div className="w-16 h-16 border-4 border-black shrink-0 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
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
