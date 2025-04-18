"use client";

import { useEffect, useState } from "react";
import { Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  // Only show after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <div className="w-10 h-10" />;
  }

  return (
    <button 
      className="p-2 rounded-full text-white hover:bg-brand-blue-dark/50"
      aria-label="Light mode not available"
    >
      <Sun size={20} className="text-brand-gold" />
    </button>
  );
} 