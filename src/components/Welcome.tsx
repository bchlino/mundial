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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-left"
        >
          <span className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest mb-8">
            Mundial 2026 • Edicion editorial (Editorial edition)
          </span>
          <h1 className="text-4xl sm:text-8xl font-black tracking-tighter mb-6 sm:mb-10 leading-[0.9] sm:leading-[0.85] italic uppercase font-serif">
            La <span className="text-[#FF3E00]">nueva</span> generacion de <span className="underline decoration-[#FF3E00] decoration-8 underline-offset-8">porras</span>
          </h1>
          <p className="text-base sm:text-xl text-[#1A1A1A] mb-8 sm:mb-12 max-w-xl leading-tight font-medium opacity-80">
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
              className="w-full bg-black text-white py-4 sm:py-6 text-base sm:text-2xl font-black uppercase tracking-tight sm:tracking-tighter hover:bg-[#FF3E00] transition-all disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-4 group"
            >
              {isSubmitting ? 'CONECTANDO (CONNECTING)...' : 'ENTRAR CON GOOGLE (ENTER WITH GOOGLE)'}
              <LogIn className="w-5 h-5 sm:w-8 sm:h-8" />
              <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" />
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

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-12 sm:mt-16 border-4 border-black bg-white p-4 sm:p-6 md:p-10"
      >
        <h2 className="text-3xl md:text-5xl font-serif italic font-black uppercase leading-none mb-4 sm:mb-6">
          Como funciona (How it works)
        </h2>
        <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-8">
          Guia rapida para dummies (Quick guide for dummies)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 1</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">Login con Google</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              Debes entrar con tu cuenta de Google. Asi cada jugador tiene identidad unica y segura.
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 2</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">Liga privada</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              Creas o te unes por enlace de invitacion. Solo participantes de tu liga ven la clasificacion.
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 3</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">Elige 4 equipos</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              Tomas 1 equipo por bombo: A, B, C y D. Los bombos separan niveles y siguen orden de ranking FIFA.
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 4</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">Tapado opcional</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              Puedes marcar 1 de tus 4 equipos como tapado. Si gana en eliminatorias, suma doble; si queda fuera, penaliza -5.
            </p>
          </article>
        </div>

        <div className="mt-8 border-2 border-black p-5">
          <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-4">Puntuacion (Scoring)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Grupos</p>
              <p className="text-xs font-black uppercase tracking-wider">Victoria: +3</p>
              <p className="text-xs font-black uppercase tracking-wider">Empate: +1</p>
              <p className="text-xs font-black uppercase tracking-wider">Derrota: +0</p>
            </div>
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Eliminatorias</p>
              <p className="text-xs font-black uppercase tracking-wider">Octavos: +4</p>
              <p className="text-xs font-black uppercase tracking-wider">Cuartos: +6</p>
            </div>
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Finales</p>
              <p className="text-xs font-black uppercase tracking-wider">Semifinal: +8</p>
              <p className="text-xs font-black uppercase tracking-wider">Final: +10</p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
