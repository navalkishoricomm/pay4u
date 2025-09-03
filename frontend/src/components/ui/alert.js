import React from 'react';

export const Alert = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    success: 'border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700'
  };
  
  return (
    <div
      className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  );
};