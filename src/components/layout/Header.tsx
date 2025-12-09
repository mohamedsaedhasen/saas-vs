'use client';

import { Search, Menu } from 'lucide-react';
import { useSidebar } from './AppShell';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import CompanySwitcher from '@/components/company/CompanySwitcher';

export function Header() {
    const { setIsOpen } = useSidebar();

    return (
        <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="lg:hidden p-2.5 hover:bg-muted rounded-lg transition-colors"
                >
                    <Menu size={22} />
                </button>

                {/* Company Switcher */}
                <CompanySwitcher />

                {/* Search */}
                <div className="hidden lg:flex items-center relative">
                    <Search className="absolute right-3 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث..."
                        className="pl-4 pr-10 py-2.5 rounded-xl border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background w-64 text-sm transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Notifications */}
                <NotificationsDropdown />

                {/* User Profile */}
                <div className="flex items-center gap-3 pr-2 md:pr-4 border-r border-border">
                    <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium">أحمد محمد</p>
                        <p className="text-xs text-muted-foreground">مدير النظام</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20">
                        AM
                    </div>
                </div>
            </div>
        </header>
    );
}
