import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);
  
  // Use controlled mode if value and onValueChange are provided
  const isControlled = value !== undefined && onValueChange !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;
  const setActiveTab = isControlled ? onValueChange : setInternalActiveTab;
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 text-muted-foreground gap-1 w-full shadow-inner border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const TabsTrigger = ({ children, value, className = '', ...props }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-3 text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer min-h-[44px] flex-1 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-[1.02] border border-blue-500' 
          : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 hover:shadow-md hover:transform hover:scale-[1.01] text-gray-600 bg-white/50'
      } ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children, value, className = '', ...props }) => {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};