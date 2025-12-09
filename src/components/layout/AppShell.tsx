'use client';

import { useState, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    setIsOpen: () => { },
    isCollapsed: false,
    setIsCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen, isCollapsed, setIsCollapsed }}>
            <div className="min-h-screen bg-background text-foreground" dir="rtl">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content - Responsive margin based on sidebar state */}
                <div
                    className={cn(
                        "min-h-screen transition-all duration-300 ease-in-out",
                        // On mobile: no margin (sidebar is overlay)
                        // On desktop: margin based on collapsed state
                        isCollapsed ? "lg:mr-20" : "lg:mr-64"
                    )}
                >
                    <Header />
                    <main className="p-4 md:p-6">
                        <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}
