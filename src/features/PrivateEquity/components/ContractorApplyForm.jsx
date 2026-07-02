// File: src/features/PrivateEquity/components/ContractorApplyForm.jsx

import React, { useState, useContext } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { AuthContext } from '../../../context/AuthContext';

// Assuming you have these global UI components built as discussed
import CustomDateInput from '../../../components/ui/CustomDateInput';
import CustomDropdown from '../../../components/ui/CustomDropdown';

export default function ContractorApplyForm({ onClose, onApplicationSubmitted }) {
  const { activeTenant, currentUser, userProfile } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State - Mapped directly to Panda Africa physical contract
  const [formData, setFormData] = useState({
    // Client Details
    clientName: userProfile?.fullName || '',
    nrcPassport: '',
    businessName: '',
    sector: '',
    tpin: '',
    address: '',
    contactDetails: currentUser?.email || '',
    
    // Loan Request Info
    loanAmount: '',
    repaymentSource: '',
    loanPurpose: '',
    repaymentSchedule: '',
    securityOffered: '',

    // Contract Info
    contractingCompany: '',
    contractNature: '',
    effectiveDate: '',
    expiryDate: '',

    // Financial Details
    totalContractValue: '',
    advancePayments: '',
    otherAdvances: '',
    liquidatedDamages: '',
    retentions: '',
    netContractValue: '',

    // Authorization
    crbAuthorized: false,
    signatureName: '',
    signatureDate: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.crbAuthorized || !formData.signatureName) {
      setErrorMsg("AUTHORIZATION DENIED. YOU MUST SIGN AND AUTHORIZE THE CRB CHECK.");
      return;
    }

    setLoading(true);
    try {
      const dealsRef = collection(db, `tenants/${activeTenant}/deals`);
      
      const newDealPayload = {
        contractor: formData.businessName || formData.clientName,
        contractorEmail: currentUser.email.toLowerCase(),
        offTaker: formData.contractingCompany,
        dealType: 'short_term', // Default for contract finance
        status: 'Pending CEO Review',
        investmentRequired: formData.loanAmount,
        dueDate: formData.expiryDate || 'TBD',
        startDate: formData.effectiveDate || new Date().toISOString().split('T')[0],
        
        // Massive Payload Object for Admin view
        intakeDossier: { ...formData },
        
        // Boilerplate tracking
        investors: [],
        projectUpdates: [],
        contractorStatus: 'PENDING INTAKE',
        createdAt: new Date().toISOString()
      };

      await addDoc(dealsRef, newDealPayload);
      
      if (onApplicationSubmitted) onApplicationSubmitted();
    } catch (err) {
      console.error("INTAKE FAULT:", err);
      setErrorMsg("TRANSMISSION FAILED. CHECK SYSTEM CONNECTION.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black border-4 border-[#00AEEF] p-6 md:p-10 shadow-[16px_16px_0px_0px_#00AEEF] max-h-[90vh] overflow-y-auto custom-scrollbar relative font-mono text-white selection:bg-[#FF0000] selection:text-white uppercase">
      
      <button onClick={onClose} className="absolute top-4 right-6 text-3xl font-black text-[#00AEEF] hover:text-[#FF0000] transition-colors z-50">X</button>

      {/* BRANDING HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-[#00AEEF] pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-[2px_2px_0px_#FF0000] text-white">
            CAPITAL INTAKE
          </h2>
          <p className="text-[#00AEEF] font-bold tracking-widest mt-2">
            PANDA AFRICA // CONTRACT FINANCE PROTOCOL
          </p>
        </div>
        {/* Placeholder for Panda Logo */}
        <div className="bg-white p-2 border-4 border-black shadow-[4px_4px_0px_0px_#D4AF37]">
           <img src="/panda-logo.png" alt="Panda Africa" className="h-12 object-contain" onError={(e) => e.target.style.display='none'} />
           <span className="text-black text-[10px] font-black tracking-widest text-center block">AUTH LOGO</span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#FF0000] text-black font-black p-4 mb-8 border-4 border-white shadow-[6px_6px_0px_0px_white] animate-pulse">
          [FAULT]: {errorMsg}
        </div>
      )}

      <form onSubmit={submitApplication} className="space-y-12">
        
        {/* SECTION 1: CLIENT DETAILS */}
        <section className="border-l-4 border-[#D4AF37] pl-6">
          <h3 className="text-2xl font-black text-[#D4AF37] mb-6 tracking-widest border-b-2 border-gray-800 pb-2">01 // CLIENT IDENTIFICATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">FULL NAME / COMPANY</label>
              <input required value={formData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#D4AF37] outline-none transition-colors" placeholder="ENTER LEGAL NAME" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">BUSINESS NAME</label>
              <input required value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#D4AF37] outline-none transition-colors" placeholder="DBA / TRADING AS" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">NRC / PASSPORT NUMBER</label>
              <input required value={formData.nrcPassport} onChange={(e) => handleInputChange('nrcPassport', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#D4AF37] outline-none transition-colors" placeholder="ID NUMBER" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">TPIN (TAX ID)</label>
              <input required value={formData.tpin} onChange={(e) => handleInputChange('tpin', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#D4AF37] outline-none transition-colors" placeholder="TAX IDENTIFICATION" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">BUSINESS SECTOR / INDUSTRY</label>
              <CustomDropdown 
                options={[
                  { value: 'Construction', label: 'CONSTRUCTION & ENGINEERING' },
                  { value: 'Logistics', label: 'LOGISTICS & TRANSPORT' },
                  { value: 'Agriculture', label: 'AGRICULTURE' },
                  { value: 'Technology', label: 'TECHNOLOGY / IT' },
                  { value: 'Other', label: 'OTHER (SPECIFY IN NOTES)' }
                ]}
                value={formData.sector} onChange={(val) => handleInputChange('sector', val)}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: LOAN REQUEST */}
        <section className="border-l-4 border-[#00AEEF] pl-6">
          <h3 className="text-2xl font-black text-[#00AEEF] mb-6 tracking-widest border-b-2 border-gray-800 pb-2">02 // LOAN ARCHITECTURE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">AMOUNT REQUESTED</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-[#00AEEF] font-black">$</span>
                <input required type="number" value={formData.loanAmount} onChange={(e) => handleInputChange('loanAmount', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 pl-8 text-white focus:border-[#00AEEF] outline-none transition-colors" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">PURPOSE OF LOAN</label>
              <input required value={formData.loanPurpose} onChange={(e) => handleInputChange('loanPurpose', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#00AEEF] outline-none transition-colors" placeholder="WORKING CAPITAL / PROCUREMENT" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">PROPOSED REPAYMENT SOURCE</label>
              <input required value={formData.repaymentSource} onChange={(e) => handleInputChange('repaymentSource', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#00AEEF] outline-none transition-colors" placeholder="CONTRACT PROCEEDS / OTHER INCOME" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">SECURITY OFFERED</label>
              <input required value={formData.securityOffered} onChange={(e) => handleInputChange('securityOffered', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#00AEEF] outline-none transition-colors" placeholder="LIEN ON CONTRACT / VEHICLE / PROPERTY" />
            </div>
          </div>
        </section>

        {/* SECTION 3: CONTRACT INFORMATION */}
        <section className="border-l-4 border-white pl-6">
          <h3 className="text-2xl font-black text-white mb-6 tracking-widest border-b-2 border-gray-800 pb-2">03 // CONTRACT TARGET</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">CONTRACTING COMPANY (OFF-TAKER)</label>
              <input required value={formData.contractingCompany} onChange={(e) => handleInputChange('contractingCompany', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-white outline-none transition-colors" placeholder="NAME OF AWARDING ENTITY" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">NATURE OF CONTRACT</label>
              <textarea required rows="3" value={formData.contractNature} onChange={(e) => handleInputChange('contractNature', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-white outline-none transition-colors resize-none" placeholder="SCOPE AND PURPOSE..."></textarea>
            </div>
            <div>
              <CustomDateInput label="EFFECTIVE START DATE" value={formData.effectiveDate} onChange={(val) => handleInputChange('effectiveDate', val)} />
            </div>
            <div>
              <CustomDateInput label="EXPIRY DATE" value={formData.expiryDate} onChange={(val) => handleInputChange('expiryDate', val)} />
            </div>
          </div>
        </section>

        {/* SECTION 4: FINANCIAL DETAILS */}
        <section className="border-l-4 border-[#FF0000] pl-6">
          <h3 className="text-2xl font-black text-[#FF0000] mb-6 tracking-widest border-b-2 border-gray-800 pb-2">04 // FINANCIAL MATRIX</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">1. TOTAL CONTRACT VALUE</label>
              <input type="number" required value={formData.totalContractValue} onChange={(e) => handleInputChange('totalContractValue', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-[#FF0000] font-black focus:border-[#FF0000] outline-none" placeholder="$0.00" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">2. ADVANCE PAYMENTS RECEIVED</label>
              <input type="number" value={formData.advancePayments} onChange={(e) => handleInputChange('advancePayments', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#FF0000] outline-none" placeholder="$0.00" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">4. LIQUIDATED DAMAGES</label>
              <input type="number" value={formData.liquidatedDamages} onChange={(e) => handleInputChange('liquidatedDamages', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#FF0000] outline-none" placeholder="$0.00" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold mb-2">6. NET CONTRACT VALUE (BALANCE)</label>
              <input type="number" required value={formData.netContractValue} onChange={(e) => handleInputChange('netContractValue', e.target.value)} className="w-full bg-black border-4 border-[#FF0000] shadow-[4px_4px_0px_0px_#FF0000] p-4 text-white font-black focus:outline-none" placeholder="$0.00" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold mb-2">3 & 5. OTHER PAYMENTS / RETENTIONS</label>
              <input value={formData.retentions} onChange={(e) => handleInputChange('retentions', e.target.value)} className="w-full bg-[#111] border-2 border-gray-700 p-4 text-white focus:border-[#FF0000] outline-none" placeholder="SPECIFY WITHHOLDINGS OR DEDUCTIONS" />
            </div>
          </div>
        </section>

        {/* SECTION 5: AUTHORIZATION */}
        <section className="bg-[#111] p-6 border-4 border-gray-800">
          <label className="flex items-start gap-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.crbAuthorized}
              onChange={(e) => handleInputChange('crbAuthorized', e.target.checked)}
              className="mt-1 w-6 h-6 appearance-none border-2 border-white checked:bg-[#D4AF37] checked:border-[#D4AF37] relative after:content-[''] after:absolute after:hidden checked:after:block after:left-1.5 after:top-0.5 after:w-2 after:h-3 after:border-solid after:border-black after:border-r-2 after:border-b-2 after:rotate-45"
            />
            <span className="text-xs text-gray-400 font-bold leading-relaxed">
              BY SIGNING THIS APPLICATION FORM, I HEREBY AUTHORIZE PANDA AFRICA SOLUTIONS LIMITED TO OBTAIN, ACCESS, AND REVIEW MY CREDIT REFERENCE BUREAU (CRB) REPORT FOR THE PURPOSE OF ASSESSING, PROCESSING, AND ADMINISTERING MY LOAN APPLICATION.
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t-2 border-gray-800">
            <div>
               <label className="block text-[10px] text-[#D4AF37] font-bold mb-2">DIGITAL SIGNATURE (TYPE NAME)</label>
               <input required value={formData.signatureName} onChange={(e) => handleInputChange('signatureName', e.target.value)} className="w-full bg-black border-b-4 border-white p-4 text-[#D4AF37] font-black text-xl outline-none" placeholder="SIGN HERE" />
            </div>
            <div>
               <CustomDateInput label="SIGNATURE DATE" value={formData.signatureDate} onChange={(val) => handleInputChange('signatureDate', val)} />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#00AEEF] text-black border-4 border-white py-6 text-2xl font-black tracking-widest hover:bg-white transition-all shadow-[8px_8px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:grayscale"
        >
          {loading ? 'TRANSMITTING DOSSIER...' : 'SUBMIT CAPITAL APPLICATION'}
        </button>

      </form>
    </div>
  );
}
