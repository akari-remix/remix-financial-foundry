// File: src/features/PrivateEquity/views/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage'; 
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
//import PushDealForm from '../components/PushDealForm';
//import CEOApprovalQueue from '../components/CEOApprovalQueue';
import EditDealModal from '../components/EditDealModal';
import MultiSelectSearchDropdown from '../../../components/ui/MultiSelectSearchDropdown';

// 🔥 Global Financial Parser
const parseFinancial = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

const STATUS_CATEGORIES = {
  'DRAFTS': ['Draft', 'Underwriting', 'Pending Approval', 'Pending CEO Review'],
  'OPEN': ['open', 'Open'],
  'ACTIVE': ['Active', 'In Progress'],
  'AWAITING_CONTRACTOR': ['Awaiting Funds (Contractor)'],
  'AWAITING_INVESTOR': ['Awaiting Funds (Investor)', 'Awaiting Payment'], 
  'PAID': ['Paid', 'Matured'], 
  'REFINANCED': ['Refinanced'], 
  'LATE': ['Late']
};

const AdminDashboard = () => {
  // 🔥 FOUNDRY CONTEXT INJECTED
  const { activeTenant } = useAuth();

  const [allDeals, setAllDeals] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showPushForm, setShowPushForm] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(''); 
  const [selectedInvestors, setSelectedInvestors] = useState(['ALL']); 
  const [selectedStatuses, setSelectedStatuses] = useState(['ALL']); 
  const [portfolioView, setPortfolioView] = useState('long_term'); 

  // Modal State
  const [editingDeal, setEditingDeal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', title: '', message: '', action: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, type: 'SUCCESS', message: '' });

  const requestConfirm = (type, title, message, actionFn) => setConfirmDialog({ isOpen: true, type, title, message, action: actionFn });
  const showAlert = (type, message) => setAlertDialog({ isOpen: true, type, message });

  const toggleStatus = (statusKey) => {
    if (statusKey === 'ALL') {
      setSelectedStatuses(['ALL']);
      return;
    }
    let newSelection = [...selectedStatuses].filter(s => s !== 'ALL');
    if (newSelection.includes(statusKey)) {
      newSelection = newSelection.filter(s => s !== statusKey);
      if (newSelection.length === 0) newSelection = ['ALL'];
    } else {
      newSelection.push(statusKey);
    }
    setSelectedStatuses(newSelection);
  };

  const executeDeleteDeal = async (deal) => {
    setLoading(true);
    try {
      if (deal.fileUrl) {
        try {
          const storage = getStorage();
          await deleteObject(ref(storage, deal.fileUrl));
        } catch (fileError) {}
      }
      // 🔥 DYNAMIC ROUTE
      await deleteDoc(doc(db, `tenants/${activeTenant}/deals`, deal.id));
      setAllDeals(prev => prev.filter(d => d.id !== deal.id));
      showAlert('SUCCESS', "Contract permanently purged from system.");
    } catch (error) {
      showAlert('ERROR', "Failed to delete deal.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentIncrement = async (dealId, currentPayments) => {
    setLoading(true);
    try {
      // 🔥 DYNAMIC ROUTE
      const dealRef = doc(db, `tenants/${activeTenant}/deals`, dealId);
      const newCount = (currentPayments || 0) + 1;
      await updateDoc(dealRef, { paymentsMade: newCount });
      setAllDeals(prev => prev.map(deal => deal.id === dealId ? { ...deal, paymentsMade: newCount } : deal));
      showAlert('SUCCESS', "Dividend distribution recorded in master ledger.");
    } catch (error) {
      showAlert('ERROR', "Failed to record payment distribution.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchLedgerAndUsers = async () => { 
      if (!activeTenant) return;
      setLoading(true);
      try {
        // 🔥 DYNAMIC MULTI-TENANT QUERIES
        const q = query(collection(db, `tenants/${activeTenant}/deals`), orderBy('dueDate', 'asc'));
        const querySnapshot = await getDocs(q);
        const dealData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllDeals(dealData);

        const userSnap = await getDocs(collection(db, 'user_roles'));
        const authorizedNames = [];
        userSnap.forEach(doc => {
          const u = doc.data();
          const tRoles = u.tenantRoles || {};
          const tIds = u.tenantIds || [];
          if (tRoles[activeTenant] || tIds.includes(activeTenant)) {
            if (u.firstName && u.lastName) authorizedNames.push(`${u.firstName} ${u.lastName}`.toUpperCase());
          }
        });
        setRegisteredUsers(authorizedNames);
      } catch (error) {
        console.error("Master Ledger Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLedgerAndUsers();
  }, [activeTenant]);

  if (loading) return <div className="font-mono text-xl animate-pulse text-white p-8">LOADING_MASTER_LEDGER...</div>;

  const investorOptions = [...registeredUsers];
  const typeFilteredDeals = allDeals.filter(deal => (deal.dealType || 'short_term') === portfolioView);
  
  const filteredDeals = typeFilteredDeals.filter(deal => {
    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      searchMatch = (deal.contractor || '').toLowerCase().includes(q) || 
                    (deal.offTaker || '').toLowerCase().includes(q);
    }
    let investorMatch = true;
    if (!selectedInvestors.includes('ALL')) {
      investorMatch = deal.investors && deal.investors.some(inv => {
        const invName = String(inv.name).toUpperCase();
        return selectedInvestors.some(sel => invName.includes(sel) || sel.includes(invName));
      });
    }
    let statusMatch = true;
    if (!selectedStatuses.includes('ALL')) {
      statusMatch = selectedStatuses.some(groupKey => {
        const acceptableStatuses = STATUS_CATEGORIES[groupKey] || [];
        return acceptableStatuses.includes(deal.status);
      });
    }
    return searchMatch && investorMatch && statusMatch;
  });

  let totalCapital = 0, totalExpected = 0, totalPeriodicLiabilities = 0;
  filteredDeals.forEach(deal => {
    let myContribution = parseFinancial(deal.investmentRequired);
    let sliceFraction = 1;
    if (!selectedInvestors.includes('ALL')) {
      const matchedSlices = deal.investors?.filter(inv => {
        const invName = String(inv.name).toUpperCase();
        return selectedInvestors.some(sel => invName.includes(sel) || sel.includes(invName));
      }) || [];
      myContribution = matchedSlices.reduce((sum, slice) => sum + parseFinancial(slice.contribution), 0);
      const invReq = parseFinancial(deal.investmentRequired);
      sliceFraction = invReq > 0 ? (myContribution / invReq) : 0;
    }

    if (myContribution > 0) {
      totalCapital += myContribution;
      if (portfolioView === 'short_term') {
        const explicitProfit = parseFinancial(deal.expectedProfit) || parseFinancial(deal.projectedProfit) || parseFinancial(deal.profit);
        const derivedFromPayout = parseFinancial(deal.expectedTotalPayout || deal.expectedPayout || 0) - parseFinancial(deal.investmentRequired);
        const roiPct = parseFinancial(deal.expectedInterestRate) || parseFinancial(deal.roi) || parseFinancial(deal.percentReturn) || parseFinancial(deal.returnPercentage) || parseFinancial(deal.apy);
        const derivedFromRoi = parseFinancial(deal.investmentRequired) * (roiPct / 100);

        let expectedProfitFull = explicitProfit > 0 ? explicitProfit : Math.max(0, derivedFromPayout);
        if (expectedProfitFull === 0 && derivedFromRoi > 0) expectedProfitFull = derivedFromRoi;

        const isSettled = ['paid', 'matured', 'refinanced'].includes(String(deal.status || '').toLowerCase());
        let actualTranchesSum = 0;
        
        if (isSettled) {
          const matchedSlices = deal.investors?.filter(inv => selectedInvestors.includes('ALL') || selectedInvestors.some(sel => String(inv.name).toUpperCase().includes(sel))) || [];
          actualTranchesSum = matchedSlices.reduce((s, inv) => s + (inv.tranches || []).filter(t => t.status === 'Cleared').reduce((sum, t) => sum + parseFinancial(t.amount), 0), 0);
        }

        if (isSettled && actualTranchesSum > 0) {
           totalExpected += actualTranchesSum;
        } else {
           totalExpected += (myContribution + (expectedProfitFull * sliceFraction));
        }
      } else {
        const apy = parseFinancial(deal.apy);
        const termYears = (parseFinancial(deal.durationMonths) || 12) / 12;
        const profit = myContribution * (apy / 100) * termYears;
        totalExpected += (myContribution + profit);
        const annualInterest = myContribution * (apy / 100);
        if (deal.payoutFrequency === 'quarterly') totalPeriodicLiabilities += (annualInterest / 4);
        else if (deal.payoutFrequency === 'annually') totalPeriodicLiabilities += annualInterest;
        else totalPeriodicLiabilities += (annualInterest / 12); 
      }
    }
  });

  return (
    <div className="p-8 bg-black text-white border-8 border-[#D4AF37] relative min-h-screen m-8 animate-in fade-in duration-300">
      
      {/* 🚀 Header & Metrics Matrix */}
      <div className="flex justify-between items-start border-b-4 border-white pb-6 mb-8">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter text-[#D4AF37]">
            Master Admin Control
          </h2>
          <p className="font-mono text-gray-400 mt-2 mb-6">SYS.OP: MASTER FOUNDRY // {String(activeTenant).toUpperCase()}</p>
          <div className="flex gap-8 bg-[#111] p-4 border-2 border-gray-700">
            <div>
              <p className="text-xs font-mono font-bold text-gray-500">TOTAL CAPITAL DEPLOYED</p>
              <p className="text-2xl font-black">${totalCapital.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
            {portfolioView === 'short_term' ? (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500">TOTAL EXP. PAYOUT</p>
                <p className="text-2xl font-black text-[#D4AF37]">${totalExpected.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-mono font-bold text-gray-500">PERIODIC DIVIDEND LIABILITY</p>
                <p className="text-2xl font-black text-[#D4AF37]">${totalPeriodicLiabilities.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-mono font-bold text-gray-500">FILTERED DEALS</p>
              <p className="text-2xl font-black">{filteredDeals.length}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-right">
          <button onClick={() => setShowPushForm(true)} className="bg-[#FF0000] text-white px-8 py-4 font-black text-xl uppercase border-4 border-white shadow-[6px_6px_0px_0px_#D4AF37] hover:translate-y-1 hover:shadow-none transition-all z-10">
            + Push New Deal
          </button>
        </div>
      </div>

      <CEOApprovalQueue />

      {/* 🚀 Filter Matrix */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setPortfolioView('short_term')} className={`flex-1 py-4 font-black uppercase tracking-widest text-sm transition-all border-4 ${portfolioView === 'short_term' ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-[4px_4px_0px_0px_#000000]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}>
          Short-Term Syndicates
        </button>
        <button onClick={() => setPortfolioView('long_term')} className={`flex-1 py-4 font-black uppercase tracking-widest text-sm transition-all border-4 ${portfolioView === 'long_term' ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[4px_4px_0px_0px_#000000]' : 'bg-transparent text-gray-500 border-gray-800 hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}>
          Long-Term Yield Funds
        </button>
      </div>

      <div className="mb-6 border-b-2 border-gray-800 pb-6">
        <p className="font-mono font-bold text-gray-500 uppercase text-xs mb-3">Search Matrix</p>
        <div className="relative">
          <input 
            type="text" 
            placeholder="SEARCH CONTRACTOR OR OFF-TAKER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] text-[#D4AF37] border-4 border-gray-700 p-4 font-black uppercase text-lg focus:border-[#D4AF37] outline-none transition-colors shadow-[4px_4px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#D4AF37] placeholder-gray-600"
          />
        </div>
      </div>

      <div className="mb-6 border-b-2 border-gray-800 pb-6">
        <p className="font-mono font-bold text-gray-500 uppercase text-xs mb-3">Filter By Deal Status</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => toggleStatus('ALL')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('ALL') ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#D4AF37]' : 'bg-black text-gray-500 border-gray-700 hover:border-white'}`}>ALL</button>
          <button onClick={() => toggleStatus('DRAFTS')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('DRAFTS') ? 'bg-gray-600 text-white border-gray-600 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-gray-600'}`}>DRAFTS 📝</button>
          <button onClick={() => toggleStatus('OPEN')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('OPEN') ? 'bg-[#00AEEF] text-black border-[#00AEEF] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#00AEEF] hover:text-[#00AEEF]'}`}>OPEN 🔵</button>
          <button onClick={() => toggleStatus('ACTIVE')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('ACTIVE') ? 'bg-green-600 text-white border-green-600 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-green-600 hover:text-green-500'}`}>ACTIVE 🟢</button>
          <button onClick={() => toggleStatus('AWAITING_CONTRACTOR')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('AWAITING_CONTRACTOR') ? 'bg-yellow-400 text-black border-yellow-400 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-yellow-400 hover:text-yellow-400'}`}>AWAITING (CONTRACTOR) 🟡</button>
          <button onClick={() => toggleStatus('AWAITING_INVESTOR')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('AWAITING_INVESTOR') ? 'bg-orange-500 text-white border-orange-500 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-orange-500 hover:text-orange-500'}`}>AWAITING (INVESTOR) 🟠</button>
          <button onClick={() => toggleStatus('PAID')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('PAID') ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}>PAID/MATURED ⚫</button>
          <button onClick={() => toggleStatus('REFINANCED')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('REFINANCED') ? 'bg-[#9333EA] text-white border-[#9333EA] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#9333EA] hover:text-[#9333EA]'}`}>REFINANCED 🔄</button>
          <button onClick={() => toggleStatus('LATE')} className={`px-4 py-2 font-black uppercase text-xs transition-all border-2 ${selectedStatuses.includes('LATE') ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#FF0000] hover:text-[#FF0000]'}`}>LATE 🔴</button>
        </div>
      </div>

      <div className="mb-8 border-b-2 border-dashed border-gray-700 pb-6">
        <p className="font-mono font-bold text-gray-500 uppercase text-xs mb-3">Segment Ledger By Investor</p>
        <MultiSelectSearchDropdown options={investorOptions} selected={selectedInvestors} onChange={setSelectedInvestors} />
      </div>

      {/* 🚀 Modals */}
      {showPushForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-200">
            <PushDealForm onClose={() => setShowPushForm(false)} onDealAdded={() => { setShowPushForm(false); window.location.reload(); }} />
          </div>
        </div>
      )}

      {/* 🔥 THE EXTRACTED EDIT MODAL */}
      {editingDeal && (
        <EditDealModal 
          deal={editingDeal} 
          allDeals={allDeals} 
          investorOptions={investorOptions} 
          onClose={() => setEditingDeal(null)} 
          onSuccess={(updatedDeal) => {
            setAllDeals(prev => prev.map(d => d.id === updatedDeal.id ? { ...d, ...updatedDeal } : d));
            setEditingDeal(null);
          }} 
          showAlert={showAlert} 
        />
      )}

      {/* 🚀 Deal Grid Render */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDeals.length === 0 ? (
          <div className="p-8 font-mono text-gray-500 border-2 border-dashed border-gray-700 text-center uppercase tracking-widest">
            NO DEALS FOUND MATCHING THIS FILTER MATRIX.
          </div>
        ) : (
          filteredDeals.map((deal) => {
            if (!deal || !deal.contractor) return null; 
            const isLongTerm = (deal.dealType === 'long_term');
            
            // CLEAN CREDIT BALANCE CALCULATION FOR ADMIN VIEW
            const explicitProfit = parseFinancial(deal.expectedProfit) || parseFinancial(deal.projectedProfit) || parseFinancial(deal.profit);
            const derivedFromPayout = parseFinancial(deal.expectedTotalPayout || deal.expectedPayout || 0) - parseFinancial(deal.investmentRequired);
            const roiPct = parseFinancial(deal.expectedInterestRate) || parseFinancial(deal.roi) || parseFinancial(deal.percentReturn) || parseFinancial(deal.returnPercentage) || parseFinancial(deal.apy);
            const derivedFromRoi = parseFinancial(deal.investmentRequired) * (roiPct / 100);
            
            let actualProfit = explicitProfit > 0 ? explicitProfit : Math.max(0, derivedFromPayout);
            if (actualProfit === 0 && derivedFromRoi > 0) actualProfit = derivedFromRoi;
            
            const dealExpectedTotal = actualProfit + parseFinancial(deal.investmentRequired);
            const totalRolled = (deal.rolloverLogs || []).reduce((sum, l) => sum + l.amount, 0);
            const creditBalance = Math.max(0, dealExpectedTotal - totalRolled);
            const showCredit = deal.status === 'Refinanced' && creditBalance > 0;

            return (
              <div key={deal.id} className="bg-[#111] p-6 border-2 border-gray-700 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 text-9xl text-gray-800 font-black opacity-20 pointer-events-none">
                  {deal.status === 'open' ? '?' : '!'}
                </div>
                <button onClick={() => requestConfirm('DELETE', 'PURGE SYSTEM', `Are you sure you want to permanently delete ${deal.contractor} from the entire system?`, () => executeDeleteDeal(deal))} className="absolute top-4 right-4 bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/50 px-3 py-1 font-black text-[10px] uppercase tracking-widest hover:bg-[#FF0000] hover:text-white transition-colors z-20">
                  Delete
                </button>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-1/2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-white uppercase">{deal.contractor}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase border 
                        ${deal.status === 'Awaiting Funds (Contractor)' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50' : 
                          deal.status === 'Awaiting Funds (Investor)' || deal.status === 'Awaiting Payment' ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' : 
                          deal.status === 'Refinanced' ? 'bg-[#9333EA]/20 text-[#9333EA] border-[#9333EA]/50' : 
                          deal.status === 'Paid' || deal.status === 'Matured' ? 'bg-black text-[#D4AF37] border-[#D4AF37]' : 
                          deal.status.toLowerCase() === 'late' ? 'bg-red-600 text-white border-red-600 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.8)]' : ''
                        }`}
                      >
                         {deal.status === 'Awaiting Payment' ? 'Awaiting Funds (Investor)' : deal.status}
                      </span>
                      {deal.rolloverRequested && <span className="bg-[#00AEEF]/20 text-[#00AEEF] border border-[#00AEEF] px-2 py-0.5 text-[9px] font-black uppercase animate-pulse">Rollover Req</span>}
                    </div>

                    {isLongTerm ? (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase">GUARANTEED APY</div>
                          <div className="text-lg font-black text-[#D4AF37]">{parseFinancial(deal.apy) || 0}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase">PAYOUT FREQ.</div>
                          <div className="text-lg font-black text-white uppercase">{deal.payoutFrequency || 'Monthly'}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[#D4AF37] font-mono mt-1">OFF-TAKER: {deal.offTaker}</p>
                    )}

                    {showCredit && (
                      <div className="mt-2 text-[10px] text-[#00AEEF] font-black uppercase">
                        Credit Balance: ${creditBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    )}

                    {(deal.documents?.length > 0 || deal.fileUrl) && (
                      <div className="mt-4 border-t-2 border-gray-800 pt-4">
                        <p className="text-[10px] font-mono font-bold text-gray-500 uppercase mb-2">Legal / Document Vault</p>
                        <div className="flex flex-wrap gap-2">
                          {deal.documents?.map((doc, idx) => (
                            <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="bg-black text-[#D4AF37] border-2 border-[#D4AF37] px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
                              📄 {doc.title}
                            </a>
                          ))}
                          {deal.fileUrl && (!deal.documents || deal.documents.length === 0) && (
                            <a href={deal.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-black text-[#D4AF37] border-2 border-[#D4AF37] px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors">
                              📄 {deal.fileName || 'View Legacy Document'}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 border-t border-gray-800 pt-4">
                      <span className="text-sm text-gray-400 font-mono block mb-2">FUNDED BY: </span>
                      {deal.investors && deal.investors.length > 0 ? (
                        deal.investors.map((inv, idx) => {
                          const isTargetInvestor = selectedInvestors.includes('ALL') || selectedInvestors.some(sel => inv.name.toUpperCase().includes(sel) || sel.includes(inv.name.toUpperCase()));
                          return (
                            <span key={idx} className={`inline-block px-2 py-1 text-xs font-bold mr-2 mb-2 uppercase ${isTargetInvestor ? 'bg-[#FF0000] text-white' : 'bg-white text-black'}`}>
                              {inv.name}: ${parseFinancial(inv.contribution)?.toLocaleString(undefined, {minimumFractionDigits: 0})}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[#FF0000] font-bold text-xs uppercase animate-pulse">Awaiting Capital</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col justify-between pt-8 w-1/2 items-end">
                    <div>
                      <div className="text-3xl font-black text-white">
                        ${parseFinancial(deal.investmentRequired)?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      <div className="text-sm font-mono text-gray-400 mt-1 mb-2">
                        {isLongTerm ? 'MATURITY DATE: ' : 'DUE: '} <span className="text-white">{deal.dueDate}</span>
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        {isLongTerm && (
                          <button onClick={() => handlePaymentIncrement(deal.id, deal.paymentsMade)} className="bg-[#D4AF37] text-black font-black uppercase tracking-widest text-[10px] px-4 py-2 border-2 border-[#D4AF37] hover:bg-black hover:text-[#D4AF37] transition-colors">
                            + Record Dividend ({deal.paymentsMade || 0} Sent)
                          </button>
                        )}
                        <button onClick={() => setEditingDeal(deal)} className="bg-black text-gray-400 font-black uppercase tracking-widest text-[10px] px-4 py-2 border-2 border-gray-700 hover:text-white hover:border-white transition-colors">
                          ✏️ Edit Deal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-8 border-black p-8 md:p-12 max-w-lg w-full relative transform -rotate-1 shadow-[16px_16px_0px_0px_#FF0000]">
            <h3 className="text-4xl font-black uppercase mb-4 border-b-8 border-black pb-2 tracking-tighter text-[#FF0000]">{confirmDialog.title}</h3>
            <p className="font-mono text-xl font-bold text-gray-800 mb-10 leading-snug">{confirmDialog.message}</p>
            <div className="flex flex-col sm:flex-row gap-4 font-black">
              <button onClick={() => setConfirmDialog({ isOpen: false, type: '', title: '', message: '', action: null })} className="flex-1 bg-gray-200 text-black border-4 border-black py-4 uppercase text-lg hover:bg-black hover:text-white transition-colors">CANCEL</button>
              <button onClick={() => { confirmDialog.action(); setConfirmDialog({ isOpen: false, type: '', title: '', message: '', action: null }); }} className="flex-1 text-white border-4 border-black py-4 uppercase text-xl transition-all shadow-[6px_6px_0px_0px_#000000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none bg-[#FF0000] hover:bg-black">DO IT // PURGE</button>
            </div>
          </div>
        </div>
      )}
      
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
          <div className={`bg-white border-8 border-black p-8 max-w-md w-full relative transform rotate-1 ${alertDialog.type === 'ERROR' ? 'shadow-[16px_16px_0px_0px_#FF0000]' : 'shadow-[16px_16px_0px_0px_#D4AF37]'}`}>
            <h3 className={`text-3xl font-black uppercase mb-4 border-b-4 border-black pb-2 tracking-tighter ${alertDialog.type === 'ERROR' ? 'text-[#FF0000]' : 'text-black'}`}>{alertDialog.type === 'ERROR' ? 'FAULT DETECTED' : 'SYSTEM UPDATE'}</h3>
            <p className="font-mono text-lg font-bold text-gray-800 mb-8 leading-snug uppercase">{alertDialog.message}</p>
            <button onClick={() => setAlertDialog({ isOpen: false, type: 'SUCCESS', message: '' })} className={`w-full text-black border-4 border-black py-4 font-black uppercase text-xl transition-all shadow-[6px_6px_0px_0px_#000000] hover:translate-y-1 hover:translate-x-1 hover:shadow-none ${alertDialog.type === 'ERROR' ? 'bg-[#FF0000] text-white hover:bg-black' : 'bg-[#D4AF37] hover:bg-black hover:text-[#D4AF37]'}`}>ACKNOWLEDGE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
