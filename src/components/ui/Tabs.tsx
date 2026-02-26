'use client';

import { useState } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export default function Tabs({ tabs, defaultTab, onChange, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  const handleClick = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className={`flex bg-highlight/20 rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`
            flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer
            ${active === tab.key
              ? 'bg-primary text-tt-white shadow-sm'
              : 'text-foreground hover:text-primary'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
