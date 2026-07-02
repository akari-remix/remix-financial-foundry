// File: src/views/FoundryHub.jsx

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from '../services/firebase';

export default function FoundryHub() {
  const { currentUser, userProfile, logout, setActiveTenant, setUserRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tenantAccess, setTenantAccess] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!currentUser?.email) return;
      try {
        // Fetch the user's master clearance profile
        const docRef = doc(db, 'user_roles', currentUser.email.toLowerCase());
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          // Expected structure: { tenantRoles: { 'panda_africa': 'INVESTOR', 'other_client': 'CONTRACTOR' } }
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

  const handleTenantUplink = (tenantId, role) => {
    setActiveTenant(tenantId);
    setUserRole(role);
    
    // Multi-Tenant RBAC Routing
    switch(String(role).toUpperCase()) {
      case 'MASTER_ADMIN':
      case 'TENANT_ADMIN':
        navigate(`/tenant/${tenantId}/command-center`);
        break;
      case 'INVESTOR':
        navigate(`/tenant/${tenantId}/statement-view`);
        break;
      case 'CONTRACTOR':
        navigate(`/tenant/${tenantId}/contractor-pipeline`);
        break;
      default:
        console.warn('UNRECOGNIZED CLEARANCE LEVEL.');
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono font-black text-[#D4AF37] uppercase tracking-widest animate-pulse">[ VERIFYING IDENTITY MATRIX... ]</div>;

  const availableTenants = Object.keys(tenantAccess);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-12 px-6 relative overflow-hidden font-mono uppercase selection:bg-[#00AEEF] selection:text-black text-white">
      
      {/* Brutalist Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] text-[#FF0000] text-[20rem] font-black opacity-10 -rotate-12 pointer-events-none">*</div>
      <div className="absolute bottom-[-10%] right-[-5%] text-[#00AEEF] text-[15rem] font-black opacity-10 rotate-12 pointer-events-none">#</div>
      
      <div className="w-full max-w-5xl z-10 flex flex-col gap-8">
        
        {/* HEADER BLOCK */}
        <div className="bg-black p-8 md:p-12 border-4 border-white shadow-[12px_12px_0px_0px_#D4AF37] relative">
          <button onClick={logout} className="absolute top-6 right-6 bg-[#FF0000] text-black border-2 border-[#FF0000] px-4 py-2 font-black text-xs tracking-widest hover:bg-black hover:text-[#FF0000] transition-colors">
            SEVER UPLINK
          </button>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-2 text-white">
            REMIX <span className="text-[#D4AF37]">FOUNDRY</span>
          </h1>
          <div className="h-2 w-32 bg-[#00AEEF] my-6"></div>
          <p className="text-[#00AEEF] font-bold tracking-widest text-sm md:text-lg drop-shadow-[2px_2px_0px_#000000]">
            GLOBAL CAPITAL DEPLOYMENT HUB
          </p>
          <p className="text-gray-500 font-bold text-xs mt-4 border-t-2 border-gray-800 pt-4">
            AUTHORIZED IDENTITY: {userProfile?.fullName || currentUser?.email}
          </p>
        </div>

        {availableTenants.length === 0 ? (
          <div className="bg-black p-8 border-4 border-[#FF0000] shadow-[12px_12px_0px_0px_#FF0000] text-center">
            <h2 className="text-3xl font-black text-[#FF0000] mb-4">CLEARANCE PENDING</h2>
            <p className="font-bold text-white">Your identity is secured, but no syndicate allocations or tenant nodes have been assigned to your profile yet. Contact the Master Sys.Op.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {availableTenants.map((tenantId) => {
              const role = tenantAccess[tenantId];
              // Dynamic coloring based on role to maintain aesthetics
              const accentColor = role.includes('ADMIN') ? '#FF0000' : role.includes('INVESTOR') ? '#D4AF37' : '#00AEEF';
              
              return (
                <div 
                  key={tenantId}
                  onClick={() => handleTenantUplink(tenantId, role)} 
                  className="bg-[#111] p-8 border-4 border-white transform hover:-translate-y-2 transition-all cursor-pointer group flex flex-col justify-between min-h-[250px]"
                  style={{ boxShadow: `8px 8px 0px 0px ${accentColor}` }}
                >
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 mb-2 tracking-widest">
                      ACTIVE TENANT NODE // {role}
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white leading-none mb-4 group-hover:text-white transition-colors" style={{ textShadow: `2px 2px 0px ${accentColor}` }}>
                      {tenantId.replace('_', ' ')}
                    </h2>
                  </div>
                  <div className="mt-8 border-t-4 border-gray-800 pt-4 flex justify-between items-center">
                    <span className="font-black text-xl text-white">INITIALIZE</span>
                    <span className="text-3xl font-black transition-transform group-hover:translate-x-2" style={{ color: accentColor }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
