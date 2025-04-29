"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  options: { label: string; value: string; }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CustomDropdown({ options, value, onChange, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-48 bg-black border border-[#E6B325]/30 text-[#E6B325] py-2 px-4 rounded-lg 
                 flex items-center justify-between
                 focus:outline-none focus:border-[#E6B325] hover:border-[#E6B325] transition-colors"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-[#E6B325]/30 rounded-lg overflow-hidden z-40 shadow-lg shadow-black/50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 transition-colors
                          ${option.value === value 
                            ? 'bg-[#E6B325]/10 text-[#E6B325]' 
                            : 'text-[#E6B325] hover:bg-[#E6B325]/10'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 