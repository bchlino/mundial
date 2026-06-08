import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { useLanguage } from '../lib/LanguageContext';

export const Welcome: React.FC = () => {
  const { tr } = useLanguage();
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
        setErrorStatus(tr('INICIO DE SESION CANCELADO. VUELVE A INTENTARLO.', 'LOGIN CANCELED. TRY AGAIN.'));
      } else {
        setErrorStatus(tr('NO SE PUDO COMPLETAR EL LOGIN CON GOOGLE. INTENTALO DE NUEVO.', 'GOOGLE LOGIN FAILED. TRY AGAIN.'));
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
            Mundial 2026
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6 sm:mb-10 leading-[0.9] sm:leading-[0.85] italic uppercase font-serif">
            {tr('La nueva generación de porras', 'The new generation of sports pools')}
          </h1>
          <p className="text-base sm:text-xl text-[#1A1A1A] mb-8 sm:mb-12 max-w-xl leading-tight font-medium opacity-80">
            {tr('Entra con tu cuenta de Google y la app te ubicará automáticamente en tu liga.', 'Sign in with Google and the app will place you in your league automatically.')}
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
              className="w-full bg-black text-white p-4 sm:py-6 text-base sm:text-2xl font-black uppercase tracking-tight sm:tracking-tighter hover:bg-[#FF3E00] transition-all disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-4 group"
            >
              {isSubmitting ? tr('CONECTANDO...', 'CONNECTING...') : tr('ENTRAR CON GOOGLE', 'ENTER WITH GOOGLE')}
              <LogIn className="w-5 h-5 sm:w-8 sm:h-8" />
              {/* <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" /> */}
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">
              {tr('Una cuenta, varias ligas // Identidad segura por usuario', 'One account, multiple leagues // Secure user identity')}
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
                  title: tr('Draft serpiente', 'Snake draft'),
                  desc: tr('Turnos justos por orden. Tu estrategia empieza en la seleccion.', 'Fair turns by order. Your strategy starts in the pick phase.')
                },
                {
                  icon: ShieldCheck,
                  title: tr('Propiedad exclusiva', 'Exclusive ownership'),
                  desc: tr('Si eliges Brasil, nadie mas puede tomarlo. Rivalidad real al 100%.', 'If you pick Brazil, nobody else can take it. Real rivalry, 100%.')
                },
                {
                  icon: Trophy,
                  title: tr('El tapado', 'Wildcard'),
                  desc: tr('Elige un tapado. Si llega lejos, duplicas tus puntos.', 'Pick a wildcard. If it goes far, your points are doubled.')
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
          {tr('Cómo funciona', 'How it works')}
        </h2>
        <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-8">
          {tr('Guía rápida para dummies', 'Quick guide')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 1</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">{tr('Login con Google', 'Google login')}</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              {tr('Debes entrar con tu cuenta de Google. Así cada jugador tiene identidad única y segura.', 'Sign in with your Google account. This gives each player a unique and secure identity.')}
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 2</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">{tr('Liga privada', 'Private league')}</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              {tr('Creas o te unes por enlace de invitación. Solo participantes de tu liga ven la clasificación.', 'Create or join via invite link. Only league participants can see the leaderboard.')}
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 3</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">{tr('Elige 4 equipos', 'Choose 4 teams')}</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              {tr('Tomas 1 equipo por bombo: A, B, C y D. Los bombos separan niveles y siguen orden de ranking FIFA.', 'Pick 1 team from each pot: A, B, C and D. Pots separate levels and follow FIFA ranking order.')}
            </p>
          </article>

          <article className="border-2 border-black p-5 bg-[#F5F2ED]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Paso 4</p>
            <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-2">{tr('Tapado opcional', 'Optional wildcard')}</h3>
            <p className="text-xs font-black uppercase tracking-wider opacity-70">
              {tr('Puedes marcar 1 de tus 4 equipos como tapado. Si gana en eliminatorias, suma doble; si queda fuera, penaliza -5.', 'You can mark 1 of your 4 teams as wildcard. If it wins in knockouts, points are doubled; if it is eliminated, it gets -5 penalty.')}
            </p>
          </article>
        </div>

        <div className="mt-8 border-2 border-black p-5">
          <h3 className="text-xl sm:text-2xl font-serif italic font-black uppercase mb-4">{tr('Puntuación', 'Scoring')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">{tr('Grupos', 'Groups')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Victoria: +3', 'Win: +3')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Empate: +1', 'Draw: +1')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Derrota: +0', 'Loss: +0')}</p>
            </div>
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">{tr('Eliminatorias', 'Knockout')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('16avos: +4', 'Round of 32: +4')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Octavos: +6', 'Round of 16: +6')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Cuartos: +8', 'Quarterfinals: +8')}</p>
            </div>
            <div className="p-4 border border-black">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">{tr('Finales', 'Final rounds')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Semifinal: +10', 'Semifinal: +10')}</p>
              <p className="text-xs font-black uppercase tracking-wider">{tr('Final: +12', 'Final: +12')}</p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
