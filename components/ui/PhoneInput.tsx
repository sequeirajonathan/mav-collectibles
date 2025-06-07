"use client";

import React from "react";
import { Input } from "@components/ui/input";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 10);
    const formatted = input.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (_, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`;
      if (p2) return `(${p1}) ${p2}`;
      if (p1) return `(${p1}`;
      return '';
    });
    
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        value: formatted
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(newEvent);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Non-editable prefix */}
      <span className="select-none text-gray-300">+1</span>
      {/* The masked input */}
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        type="tel"
        inputMode="numeric"
        className="flex-1"
      />
    </div>
  );
}
