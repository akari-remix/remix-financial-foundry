// File: src/features/PrivateEquity/views/ContractorPortal.jsx

import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../../services/firebase';
import { AuthContext } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Assuming Global UI Components exist
import CustomDropdown from '../../../components/ui/CustomDropdown';
// We will build ContractorApplyForm next based on Joseph's intake questions
import ContractorApplyForm from '../components/ContractorApplyForm'; 

export default function ContractorPortal() {
  const { activeTenant, currentUser, userProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [myDeals, setMyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Status Update State
  const [activeUpdateDeal, setActiveUpdateDeal] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [contractorStatus, setContractorStatus] = useState('ON TRACK');

  // File Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingInfo, setUploadingInfo] = useState(false);

  const fetchMyDeals = async () => {
    if (!activeTenant || !currentUser?.email) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, `tenants/${activeTenant}/deals`),
        where('contractorEmail', '==', currentUser.email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      setMyDeals(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("GRID FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDeals();
  }, [activeTenant, currentUser]);

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    
    try {
      const dealRef = doc(db, `tenants/${activeTenant}/deals`, activeUpdateDeal.id);
      const currentUpdates = activeUpdateDeal.projectUpdates || [];
      const newUpdate = {
        date: new Date().toISOString(),
        message: updateText,
        statusIndicator: contractorStatus,
        author: userProfile?.fullName || currentUser.email
      };
      
      await updateDoc(dealRef, { 
        projectUpdates: [...currentUpdates, newUpdate],
        contractorStatus: contractorStatus 
      });
      
      setMyDeals(prev => prev.map(d => d.id === activeUpdateDeal.id ? { 
        ...d, projectUpdates: [...currentUpdates, newUpdate], contractorStatus: contractorStatus
      } : d));
      
      setActiveUpdateDeal(null);
      setUpdateText('');
    } catch (error) {
      console.error("Transmission failed:", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-2xl animate-pulse text-[#00AEEF] uppercase tracking-widest">[ CONNECTING TO EXECUTION GRID... ]</div>;

  return (
    <div className="p-4 md:p-8 bg-black text-white font-mono uppercase min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-[#00AEEF] pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-[4px_4px_0px_#00AEEF]">
            EXECUTION <span className="text-[#00AEEF]">HUB</span>
          </h2>
          <p className="text-gray-400 mt-2 tracking-widest text-xs font-bold">
            PARTNER ENTITY: {userProfile?.fullName} // TENANT: {activeTenant}
          </p>
        </div>
        <button
          onClick={() => setShowApplyForm(true)}
          className="bg-[#00AEEF] text-black px-6 py-4 font-black text-sm tracking-widest border-4 border-[#00AEEF] hover:bg-black hover:text-[#00AEEF] transition-all shadow-[6px_6px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          + SUBMIT CAPITAL INTAKE
        </button>
      </div>

      {/* PROJECTS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {myDeals.length === 0 ? (
          <div className="col-span-1 xl:col-span-2 p-12 border-4 border-dashed border-gray-700 text-center bg-[#111]">
            <h3 className="text-2xl font-black text-gray-500 mb-2">NO ACTIVE DEPLOYMENTS</h3>
            <p className="text-sm text-gray-600">Submit a capital intake request to initialize a new syndicate.</p>
          </div>
        ) : (
          myDeals.map(deal => (
            <div key={deal.id} className={`bg-[#111] border-4 border-white p-6 shadow-[8px_8px_0px_0px_#000000] flex flex-col justify-between ${deal.infoRequested ? 'border-[#FF0000] shadow-[8px_8px_0px_0px_#FF0000]' : ''}`}>
              
              <div>
                <div className="flex justify-between items-start mb-6 border-b-2 border-gray-800 pb-4">
                  <h4 className="font-black text-3xl tracking-tighter text-[#00AEEF]">{deal.offTaker || deal.contractor}</h4>
                  <span className="px-3 py-1 text-[10px] font-black tracking-widest border-2 border-white bg-black text-white">
                    [{deal.status}]
                  </span>
                </div>

                {/* INFO REQUEST BLOCK (PRIORITY RED) */}
                {deal.infoRequested && (
                  <div className="bg-[#FF0000] text-black p-4 mb-6 border-4 border-white shadow-[4px_4px_0px_0px_#00AEEF]">
                    <h5 className="font-black text-sm mb-1 tracking-widest">⚠️ ACTION REQUIRED BY DEAL TEAM</h5>
                    <p className="text-xs mb-3 font-bold">{deal.infoMessage}</p>
                    {/* Simplified Upload specific to Info Requests for UI */}
                    <button className="bg-black text-[#FF0000] font-black text-xs px-4 py-2 border-2 border-black hover:bg-white hover:text-black transition-colors w-full">
                      ATTACH REQUESTED DOCUMENT
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-black p-4 border-2 border-gray-800">
                  <div>
                    <p className="text-gray-500 font-bold mb-1 tracking-widest">CAPITAL SECURED</p>
                    <p className="text-xl font-black text-white">${deal.investmentRequired?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold mb-1 tracking-widest">FIELD STATUS</p>
                    <p className={`text-xl font-black ${deal.contractorStatus === 'DELAYED' || deal.contractorStatus === 'BLOCKED' ? 'text-[#FF0000] animate-pulse' : 'text-[#00AEEF]'}`}>
                      {deal.contractorStatus || 'PENDING'}
                    </p>
                  </div>
                </div>

                {/* PROJECT UPDATES FEED */}
                <div className="mb-6">
                  <p className="font-bold text-[10px] text-gray-500 tracking-widest border-b-2 border-gray-800 pb-2 mb-4">EXECUTION LOG</p>
                  <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {(!deal.projectUpdates || deal.projectUpdates.length === 0) ? (
                      <p className="text-xs text-gray-600 italic">No field updates logged yet.</p>
                    ) : (
                      deal.projectUpdates.map((update, idx) => (
                        <div key={idx} className="bg-black border-l-4 border-[#00AEEF] p-4 text-xs flex flex-col">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-[#00AEEF]">{update.author}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 border border-white ${update.statusIndicator === 'ON TRACK' ? 'bg-black text-white' : 'bg-[#FF0000] text-black border-[#FF0000]'}`}>
                              {update.statusIndicator}
                            </span>
                          </div>
                          <p className="text-gray-300">{update.message}</p>
                          <p className="text-[9px] text-gray-600 mt-2">{new Date(update.date).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {(deal.status === 'Active' || deal.status === 'In Progress' || deal.status === 'Underwriting') && (
                <button 
                  onClick={() => setActiveUpdateDeal(deal)}
                  className="w-full bg-black text-[#00AEEF] border-4 border-[#00AEEF] py-4 font-black text-sm tracking-widest hover:bg-[#00AEEF] hover:text-black transition-all mt-4"
                >
                  TRANSMIT FIELD UPDATE
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* POST UPDATE MODAL */}
      {activeUpdateDeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111] border-4 border-[#00AEEF] p-8 max-w-lg w-full relative shadow-[16px_16px_0px_0px_white]">
            <button onClick={() => setActiveUpdateDeal(null)} className="absolute top-4 right-6 text-2xl font-black text-[#00AEEF] hover:text-white">X</button>
            <h3 className="text-3xl font-black tracking-tighter text-white mb-2 border-b-4 border-gray-800 pb-2">LOG FIELD UPDATE</h3>
            <p className="text-xs text-[#00AEEF] tracking-widest mb-6 font-bold">TRANSMISSION SECURED // VISIBLE TO ADMINS</p>
            
            <form onSubmit={handlePostUpdate}>
              <div className="mb-4">
                 {/* Replaced inline dropdown with standard global dropdown for consistency */}
                <CustomDropdown 
                  options={[
                    { value: 'ON TRACK', label: 'ON TRACK [NORMAL]' },
                    { value: 'DELAYED', label: 'DELAYED [WARNING]' },
                    { value: 'BLOCKED', label: 'BLOCKED [CRITICAL]' }
                  ]}
                  value={contractorStatus}
                  onChange={setContractorStatus}
                />
              </div>
              <textarea 
                required rows="5"
                placeholder="DETAIL CURRENT STATUS, SUPPLY CHAIN DELAYS, OR MILESTONES REACHED..."
                value={updateText} onChange={(e) => setUpdateText(e.target.value)}
                className="w-full bg-black border-4 border-gray-800 p-4 text-sm text-white focus:outline-none focus:border-[#00AEEF] resize-none mb-6"
              ></textarea>
              <button type="submit" className="w-full bg-[#00AEEF] text-black border-4 border-white py-4 font-black tracking-widest hover:bg-white transition-colors shadow-[6px_6px_0px_0px_#000000]">
                EXECUTE TRANSMISSION
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contractor Apply Form Wrapper (To be built next) */}
      {showApplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto py-12">
           {/* Placeholder for the massive intake engine we will build next */}
           <ContractorApplyForm onClose={() => setShowApplyForm(false)} />
        </div>
      )}
    </div>
  );
}
