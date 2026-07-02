// File: src/components/ui/CustomDropdown.jsx

import React, { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ label, options = [], value, onChange, size = 'normal' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if user clicks outside of the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const heightClass = size === 'mini' ? 'h-[34px] p-2 text-[10px]' : 'p-4 text-sm';

  return (
    <div className="relative font-mono w-full uppercase" ref={dropdownRef}>
      {label && <label className="block text-[10px] font-black tracking-widest text-gray-400 mb-2">{label}</label>}
      
      {/* TRIGGER BUTTON */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full bg-black border-4 font-black text-white cursor-pointer flex justify-between items-center transition-all ${heightClass} ${
          isOpen 
            ? 'border-[#00AEEF] text-[#00AEEF] shadow-[6px_6px_0px_0px_#00AEEF] translate-x-1 -translate-y-1' 
            : 'border-white shadow-[4px_4px_0px_0px_white] hover:border-[#D4AF37] hover:text-[#D4AF37]'
        }`}
      >
        <span className="truncate pr-4">{selectedOption ? selectedOption.label : 'SELECT...'}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00AEEF]' : ''}`}>▼</span>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-black border-4 border-[#00AEEF] shadow-[8px_8px_0px_0px_#000000] max-h-60 overflow-y-auto custom-scrollbar">
          {options.length === 0 ? (
             <div className="p-4 font-black text-gray-600 text-xs text-center tracking-widest border-b-2 border-gray-800">
               [ NO DATA DETECTED ]
             </div>
          ) : (
            options.map((opt) => (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                className="p-4 font-black text-white hover:bg-[#00AEEF] hover:text-black cursor-pointer transition-colors border-b-2 border-gray-800 last:border-b-0 text-xs tracking-widest"
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
