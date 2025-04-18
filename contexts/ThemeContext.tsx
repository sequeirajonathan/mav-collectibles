"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Default context value
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with light theme for consistent server-side rendering
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme after mount
  useEffect(() => {
    // Mark as mounted first
    setMounted(true);
    
    // Then check localStorage
    try {
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme === "dark") {
        setTheme("dark");
        // Apply dark mode class immediately
        document.documentElement.classList.add("dark");
      } else {
        // Ensure light mode
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Apply theme changes after initial load
  useEffect(() => {
    if (!mounted) return;
    
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      // Save theme preference
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 