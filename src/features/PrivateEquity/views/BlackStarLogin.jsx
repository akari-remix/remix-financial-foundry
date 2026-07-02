// File: src/features/PrivateEquity/views/BlackStarLogin.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function BlackStarLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/hub');
  }, [currentUser, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (password !== confirmPassword) throw new Error("Passcodes do not match.");
        if (password.length < 6) throw new Error("Passcode must be at least 6 characters.");
        await registerWithEmail(email, password);
      }
      navigate('/hub'); 
    } catch (err) {
      console.error(err);
      if (err.message.includes("Passcode")) setError(err.message);
      else if (err.code === 'auth/email-already-in-use') setError('IDENTITY EXISTS. Please switch to login.');
      else setError('ACCESS DENIED. Invalid credentials or unauthorized clearance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Pan-African Watermarks */}
      <div className="absolute top-[-10%] left-[-5%] text-[#FF0000] text-[20rem] font-black opacity-10 -rotate-12 pointer-events-none">*</div>
      <div className="absolute bottom-[-10%] right-[-5%] text-[#008000] text-[15rem] font-black opacity-10 rotate-12 pointer-events-none">#</div>
      <div className="absolute top-[20%] right-[10%] text-black text-[10rem] font-black opacity-5 pointer-events-none">BSL</div>

      <div className="w-full max-w-xl z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header Block with Green Shadow */}
        <div className="bg-black p-8 border-8 border-black shadow-[16px_16px_0px_0px_#008000] transform -rotate-1 mb-8">
          <h1 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none mb-2">
            Black Star <span className="text-[#D4AF37]">Line</span> Remix
          </h1>
          <div className="h-2 w-full bg-[#008000] my-4"></div>
          <p className="font-mono text-[#D4AF37] font-bold tracking-widest uppercase text-sm">
            Global Capital Deployment.
          </p>
        </div>

        {/* Auth Block with Red Shadow */}
        <div className="bg-white p-8 md:p-12 border-8 border-black shadow-[16px_16px_0px_0px_#FF0000] transform rotate-1">
          <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 mb-8 text-black">
            Institutional Deal Desk
          </h2>

          {error && (
            <div className="bg-[#FF0000] text-white font-mono font-bold p-4 mb-6 border-4 border-black uppercase text-sm transform -rotate-1 shadow-[4px_4px_0px_0px_#000000]">
              ! {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block font-mono font-bold text-gray-500 uppercase mb-2">Identity (Email)</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-100 border-4 border-black p-4 font-mono font-bold text-black focus:outline-none focus:shadow-[6px_6px_0px_0px_#D4AF37] transition-shadow" placeholder="investor@example.com" />
            </div>
            <div>
              <label className="block font-mono font-bold text-gray-500 uppercase mb-2">Passcode</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-100 border-4 border-black p-4 font-mono font-bold text-black focus:outline-none focus:shadow-[6px_6px_0px_0px_#D4AF37] transition-shadow" placeholder="••••••••" />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block font-mono font-bold text-gray-500 uppercase mb-2">Verify Passcode</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-100 border-4 border-black p-4 font-mono font-bold text-black focus:outline-none focus:shadow-[6px_6px_0px_0px_#D4AF37] transition-shadow" placeholder="••••••••" />
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-black text-[#D4AF37] font-black text-2xl uppercase py-5 border-4 border-black hover:bg-[#D4AF37] hover:text-white transition-all shadow-[8px_8px_0px_0px_#000000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none mt-4 disabled:opacity-50">
              {loading ? 'PROCESSING...' : isLogin ? 'ENTER THE VAULT' : 'REQUEST ACCESS'}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t-8 border-black text-center relative">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-white px-4 font-black text-2xl text-black">OR</div>
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
              className="w-full bg-white text-black font-black text-lg md:text-xl uppercase py-6 border-4 border-black hover:bg-black hover:text-white transition-all shadow-[8px_8px_0px_0px_#008000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none flex flex-col items-center justify-center gap-1"
            >
              <span className="text-[10px] md:text-xs font-mono font-bold text-gray-500 mb-1">
                {isLogin ? "NO CLEARANCE YET?" : "ALREADY AUTHORIZED?"}
              </span>
              <span>{isLogin ? "REGISTER IDENTITY" : "RETURN TO LOGIN"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
