import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle, logout } from '../lib/firebase';
import { Trophy, LogOut, LogIn, User as UserIcon, Check } from 'lucide-react';

interface HeaderProps {
  activeLeagueId?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ activeLeagueId }) => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const handleUpdate = async () => {
    if (newName.trim()) {
      await updateProfile(newName.toUpperCase());
      setIsEditing(false);
    }
  };

  const handleCopyInviteLink = async () => {
    const inviteUrl = new URL(window.location.href);

    if (activeLeagueId) {
      inviteUrl.searchParams.set('league', activeLeagueId);
    } else {
      inviteUrl.searchParams.delete('league');
    }

    await navigator.clipboard.writeText(inviteUrl.toString());
    alert('Link de invitacion copiado. Compartelo con tu grupo.');
  };

  return (
    <header className="bg-[#F5F2ED] text-[#1A1A1A] border-b-2 border-[#1A1A1A] mx-4 sm:mx-8 lg:mx-12">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-baseline justify-between gap-4">
        <div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none italic uppercase font-serif">
            Mundial <span className="text-[#FF3E00]">Draft</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] font-black mt-2 uppercase opacity-60 font-sans">
            Corporate League // Season 2026
          </p>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          {user && (
            <button
              onClick={handleCopyInviteLink}
              className="hidden sm:flex border-2 border-black px-4 py-2 text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all items-center gap-2"
            >
              Copiar Link De Invitacion
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="text-xl font-serif italic border-b-2 border-black bg-transparent outline-none w-32 px-1 text-right"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                      onBlur={() => !newName.trim() && setIsEditing(false)}
                    />
                    <button 
                      onClick={handleUpdate}
                      className="bg-black text-white p-1 hover:bg-[#FF3E00] transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      setNewName(profile?.displayName || '');
                      setIsEditing(true);
                    }}
                    className="font-serif italic text-2xl tracking-tight leading-none group cursor-pointer hover:text-[#FF3E00] transition-colors"
                    title="Click to edit name"
                  >
                    {profile?.displayName?.split(' ')[0] || 'Player'} <span className="text-xs uppercase font-sans not-italic font-black border-2 border-black px-2 py-0.5 ml-1">Draft Room</span>
                  </div>
                )}
                <div className="text-[10px] font-black uppercase opacity-60 mt-1">{profile?.email || 'Anonymous access'}</div>
              </div>
              <div className="flex items-center gap-3">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-12 h-12 grayscale border-2 border-black" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-black flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="bg-black text-white p-2 hover:bg-[#FF3E00] transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="border-4 border-black px-6 py-2.5 text-xs font-black uppercase hover:bg-black hover:text-white transition-all active:scale-95 flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
