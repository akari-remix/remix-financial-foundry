// File: src/features/PrivateEquity/components/EditDealModal.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import CustomDateInput from '../../../components/ui/CustomDateInput';
import CustomDropdown from '../../../components/ui/CustomDropdown';

// 🔥 Global Financial Parser
const parseFinancial = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

// --- Local Sub-Components (Specific to Edit Modal) ---

const TrancheDateInput = ({ value, onChange }) => {
  const parts = (value || '').split('-');
  const month = parts[0] || ''; const day = parts[1] || ''; const year = parts[2] || '';
  const handleUpdate = (type, val) => {
    const num = val.replace(/\D/g, '');
    let newM = month; let newD = day; let newY = year;
    if (type === 'M') newM = num.substring(0, 2);
    if (type === 'D') newD = num.substring(0, 2);
    if (type === 'Y') newY = num.substring(0, 4);
    onChange(`${newM}-${newD}-${newY}`);
  };

  return (
    <div className="flex gap-1 items-center h-[34px]">
      <input type="text" placeholder="MM" value={month} onChange={(e) => handleUpdate('M', e.target.value)} className="w-8 h-full bg-black text-white border border-gray-700 p-1 text-center text-[10px] font-bold outline-none focus:border-[#FF5722]" />
      <span className="text-[#FF5722] font-black text-xs">/</span>
      <input type="text" placeholder="DD" value={day} onChange={(e) => handleUpdate('D', e.target.value)} className="w-8 h-full bg-black text-white border border-gray-700 p-1 text-center text-[10px] font-bold outline-none focus:border-[#FF5722]" />
      <span className="text-[#FF5722] font-black text-xs">/</span>
      <input type="text" placeholder="YYYY" value={year} onChange={(e) => handleUpdate('Y', e.target.value)} className="w-12 h-full bg-black text-white border border-gray-700 p-1 text-center text-[10px] font-bold outline-none focus:border-[#FF5722]" />
    </div>
  );
};

const DealSearchDropdown = ({ options, value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const displayLabel = options.find(o => o.value === value)?.label || 'SEARCH TARGET DEAL...';
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative font-mono z-[80] w-full h-[34px] md:h-auto">
      <div onClick={() => setIsOpen(!isOpen)} className={`w-full bg-black text-white border-2 border-gray-700 p-2 font-bold text-xs uppercase cursor-pointer flex justify-between items-center transition-all h-full shadow-[2px_2px_0px_0px_#000000] hover:border-[#9333EA] ${isOpen ? 'border-[#9333EA] text-[#9333EA]' : ''}`}>
        <span className="truncate pr-4">{isOpen ? 'TYPE TO SEARCH...' : displayLabel}</span>
        <span>▼</span>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-[150%] mt-1 bg-black border-4 border-[#9333EA] shadow-[8px_8px_0px_0px_#000000] max-h-60 overflow-y-auto top-full -left-2">
            <div className="p-2 border-b-4 border-[#9333EA] sticky top-0 bg-black z-10">
               <input autoFocus type="text" placeholder="Search Deals..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-[#111] text-white p-2 outline-none border-2 border-gray-700 focus:border-[#9333EA] font-black uppercase text-xs" />
            </div>
            {filteredOptions.length === 0 ? <div className="p-4 text-gray-500 text-xs font-bold uppercase">No deals match.</div> : 
             filteredOptions.map(opt => (
               <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }} className="p-3 font-black text-[10px] md:text-xs text-white hover:bg-[#9333EA] hover:text-white cursor-pointer border-b-2 border-zinc-800 uppercase">{opt.label}</div>
             ))
            }
          </div>
        </>
      )}
    </div>
  );
};

// --- Main Edit Modal Component ---

const EditDealModal = ({ deal, allDeals, investorOptions, onClose, onSuccess, showAlert }) => {
  const { activeTenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editFile, setEditFile] = useState(null); 
  
  // Standardize Initialization Date
  let safeDate = deal.startDate || deal.dueDate;
  if (!safeDate) {
    safeDate = new Date().toISOString().split('T')[0];
  } else if (safeDate.includes('/')) {
    const p = safeDate.split('/');
    if (p.length === 3) safeDate = `${p[2]}-${p[0]}-${p[1]}`;
  }

  const [editForm, setEditForm] = useState({
    status: deal.status || 'open', 
    notes: deal.notes || '',
    investorNotes: deal.investorNotes || '',
    refinancedTo: deal.refinancedTo || '',
    startDate: safeDate,
    durationMonths: deal.durationMonths || 12,
    termYears: deal.termYears || (deal.durationMonths ? deal.durationMonths / 12 : 5),
    paymentsMade: deal.paymentsMade || 0,
    apy: deal.apy || 0,
    payoutFrequency: deal.payoutFrequency || 'monthly',
    investors: deal.investors || [],
    rolloverLogs: deal.rolloverLogs || [], 
    rolloverRequested: deal.rolloverRequested || false
  });

  const [newAllocInvestor, setNewAllocInvestor] = useState('');
  const [newAllocAmount, setNewAllocAmount] = useState('');
  const [trancheInputs, setTrancheInputs] = useState({});

  const [refiInvestor, setRefiInvestor] = useState('');
  const [refiTargetDeal, setRefiTargetDeal] = useState('');
  const [refiAmount, setRefiAmount] = useState('');

  const handleAddTranche = (invIdx) => {
    const inputs = trancheInputs[invIdx] || {};
    const dateVal = inputs.date || '';
    const parts = dateVal.split('-');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2] || !inputs.amount || !inputs.status) {
      showAlert('ERROR', 'Incomplete Tranche. Ensure Month, Day, Year, Amount, and Status are provided.');
      return;
    }
    const formattedTrancheDate = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2].padStart(4, '202')}`;

    const updatedInvestors = [...editForm.investors];
    if (!updatedInvestors[invIdx].tranches) updatedInvestors[invIdx].tranches = [];
    updatedInvestors[invIdx].tranches.push({ date: formattedTrancheDate, amount: parseFinancial(inputs.amount), status: inputs.status });
    
    setEditForm({ ...editForm, investors: updatedInvestors });
    setTrancheInputs({ ...trancheInputs, [invIdx]: { date: '', amount: '', status: 'Pending' } });
  };

  const handleRemoveTranche = (invIdx, trancheIdx) => {
    const updatedInvestors = [...editForm.investors];
    updatedInvestors[invIdx].tranches.splice(trancheIdx, 1);
    setEditForm({ ...editForm, investors: updatedInvestors });
  };

  const executeRefinanceTransfer = async () => {
    if (!refiInvestor || !refiTargetDeal || !refiAmount) {
      return showAlert('ERROR', 'Transmission Error. Select Investor, Target Deal, and specify Transfer Amount.');
    }
    setLoading(true);
    try {
      const targetDeal = allDeals.find(d => d.id === refiTargetDeal);
      if (!targetDeal) throw new Error("Target deal not located in DB");

      const amountNum = parseFinancial(refiAmount);
      const targetRef = doc(db, `tenants/${activeTenant}/deals`, targetDeal.id);
      
      const currentTargetInvestors = targetDeal.investors || [];
      const updatedTargetInvestors = [...currentTargetInvestors, {
         name: refiInvestor,
         contribution: amountNum,
         tranches: [{ date: new Date().toISOString().split('T')[0], amount: amountNum, status: 'Cleared' }]
      }];
      
      const reqCapital = parseFinancial(targetDeal.investmentRequired);
      const totalInvested = updatedTargetInvestors.reduce((sum, inv) => sum + parseFinancial(inv.contribution), 0);
      let targetRemaining = reqCapital - totalInvested;
      if (targetRemaining < 0) targetRemaining = 0;
      
      let targetStatus = targetDeal.status;
      if (targetRemaining === 0 && (targetStatus === 'open' || targetStatus === 'Open')) {
         targetStatus = 'Awaiting Funds (Investor)';
      }

      await updateDoc(targetRef, { investors: updatedTargetInvestors, capitalRemaining: targetRemaining, status: targetStatus });

      const rolloverNote = `\n[${new Date().toISOString().split('T')[0]}] REFINANCE EXECUTED: Rolled over $${amountNum.toLocaleString()} for ${refiInvestor} into -> ${targetDeal.contractor}.`;
      const newLog = { investor: refiInvestor, amount: amountNum, target: targetDeal.contractor, date: new Date().toISOString() };
      
      setEditForm(prev => {
        const newRefinancedTo = prev.refinancedTo 
          ? (prev.refinancedTo.includes(targetDeal.contractor) ? prev.refinancedTo : prev.refinancedTo + ', ' + targetDeal.contractor) 
          : targetDeal.contractor;
        return { 
          ...prev, 
          status: 'Refinanced', 
          refinancedTo: newRefinancedTo,
          notes: prev.notes + rolloverNote,
          rolloverLogs: [...(prev.rolloverLogs || []), newLog]
        };
      });

      showAlert('SUCCESS', `Rollover Executed. $${amountNum.toLocaleString()} transferred to ${targetDeal.contractor}.`);
      setRefiInvestor(''); setRefiTargetDeal(''); setRefiAmount('');
    } catch (err) {
      console.error(err);
      showAlert('ERROR', 'Rollover execution failed. Verify target data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dateParts = (editForm.startDate || '').split('-');
      if (dateParts.length !== 3) {
        setLoading(false);
        return showAlert('ERROR', 'Invalid Date Format. Ensure Year, Month, and Day are filled.');
      }
      const formattedStartDate = `${dateParts[0].padStart(4, '202')}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;

      let nextStatus = editForm.status || (editForm.investors.length === 0 ? 'open' : 'Awaiting Funds (Investor)');
      const reqCapital = parseFinancial(deal.investmentRequired);
      const totalInvested = editForm.investors.reduce((sum, inv) => sum + parseFinancial(inv.contribution), 0);
      let calculatedRemaining = Math.max(0, reqCapital - totalInvested);

      const isRefinancing = nextStatus === 'Refinanced';

      const cleanInvestors = (editForm.investors || []).map(inv => ({
        name: inv.name || 'Unknown',
        uid: inv.uid || null,
        contribution: parseFinancial(inv.contribution),
        tranches: (inv.tranches || []).map(t => ({
          date: String(t.date || ''),
          amount: parseFinancial(t.amount),
          status: String(t.status || 'Pending')
        }))
      }));

      const dealRef = doc(db, `tenants/${activeTenant}/deals`, deal.id);
      
      let updatedData = { 
        status: nextStatus, 
        notes: String(editForm.notes || ""), 
        investorNotes: String(editForm.investorNotes || ""),
        refinancedTo: String(editForm.refinancedTo || ""), 
        rolloverLogs: editForm.rolloverLogs || [], 
        startDate: formattedStartDate,
        investors: cleanInvestors,
        capitalRemaining: calculatedRemaining,
        rolloverRequested: isRefinancing ? false : (editForm.rolloverRequested || false)
      };

      let start = new Date(formattedStartDate + 'T00:00:00');

      if (deal.dealType === 'long_term') {
        updatedData.termYears = parseInt(editForm.termYears, 10) || 0;
        updatedData.durationMonths = updatedData.termYears * 12; 
        updatedData.paymentsMade = parseInt(editForm.paymentsMade, 10) || 0;
        updatedData.apy = parseFinancial(editForm.apy);
        updatedData.payoutFrequency = String(editForm.payoutFrequency || "monthly");
        start.setFullYear(start.getFullYear() + updatedData.termYears);
      } else {
        updatedData.durationMonths = parseInt(editForm.durationMonths, 10) || 0;
        start.setMonth(start.getMonth() + updatedData.durationMonths);
      }
      
      updatedData.dueDate = start.toISOString().split('T')[0];

      let currentDocs = Array.isArray(deal.documents) ? deal.documents : [];
      if (editFile) {
        const storage = getStorage();
        const safeFileName = editFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileRef = ref(storage, `tenants/${activeTenant}/deals/edit_${deal.id}_${Date.now()}_${safeFileName}`);
        const snapshot = await uploadBytes(fileRef, editFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        updatedData.fileUrl = downloadURL;
        updatedData.fileName = editFile.name; 
        currentDocs.push({
          title: String(editFile.name || "Document"),
          url: String(downloadURL),
          uploadedAt: new Date().toISOString()
        });
      }

      updatedData.documents = currentDocs.filter(d => d && typeof d.url === 'string' && d.url.startsWith('http'))
        .map(d => ({ title: String(d.title || "Document"), url: String(d.url), uploadedAt: String(d.uploadedAt || new Date().toISOString()) }));

      await updateDoc(dealRef, updatedData);
      
      showAlert('SUCCESS', `Contract updated. Status locked to [ ${nextStatus.toUpperCase()} ].`);
      onSuccess({ id: deal.id, ...updatedData }); // Trigger parent update
    } catch (error) {
      console.error("Edit Error:", error);
      showAlert('ERROR', 'System synchronization failed. Verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in zoom-in duration-200">
      <div className="bg-black border-4 border-[#D4AF37] max-w-3xl w-full p-8 shadow-[12px_12px_0px_0px_#D4AF37] relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-6 text-3xl font-black text-gray-500 hover:text-white transition-colors z-[100]">X</button>
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Edit Contract Logic</h2>
        <p className="font-mono text-xs text-[#D4AF37] mb-6 uppercase tracking-widest">{deal.contractor}</p>
        
        {editForm.rolloverRequested && (
           <div className="bg-[#00AEEF]/20 border-2 border-[#00AEEF] p-4 mb-6 shadow-[0_0_15px_rgba(0,174,239,0.5)] flex justify-between items-center animate-pulse">
              <span className="font-black text-[#00AEEF] uppercase tracking-widest">⚠️ ROLLOVER / REFINANCE REQUESTED</span>
           </div>
        )}

        <form onSubmit={handleEditSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <CustomDateInput label="Inception (Start Date)" value={editForm.startDate} onChange={(newDate) => setEditForm({...editForm, startDate: newDate})} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Term Length</label>
              {deal.dealType === 'long_term' ? (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={editForm.termYears} onChange={(e) => setEditForm({...editForm, termYears: e.target.value})} className="w-full bg-[#111] text-white border-2 border-gray-700 p-3 font-mono font-black focus:border-[#D4AF37] outline-none shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" />
                  <span className="font-mono text-xs text-gray-500">Years</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={editForm.durationMonths} onChange={(e) => setEditForm({...editForm, durationMonths: e.target.value})} className="w-full bg-[#111] text-white border-2 border-gray-700 p-3 font-mono font-black focus:border-[#D4AF37] outline-none shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" />
                  <span className="font-mono text-xs text-gray-500">Months</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111] p-6 border-4 border-[#00AEEF]">
             <label className="block text-sm font-black uppercase tracking-widest text-[#00AEEF] mb-4">Cap Table Allocation (Assignment)</label>
             <div className="space-y-2 mb-6 border-l-4 border-gray-700 pl-4">
               {editForm.investors.map((inv, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-800 pb-2">
                     <span className="font-mono text-sm text-white uppercase font-bold">{inv.name}</span>
                     <div className="flex items-center gap-4">
                        <span className="font-black text-[#D4AF37] text-lg">${parseFinancial(inv.contribution).toLocaleString()} <span className="text-[10px] text-gray-500">TARGET</span></span>
                        <button type="button" onClick={() => setEditForm({...editForm, investors: editForm.investors.filter((_, i) => i !== idx)})} className="text-[#FF0000] hover:text-white font-black px-2 text-xl hover:scale-125 transition-transform">X</button>
                     </div>
                  </div>
               ))}
               {editForm.investors.length === 0 && <p className="font-mono text-xs text-gray-600 italic">No investors allocated. Deal defaults to Open Market.</p>}
             </div>
             
             <div className="flex flex-col md:flex-row gap-2 items-stretch h-auto md:h-[3rem] relative z-[70] bg-black p-2 border-2 border-dashed border-gray-700">
                <div className="flex-1 min-w-[200px] h-[34px] md:h-auto">
                  <CustomDropdown options={investorOptions.map(opt => ({ label: opt, value: opt }))} value={newAllocInvestor} onChange={setNewAllocInvestor} />
                </div>
                <input type="number" placeholder="TARGET ($)" value={newAllocAmount} onChange={(e) => setNewAllocAmount(e.target.value)} className="w-full md:w-1/3 bg-black text-white border-2 border-gray-700 p-2 font-mono text-xs focus:border-[#00AEEF] outline-none h-[34px] md:h-auto" />
                <button type="button" onClick={() => {
                    if(newAllocInvestor && newAllocAmount) {
                      setEditForm({...editForm, investors: [...editForm.investors, { name: newAllocInvestor, contribution: parseFinancial(newAllocAmount), tranches: [] }]});
                      setNewAllocInvestor(''); setNewAllocAmount('');
                    }
                  }} 
                  className="bg-[#00AEEF] text-black px-6 font-black text-xs uppercase hover:bg-white transition-colors h-[34px] md:h-auto shadow-[2px_2px_0px_0px_#000000]"
                >
                  Assign
                </button>
             </div>
          </div>

          {editForm.investors.length > 0 && (
            <div className="bg-[#111] p-6 border-4 border-[#FF5722]">
              <label className="block text-sm font-black uppercase tracking-widest text-[#FF5722] mb-4">Payment Tranches (Wire Tracking)</label>
              <div className="space-y-8">
                {editForm.investors.map((inv, idx) => {
                  const explicitProfit = parseFinancial(deal.expectedProfit) || parseFinancial(deal.projectedProfit) || parseFinancial(deal.profit);
                  const derivedFromPayout = parseFinancial(deal.expectedTotalPayout || deal.expectedPayout || 0) - parseFinancial(deal.investmentRequired);
                  const roiPct = parseFinancial(deal.expectedInterestRate) || parseFinancial(deal.roi) || parseFinancial(deal.percentReturn) || parseFinancial(deal.returnPercentage) || parseFinancial(deal.apy);
                  const derivedFromRoi = parseFinancial(deal.investmentRequired) * (roiPct / 100);
                  let actualProfit = explicitProfit > 0 ? explicitProfit : Math.max(0, derivedFromPayout);
                  if (actualProfit === 0 && derivedFromRoi > 0) actualProfit = derivedFromRoi;
                  const dealExpectedTotal = actualProfit + parseFinancial(deal.investmentRequired);
                  const totalRolled = (editForm.rolloverLogs || []).filter(l => l.investor === inv.name).reduce((sum, l) => sum + l.amount, 0);
                  const creditBalance = Math.max(0, dealExpectedTotal - totalRolled);
                  const showCredit = editForm.status === 'Refinanced' && creditBalance > 0;

                  return (
                  <div key={idx} className="bg-black border-2 border-gray-800 p-4">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                      <span className="font-mono text-sm text-white uppercase font-bold">{inv.name}</span>
                      <span className="font-black text-gray-500 text-xs">TARGET: <span className="text-white">${parseFinancial(inv.contribution).toLocaleString()}</span></span>
                    </div>
                    {showCredit && (
                      <div className="bg-[#00AEEF]/10 border-2 border-[#00AEEF] p-2 mb-4 text-center">
                        <span className="text-[10px] font-mono text-[#00AEEF] uppercase font-bold tracking-widest block">Available Credit Balance</span>
                        <span className="font-black text-xl text-white">${creditBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      {(inv.tranches || []).map((t, tIdx) => (
                         <div key={tIdx} className="flex justify-between items-center text-[10px] font-mono bg-[#111] p-2 border border-gray-700">
                           <span className="text-gray-400">{t.date}</span>
                           <span className="text-white font-bold text-xs">${parseFinancial(t.amount).toLocaleString()}</span>
                           <span className={`px-2 py-1 uppercase font-black ${t.status === 'Cleared' ? 'bg-green-900/50 text-green-500' : 'bg-yellow-900/50 text-yellow-500'}`}>{t.status}</span>
                           <button type="button" onClick={() => handleRemoveTranche(idx, tIdx)} className="text-red-500 hover:text-white font-black px-2 py-1 hover:bg-red-900 transition-colors">X</button>
                         </div>
                      ))}
                      {(!inv.tranches || inv.tranches.length === 0) && <p className="text-[10px] text-gray-600 italic font-mono">No tranches logged.</p>}
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-[#111] p-2 border-2 border-dashed border-gray-700">
                       <TrancheDateInput value={trancheInputs[idx]?.date || ''} onChange={(val) => setTrancheInputs({...trancheInputs, [idx]: {...(trancheInputs[idx] || {}), date: val}})} />
                       <input type="number" placeholder="$ AMT" value={trancheInputs[idx]?.amount || ''} onChange={(e) => setTrancheInputs({...trancheInputs, [idx]: {...(trancheInputs[idx] || {}), amount: e.target.value}})} className="flex-1 min-w-[80px] bg-black text-white border border-gray-700 text-xs p-2 font-bold outline-none focus:border-[#FF5722] h-[34px]" />
                       <div className="w-28 h-[34px] relative z-[50]">
                         <CustomDropdown options={[{label: 'PENDING', value: 'Pending'}, {label: 'CLEARED', value: 'Cleared'}]} value={trancheInputs[idx]?.status || 'Pending'} onChange={(val) => setTrancheInputs({...trancheInputs, [idx]: {...(trancheInputs[idx] || {}), status: val}})} size="mini" />
                       </div>
                       <button type="button" onClick={() => handleAddTranche(idx)} className="bg-[#FF5722] hover:bg-white text-black font-black uppercase text-xs px-4 h-[34px] transition-colors shadow-[2px_2px_0px_0px_#000000]">Log</button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {deal.dealType === 'long_term' && (
            <div className="grid grid-cols-3 gap-6 p-4 border-2 border-gray-800 bg-[#111]">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">APY (%)</label>
                <input type="number" step="0.1" value={editForm.apy} onChange={(e) => setEditForm({...editForm, apy: e.target.value})} className="w-full bg-black text-[#D4AF37] border-2 border-gray-700 p-2 font-mono font-black focus:border-[#D4AF37] outline-none shadow-[2px_2px_0px_0px_#000000]" />
              </div>
              <div>
                <CustomDropdown label="Frequency" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' }]} value={editForm.payoutFrequency} onChange={(val) => setEditForm({...editForm, payoutFrequency: val})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-2">Dividends Sent</label>
                <input type="number" min="0" value={editForm.paymentsMade} onChange={(e) => setEditForm({...editForm, paymentsMade: e.target.value})} className="w-full bg-black text-white border-2 border-[#D4AF37] p-2 font-mono font-black focus:border-[#FF0000] outline-none shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" title="Set this to backtrack past payments!" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Contract Status (Overrides Auto-Routing)</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditForm({...editForm, status: 'open'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'open' || editForm.status === 'Open' ? 'bg-[#00AEEF] text-black border-[#00AEEF] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#00AEEF] hover:text-[#00AEEF]'}`}>DEAL ROOM 🔵</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'In Progress'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'In Progress' || editForm.status === 'Active' ? 'bg-green-600 text-white border-green-600 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-green-600 hover:text-green-500'}`}>ACTIVE 🟢</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'Awaiting Funds (Contractor)'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'Awaiting Funds (Contractor)' ? 'bg-yellow-400 text-black border-yellow-400 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-yellow-400 hover:text-yellow-400'}`}>AWAITING CONTRACTOR 🟡</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'Awaiting Funds (Investor)'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'Awaiting Funds (Investor)' || editForm.status === 'Awaiting Payment' ? 'bg-orange-500 text-white border-orange-500 shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-orange-500 hover:text-orange-500'}`}>AWAITING INVESTOR 🟠</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'Paid'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'Paid' ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}>PAID/MATURED ⚫</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'Refinanced'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'Refinanced' ? 'bg-[#9333EA] text-white border-[#9333EA] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#9333EA] hover:text-[#9333EA]'}`}>REFINANCED 🔄</button>
              <button type="button" onClick={() => setEditForm({...editForm, status: 'Late'})} className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all border-2 ${editForm.status === 'Late' ? 'bg-[#FF0000] text-white border-[#FF0000] shadow-[2px_2px_0px_0px_#FFFFFF]' : 'bg-black text-gray-500 border-gray-700 hover:border-[#FF0000] hover:text-[#FF0000]'}`}>LATE 🔴</button>
            </div>
          </div>

          {editForm.status === 'Refinanced' && (
            <div className="bg-black p-6 border-4 border-[#9333EA] shadow-[8px_8px_0px_0px_#9333EA] animate-in fade-in duration-300">
              <h3 className="text-[#9333EA] font-black uppercase tracking-tighter text-2xl mb-2">Capital Rollover Engine</h3>
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-6">Execute cross-deal capital transfers seamlessly.</p>
              
              <div className="flex flex-col gap-4">
                 <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/3">
                      <CustomDropdown label="SOURCE INVESTOR" options={editForm.investors.map(inv => ({ label: inv.name, value: inv.name }))} value={refiInvestor} onChange={setRefiInvestor} />
                    </div>
                    <div className="w-full md:w-2/3">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">TARGET DEAL</label>
                      <DealSearchDropdown 
                        options={allDeals.filter(d => d.id !== deal.id && !['Paid', 'Matured', 'Refinanced'].includes(d.status)).map(d => ({
                          value: d.id, 
                          label: `${d.contractor} [Rem: $${parseFinancial(d.capitalRemaining || d.investmentRequired).toLocaleString()}]`
                        }))}
                        value={refiTargetDeal}
                        onChange={setRefiTargetDeal}
                      />
                    </div>
                 </div>
                 
                 <div className="flex flex-col md:flex-row gap-4 items-center mt-2 border-t-2 border-gray-800 pt-4">
                    <div className="w-full md:w-1/3 relative">
                       <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">ROLLOVER AMOUNT</label>
                       <span className="absolute bottom-4 left-4 text-[#D4AF37] font-black text-xl">$</span>
                       <input type="number" value={refiAmount} onChange={(e) => setRefiAmount(e.target.value)} className="w-full bg-[#111] text-white border-2 border-gray-700 pl-8 pr-4 py-4 font-black uppercase text-xl focus:border-[#9333EA] outline-none shadow-[2px_2px_0px_0px_#000000]" />
                    </div>
                    <div className="w-full md:w-2/3 flex gap-2 mt-6 md:mt-6">
                       <button type="button" onClick={executeRefinanceTransfer} className="flex-1 bg-[#9333EA] text-white font-black text-sm uppercase py-4 border-2 border-[#9333EA] hover:bg-black hover:text-[#9333EA] transition-all shadow-[4px_4px_0px_0px_#000000]">EXECUTE TRANSFER</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#00AEEF] mb-2">Investor Updates (Visible to Syndicate)</label>
            <textarea value={editForm.investorNotes} onChange={(e) => setEditForm({...editForm, investorNotes: e.target.value})} className="w-full bg-[#111] text-[#00AEEF] border-2 border-[#00AEEF]/50 p-3 font-mono text-xs h-24 focus:border-[#00AEEF] outline-none resize-none" placeholder="Broadcast updates to the investor dossier..." />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Internal Notes (Admin Only)</label>
            <textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} className="w-full bg-[#111] text-white border-2 border-gray-700 p-3 font-mono text-xs h-24 focus:border-[#D4AF37] outline-none resize-none" />
          </div>

          <div className="bg-[#111] p-4 border-2 border-dashed border-gray-700">
            <label className="block text-[10px] font-black uppercase tracking-widest text-white mb-2">Attach Additional File / Final Doc</label>
            <input type="file" onChange={(e) => setEditFile(e.target.files[0])} className="w-full font-mono text-xs text-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#D4AF37] file:text-black file:font-bold hover:file:bg-white cursor-pointer transition-colors" />
            {editFile && <p className="text-[10px] text-[#D4AF37] mt-2 font-mono uppercase">Selected: {editFile.name}</p>}
          </div>

          <div className="flex gap-4 pt-4 border-t-2 border-gray-800">
            <button type="button" onClick={onClose} className="flex-1 bg-transparent text-gray-500 border-2 border-gray-700 py-3 font-black uppercase tracking-widest text-xs hover:text-white hover:border-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#D4AF37] text-black border-2 border-[#D4AF37] py-3 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_#FFFFFF] disabled:opacity-50">
              {loading ? 'SYNCING MATRIX...' : 'RECALCULATE & SAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealModal;
