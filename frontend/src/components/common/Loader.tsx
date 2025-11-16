import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  variant?: 'primary' | 'secondary' | 'white';
}

export default function Loader({
  size = 'md',
  text,
  fullScreen = false,
  variant = 'primary'
}: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-emerald-600',
    white: 'text-white',
  };

  const spinner = (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[variant]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-emerald-200 max-w-md w-full mx-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-2xl inline-block mb-6 shadow-lg">
            <div className="relative">
              {spinner}
            </div>
          </div>
          {text && <p className="text-gray-600 text-lg font-medium">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {spinner}
      {text && <p className={`mt-3 text-sm ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>{text}</p>}
    </div>
  );
}

// Composant de skeleton pour les tableaux
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-10 mb-4 rounded"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 mb-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="bg-gray-100 h-8 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Composant de skeleton pour les cartes
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="bg-gray-200 h-4 w-20 mb-4 rounded"></div>
          <div className="bg-gray-300 h-8 w-16 mb-2 rounded"></div>
          <div className="bg-gray-100 h-3 w-24 rounded"></div>
        </div>
      ))}
    </div>
  );
}
