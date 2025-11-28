import React from 'react';

interface ThreeDButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  label: string;
  icon?: React.ReactNode;
}

const ThreeDButton: React.FC<ThreeDButtonProps> = ({ 
  variant = 'primary', 
  label, 
  icon, 
  className = '', 
  disabled,
  ...props 
}) => {
  let baseColor = 'bg-blue-500';

  if (variant === 'secondary') {
    baseColor = 'bg-gray-100 text-gray-800';
  } else if (variant === 'danger') {
    baseColor = 'bg-red-500';
  } else if (variant === 'success') {
    baseColor = 'bg-green-500';
  } else if (variant === 'warning') {
    baseColor = 'bg-yellow-400 text-yellow-900';
  }

  return (
    <button
      disabled={disabled}
      className={`
        ${baseColor} 
        text-white 
        font-bold 
        py-2 px-4 
        rounded-xl
        border-b-4 
        ${variant === 'secondary' ? 'border-gray-400' : 
          variant === 'danger' ? 'border-red-700' :
          variant === 'success' ? 'border-green-700' :
          variant === 'warning' ? 'border-yellow-600' :
          'border-blue-700'
        }
        active:border-b-0 
        active:translate-y-1 
        transition-all 
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4
        ${className}
      `}
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default ThreeDButton;