// File: src/views/BlackStarHub.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../services/firebase';

export default function BlackStarHub() {
  const { currentUser, userProfile, logout, setActiveTenant, setUserRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tenantAccess, setTenantAccess] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!currentUser?.email) return;
      try {
        const docRef = doc(db, 'user_roles', currentUser.email.toLowerCase());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTenantAccess(docSnap.data().tenantRoles || {}); 
        }
      } catch (err) {
        console.error("IDENTITY MATRIX FAULT", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [currentUser]);

  const routeToPortal = (tenantId, pathSegment, role) => {
    setActiveTenant(tenantId);
    setUserRole(role);
    navigate(`/tenant/${tenantId}/${pathSegment}`);
  };

  if (loading) return <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center font-mono font-black text-[#D4AF37] animate-pulse">VERIFYING_IDENTITY_MATRIX...</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center py-12 px-6 relative overflow-hidden font-sans">
      
      {/* Background Watermarks */}
      <div className="absolute top-[-5%] left-[-5%] text-[#FF0000] text-[20rem] font-black opacity-10 -rotate-12 pointer-events-none">*</div>
      <div className="absolute bottom-[-10%] right-[-5%] text-[#008000] text-[15rem] font-black opacity-10 rotate-12 pointer-events-none">#</div>
      <div className="absolute top-[30%] left-[40%] text-black text-[10rem] font-black opacity-5 pointer-events-none rotate-6">BSL</div>

      <div className="w-full max-w-5xl z-10 flex flex-col gap-8">
        
        {/* Header Block */}
        <div className="bg-black p-8 md:p-12 border-8 border-black shadow-[16px_16px_0px_0px_#008000] transform -rotate-1 relative">
          <button onClick={logout} className="absolute top-6 right-6 bg-[#FF0000] text-white border-4 border-white px-4 py-2 font-black text-sm uppercase tracking-widest hover:bg-white hover:text-[#FF0000] transition-colors shadow-[4px_4px_0px_0px_#D4AF37]">
            LOG OUT
          </button>
          <h1 className="text-5xl md:text-7xl font-black uppercase text-white tracking-tighter leading-none mb-2 pr-24">
            Black Star <span className="text-[#D4AF37]">Line</span>
          </h1>
          <div className="h-2 w-32 bg-[#008000] my-6"></div>
          <p className="font-mono text-[#D4AF37] font-bold tracking-widest uppercase text-sm md:text-lg">
            Global Capital Deployment Hub
          </p>
          <p className="font-mono text-gray-500 font-bold uppercase text-xs mt-4 border-t border-gray-800 pt-4">
            Authorized Identity: {userProfile?.fullName || currentUser?.email}
          </p>
        </div>

        {/* Bridge Banner */}
        <div className="w-full bg-[#00AEEF] border-8 border-black p-6 transform rotate-1 hover:-rotate-1 cursor-pointer transition-all shadow-[8px_8px_0px_0px_#000000] hover:shadow-[12px_12px_0px_0px_#000000] flex justify-between items-center group">
          <span className="font-black text-black text-xl md:text-3xl uppercase tracking-tighter group-hover:translate-x-2 transition-transform">
            ← Return to The Investor's Remix
          </span>
          <span className="hidden md:inline-block font-mono font-bold text-black text-xs uppercase bg-white px-3 py-1 border-4 border-black shadow-[4px_4px_0px_0px_#000000] group-hover:bg-black group-hover:text-[#00AEEF] transition-colors">
            Education MainStage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Panda Africa */}
          <div onClick={() => routeToPortal('panda_africa', 'statement-view', 'INVESTOR')} className="bg-white p-8 border-8 border-black shadow-[12px_12px_0px_0px_#FF0000] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_#D4AF37] transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Active Syndicate</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black leading-none mb-4 group-hover:text-[#FF0000] transition-colors">Panda Africa</h2>
              <p className="font-mono font-bold text-gray-600 text-sm">Private Equity & Government Procurement Deals.</p>
            </div>
            <div className="mt-8 border-t-4 border-black pt-4 flex justify-between items-center">
              <span className="font-black text-xl text-black">ENTER VAULT</span>
              <span className="text-3xl font-black text-[#D4AF37] group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

          {/* ACDBE Capital */}
          <div onClick={() => routeToPortal('acdbe', 'statement-view', 'INVESTOR')} className="bg-white p-8 border-8 border-black shadow-[12px_12px_0px_0px_#9333EA] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_#000000] transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Active Syndicate</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black leading-none mb-4 group-hover:text-[#9333EA] transition-colors">ACDBE Capital</h2>
              <p className="font-mono font-bold text-gray-600 text-sm">Fixed-Yield CD & Infrastructure Deployment.</p>
            </div>
            <div className="mt-8 border-t-4 border-black pt-4 flex justify-between items-center">
              <span className="font-black text-xl text-black">ENTER VAULT</span>
              <span className="text-3xl font-black text-[#9333EA] group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

          {/* Contractor Hub */}
          <div onClick={() => routeToPortal('panda_africa', 'contractor-pipeline', 'CONTRACTOR')} className="bg-white p-8 border-8 border-black shadow-[12px_12px_0px_0px_#FF5722] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_#000000] transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">External Partner</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black leading-none mb-4 group-hover:text-[#FF5722] transition-colors">Contractor Hub</h2>
              <p className="font-mono font-bold text-gray-600 text-sm">Submit capital requests and log real-time project execution updates.</p>
            </div>
            <div className="mt-8 border-t-4 border-black pt-4 flex justify-between items-center">
              <span className="font-black text-xl text-black">ENTER PORTAL</span>
              <span className="text-3xl font-black text-[#FF5722] group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

          {/* Admin / Underwriting */}
          <div onClick={() => routeToPortal('panda_africa', 'command-center', 'TENANT_ADMIN')} className="bg-white p-8 border-8 border-black shadow-[12px_12px_0px_0px_#00AEEF] transform hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_#000000] transition-all cursor-pointer group flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Deal Team Access</div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-black leading-none mb-4 group-hover:text-[#00AEEF] transition-colors">Underwriting Pipeline</h2>
              <p className="font-mono font-bold text-gray-600 text-sm">Draft, negotiate, and submit syndicates to the CEO for allocation.</p>
            </div>
            <div className="mt-8 border-t-4 border-black pt-4 flex justify-between items-center">
              <span className="font-black text-xl text-black">ENTER PIPELINE</span>
              <span className="text-3xl font-black text-[#00AEEF] group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
