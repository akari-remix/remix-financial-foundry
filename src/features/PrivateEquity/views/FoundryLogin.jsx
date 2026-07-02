// File: src/features/PrivateEquity/views/FoundryLogin.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; // Adjust path if necessary

export default function FoundryLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  // 🔥 If already logged in, teleport them to the Cross-Platform Bridge (Hub)
  useEffect(() => {
    if (currentUser) {
      navigate('/hub');
    }
  }, [currentUser, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (password !== confirmPassword) throw new Error("PASSCODES DO NOT MATCH.");
        if (password.length < 6) throw new Error("PASSCODE MUST BE AT LEAST 6 CHARACTERS.");
        await registerWithEmail(email, password);
      }
      navigate('/hub'); 
    } catch (err) {
      console.error(err);
      if (err.message.includes("PASSCODE")) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('IDENTITY EXISTS. PLEASE SWITCH TO LOGIN.');
      } else {
        setError('ACCESS DENIED. INVALID CREDENTIALS OR UNAUTHORIZED CLEARANCE.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden font-mono uppercase selection:bg-[#FF0000] selection:text-white">
      
      {/* BRUTALIST BACKGROUND ACCENTS */}
      <div className="absolute top-[-10%] left-[-5%] text-[#FF0000] text-[20rem] font-black opacity-20 -rotate-12 pointer-events-none">*</div>
      <div className="absolute bottom-[-10%] right-[-5%] text-[#00AEEF] text-[15rem] font-black opacity-20 rotate-12 pointer-events-none">#</div>
      <div className="absolute top-[20%] right-[10%] text-white text-[10rem] font-black opacity-5 pointer-events-none">RXF</div>

      <div className="w-full max-w-xl z-10 animate-in fade-in zoom-in duration-500">
        
        {/* LOGO BLOCK */}
        <div className="bg-black p-8 border-4 border-white shadow-[12px_12px_0px_0px_#FF0000] transform -rotate-1 mb-8">
          <h1 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none mb-2">
            REMIX <span className="text-[#D4AF37]">FOUNDRY</span>
          </h1>
          <div className="h-2 w-full bg-[#00AEEF] my-4"></div>
          <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-sm">
            GLOBAL CAPITAL DEPLOYMENT.
          </p>
        </div>

        {/* AUTH BLOCK */}
        <div className="bg-[#111] p-8 md:p-12 border-4 border-white shadow-[12px_12px_0px_0px_#00AEEF] transform rotate-1">
          <h2 className="text-3xl font-black uppercase border-b-4 border-gray-800 pb-2 mb-8 text-white">
            INSTITUTIONAL DEAL DESK
          </h2>

          {error && (
            <div className="bg-[#FF0000] text-black font-black p-4 mb-6 border-4 border-white uppercase text-sm transform -rotate-1 shadow-[4px_4px_0px_0px_white]">
              [FAULT]: {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block font-black text-gray-500 uppercase tracking-widest mb-2 text-xs">IDENTITY (EMAIL)</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-black border-4 border-gray-800 p-4 font-black text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-[4px_4px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#D4AF37] placeholder-gray-700" 
                placeholder="INVESTOR@EXAMPLE.COM" 
              />
            </div>
            
            <div>
              <label className="block font-black text-gray-500 uppercase tracking-widest mb-2 text-xs">PASSCODE</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-black border-4 border-gray-800 p-4 font-black text-white focus:outline-none focus:border-[#00AEEF] transition-colors shadow-[4px_4px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#00AEEF] placeholder-gray-700" 
                placeholder="••••••••" 
              />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block font-black text-gray-500 uppercase tracking-widest mb-2 text-xs">VERIFY PASSCODE</label>
                <input 
                  type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full bg-black border-4 border-gray-800 p-4 font-black text-white focus:outline-none focus:border-[#FF0000] transition-colors shadow-[4px_4px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#FF0000] placeholder-gray-700" 
                  placeholder="••••••••" 
                />
              </div>
            )}

            <button 
              type="submit" disabled={loading} 
              className="w-full bg-black text-[#D4AF37] font-black text-2xl uppercase py-5 border-4 border-white hover:bg-[#D4AF37] hover:text-black transition-all shadow-[8px_8px_0px_0px_white] hover:translate-y-1 hover:translate-x-1 hover:shadow-none mt-4 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? 'PROCESSING...' : isLogin ? 'ENTER THE VAULT' : 'REQUEST ACCESS'}
            </button>
          </form>

          {/* TOGGLE BLOCK */}
          <div className="mt-10 pt-10 border-t-4 border-gray-800 text-center relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#111] px-4 font-black text-xl text-gray-500">
              OR
            </div>
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
              className="w-full bg-transparent text-white font-black text-lg md:text-xl uppercase py-6 border-4 border-gray-800 hover:border-white hover:bg-white hover:text-black transition-all shadow-[6px_6px_0px_0px_#000000] active:translate-y-1 active:translate-x-1 active:shadow-none flex flex-col items-center justify-center gap-1"
            >
              <span className="text-[10px] md:text-xs font-black text-[#00AEEF] mb-1 tracking-widest">
                {isLogin ? "NO CLEARANCE YET?" : "ALREADY AUTHORIZED?"}
              </span>
              <span>
                {isLogin ? "REGISTER IDENTITY" : "RETURN TO LOGIN"}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
