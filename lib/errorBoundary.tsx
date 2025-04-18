import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createErrorBoundary(Component: React.ComponentType<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function ErrorBoundary(props: any) {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    );
  };
} 