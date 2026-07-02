// File: src/components/ui/MultiSelectSearchDropdown.jsx
import React, { useState } from 'react';

const MultiSelectSearchDropdown = ({ options, selected, onChange, themeColor = '#D4AF37' }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = options.filter(opt => opt.includes(search.toUpperCase()));

  const toggleSelection = (opt) => {
    if (opt === 'ALL') {
      onChange(['ALL']);
      setSearch('');
      setIsOpen(false);
      return;
    }
    let newSelected = [...selected].filter(s => s !== 'ALL'); 
    if (newSelected.includes(opt)) {
      newSelected = newSelected.filter(s => s !== opt);
      if (newSelected.length === 0) newSelected = ['ALL'];
    } else {
      newSelected.push(opt);
    }
    onChange(newSelected);
  };

  const removeSelection = (opt) => {
    let newSelected = selected.filter(s => s !== opt);
    if (newSelected.length === 0) newSelected = ['ALL'];
    onChange(newSelected);
  };

  return (
    <div className="relative font-mono z-40 w-full md:w-2/3 lg:w-1/2">
      {!selected.includes('ALL') && (
        <div className="flex flex-wrap gap-2 mb-3">
          <div onClick={() => toggleSelection('ALL')} className="bg-gray-800 text-gray-400 px-3 py-1 font-black text-xs uppercase cursor-pointer hover:bg-gray-700 transition-colors">
            CLEAR ALL
          </div>
          {selected.map(s => (
            <div 
              key={s} 
              className="text-black px-3 py-1 font-black text-xs uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]"
              style={{ backgroundColor: themeColor }}
            >
              {s} 
              <span className="cursor-pointer hover:text-white font-black text-sm ml-1" onClick={() => removeSelection(s)}>×</span>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <input 
          type="text" 
          placeholder={selected.includes('ALL') ? "SEARCH & ADD INVESTORS..." : "SEARCH TO ADD MORE..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-[#111] text-white border-4 border-gray-700 p-4 font-black uppercase text-sm outline-none transition-all shadow-[4px_4px_0px_0px_#000000]"
          style={isOpen ? { borderColor: themeColor, boxShadow: `4px 4px 0px 0px ${themeColor}` } : {}}
        />
        <span 
          className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xl cursor-pointer" 
          style={{ color: themeColor }}
          onClick={() => setIsOpen(!isOpen)}
        >
          ▼
        </span>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          <div 
            className="absolute z-40 w-full mt-2 bg-black border-4 shadow-[8px_8px_0px_0px_#000000] max-h-60 overflow-y-auto"
            style={{ borderColor: themeColor }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-gray-500 font-bold text-xs uppercase">No matches found.</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                  <div 
                    key={opt}
                    onClick={() => toggleSelection(opt)}
                    className={`p-4 font-black uppercase tracking-widest cursor-pointer transition-colors border-b-2 border-zinc-800 last:border-b-0 text-xs flex justify-between items-center ${isSelected ? 'text-black' : 'text-white hover:bg-zinc-800'}`}
                    style={isSelected ? { backgroundColor: themeColor } : {}}
                  >
                    {opt}
                    {isSelected && <span className="text-lg">✓</span>}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MultiSelectSearchDropdown;
