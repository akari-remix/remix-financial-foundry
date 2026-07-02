// File: src/components/ui/CustomDateInput.jsx
import React from 'react';

const CustomDateInput = ({ label, value, onChange, themeColor = '#D4AF37' }) => {
  const parts = (value || '').split('-');
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const handleUpdate = (type, val) => {
    const num = val.replace(/\D/g, '');
    let newY = year; let newM = month; let newD = day;
    if (type === 'Y') newY = num.substring(0, 4);
    if (type === 'M') newM = num.substring(0, 2);
    if (type === 'D') newD = num.substring(0, 2);
    onChange(`${newY}-${newM}-${newD}`);
  };

  return (
    <div className="relative font-mono w-full">
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <div className="flex gap-1 md:gap-2 items-center w-full">
        <input 
          type="text" 
          placeholder="MM" 
          value={month} 
          onChange={(e) => handleUpdate('M', e.target.value)} 
          className="flex-1 min-w-0 bg-[#111] text-white border-2 border-gray-700 p-2 md:p-3 font-black text-center outline-none transition-colors shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" 
          onFocus={(e) => { e.target.style.borderColor = themeColor; }}
          onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
        />
        <span className="font-black text-lg md:text-2xl" style={{ color: themeColor }}>/</span>
        <input 
          type="text" 
          placeholder="DD" 
          value={day} 
          onChange={(e) => handleUpdate('D', e.target.value)} 
          className="flex-1 min-w-0 bg-[#111] text-white border-2 border-gray-700 p-2 md:p-3 font-black text-center outline-none transition-colors shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" 
          onFocus={(e) => { e.target.style.borderColor = themeColor; }}
          onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
        />
        <span className="font-black text-lg md:text-2xl" style={{ color: themeColor }}>/</span>
        <input 
          type="text" 
          placeholder="YYYY" 
          value={year} 
          onChange={(e) => handleUpdate('Y', e.target.value)} 
          className="flex-[1.5] min-w-0 bg-[#111] text-white border-2 border-gray-700 p-2 md:p-3 font-black text-center outline-none transition-colors shadow-[2px_2px_0px_0px_#000000] focus:shadow-[2px_2px_0px_0px_#D4AF37]" 
          onFocus={(e) => { e.target.style.borderColor = themeColor; }}
          onBlur={(e) => { e.target.style.borderColor = '#374151'; }}
        />
      </div>
    </div>
  );
};

export default CustomDateInput;
