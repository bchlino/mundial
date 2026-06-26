import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export const Header: React.FC = () => {
  const { user, profile } = useAuth();
  const { language, setLanguage, tr } = useLanguage();

  return (
    <header className="bg-[#F5F2ED] text-[#1A1A1A] border-b-2 border-[#1A1A1A] mx-2 sm:mx-8 lg:mx-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tighter leading-none italic uppercase font-serif wrap-break-word">
            {tr('Porra', 'Pool')} <span className="text-[#FF3E00]">{tr('Mundial', 'World Cup')}</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] font-black mt-2 uppercase opacity-60 font-sans">
            {tr('Liga Privada', 'Private League')}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 self-end sm:self-auto w-full sm:w-auto justify-end">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
            className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest"
            aria-label={tr('Selector de idioma', 'Language selector')}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
          {user ? (
            <div className="flex items-center gap-3 sm:gap-6 max-w-full">
              <div className="text-right hidden sm:block">
                <div className="font-serif italic text-2xl tracking-tight leading-none truncate max-w-70">
                  {profile?.displayName?.split(' ')[0] || tr('Jugador', 'Player')}
                </div>
                <div className="text-[10px] font-black uppercase opacity-60 mt-1">{profile?.email || tr('Acceso con Google', 'Google access')}</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-10 h-10 sm:w-12 sm:h-12 grayscale border-2 border-black" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black flex items-center justify-center">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="bg-black text-white p-2 hover:bg-[#FF3E00] transition-colors"
                  title={tr('Cerrar sesion', 'Sign out')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="border-4 border-black px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-black uppercase hover:bg-black hover:text-white transition-all active:scale-95 flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>{tr('Entrar', 'Sign in')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
