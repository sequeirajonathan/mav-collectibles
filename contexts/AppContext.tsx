"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your context state
interface AppContextState {
  cart: CartItem[];
  user: User | null;
  isAuthenticated: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  login: (userData: User) => void;
  logout: () => void;
}

// Define types for your data
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Create the context with a default value
const AppContext = createContext<AppContextState | undefined>(undefined);

// Create a provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Cart functions
  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity } 
            : cartItem
        );
      } else {
        // Add new item
        return [...prevCart, item];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Auth functions
  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  // Create the context value object
  const contextValue: AppContextState = {
    cart,
    user,
    isAuthenticated: !!user,
    addToCart,
    removeFromCart,
    clearCart,
    login,
    logout
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 