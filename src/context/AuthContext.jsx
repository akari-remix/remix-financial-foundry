// File: src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword // 🔥 Added for FoundryLogin registration
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; 
import { Loader2 } from 'lucide-react';

// 🔥 EXPORT ADDED: Required for the UI components to hook into the matrix
export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [activeTenant, setActiveTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 CORE ENGINE: Builds the user profile and RBAC matrix
  const handleUserSession = async (user) => {
    try {
      const roleRef = doc(db, 'user_roles', user.uid);
      const roleSnap = await getDoc(roleRef);
      
      let roleData = {
        email: user.email,
        isGlobalAdmin: false,
        tenantRoles: {},
        fullName: user.displayName || 'Investor'
      };

      if (roleSnap.exists()) {
        roleData = { ...roleData, ...roleSnap.data() };
      } else {
        // If new user, create a blank investor profile
        await setDoc(roleRef, roleData);
      }
      
      setUserRole(roleData);

      // 🏢 TENANT ROUTING: Determine their default silo
      if (roleData.isGlobalAdmin) {
        setActiveTenant(roleData.lastActiveTenant || 'panda_africa'); 
      } else {
        const assignedTenants = Object.keys(roleData.tenantRoles || {});
        setActiveTenant(assignedTenants[0] || null); 
      }
    } catch (error) {
      console.error("RBAC Integrity Error:", error);
    }
  };

  const switchTenant = async (newTenantId) => {
    if (userRole?.isGlobalAdmin) {
      setActiveTenant(newTenantId);
      if (currentUser) {
        await setDoc(doc(db, 'user_roles', currentUser.uid), { lastActiveTenant: newTenantId }, { merge: true });
      }
    } else {
      console.warn("SECURITY BLOCK: Unauthorized tenant switch attempt.");
    }
  };

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await handleUserSession(result.user);
  };

  // 🔥 ADDED: Registration logic for the Foundry Front Door
  const registerWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await handleUserSession(result.user);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await handleUserSession(result.user);
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await handleUserSession(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setActiveTenant(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile: userRole, // 🔥 ALIAS ADDED: Bridges your logic with the new UI components seamlessly
    activeTenant,
    setActiveTenant, // 🔥 ADDED: Allows FoundryHub to route tenants
    setUserRole,     // 🔥 ADDED: Allows FoundryHub to set roles dynamically
    switchTenant,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center font-black uppercase tracking-widest text-[#D4AF37]">
          <Loader2 size={64} className="mb-6 animate-spin text-[#D4AF37]" />
          <p className="animate-pulse">DECRYPTING MATRIX...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
