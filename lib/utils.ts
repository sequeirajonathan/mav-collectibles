import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Create a simpler error boundary that doesn't use JSX
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createErrorBoundary(Component: React.ComponentType<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ErrorBoundary(props: any) {
    try {
      // Use createElement instead of calling the component directly
      return React.createElement(Component, props);
    } catch (error) {
      console.error("Error in component:", error);
      return null; // Or return a simple error message
    }
  };
}
