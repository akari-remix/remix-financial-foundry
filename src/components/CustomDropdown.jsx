// File: src/components/ui/CustomDropdown.jsx
import React, { useState } from 'react';

const CustomDropdown = ({ label, options, value, onChange, size = 'default', themeColor = '#D4AF37' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const paddingClass = size === 'mini' ? 'px-2 py-0 h-full' : 'p-3';
  const borderClass = size === 'mini' ? 'border' : 'border-2';
  const textClass = size === 'mini' ? 'text-[10px] font-black uppercase text-white' : 'text-sm font-bold uppercase text-white';
  
  // Custom theme colors for selected state
  const focusBorder = size === 'mini' 
    ? 'border-[#FF5722] text-[#FF5722] shadow-[2px_2px_0px_0px_#FF5722]' 
    : `border-[${themeColor}] text-[${themeColor}] shadow-[2px_2px_0px_0px_${themeColor}]`;

  return (
    <div className="relative font-mono z-50 w-full h-full flex items-center">
      {label && <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full bg-[#111] ${borderClass} border-gray-700 ${paddingClass} ${textClass} cursor-pointer flex justify-between items-center transition-all shadow-[2px_2px_0px_0px_#000000] ${isOpen ? focusBorder : 'focus:outline-none hover:border-gray-500'}`}
        style={isOpen ? { borderColor: themeColor, color: themeColor, boxShadow: `2px 2px 0px 0px ${themeColor}` } : {}}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : 'SELECT OPTION'}</span>
        <span className={`transform transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div 
            className="absolute z-50 w-full mt-1 left-0 bg-black border-4 shadow-[4px_4px_0px_0px_#000000] max-h-48 overflow-y-auto top-full"
            style={{ borderColor: themeColor }}
          >
            {options.map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                className={`p-3 font-black uppercase text-white cursor-pointer transition-colors border-b-2 border-zinc-800 last:border-b-0 ${size === 'mini' ? 'text-[10px] hover:bg-[#FF5722] hover:text-black' : 'text-xs hover:bg-[#D4AF37] hover:text-black'}`}
                style={size !== 'mini' ? { '--hover-bg': themeColor } : {}}
                onMouseEnter={(e) => { if (size !== 'mini') { e.target.style.backgroundColor = themeColor; e.target.style.color = '#000'; } }}
                onMouseLeave={(e) => { if (size !== 'mini') { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#fff'; } }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomDropdown;
