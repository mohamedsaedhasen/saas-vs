'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Permission {
    module: string;
    action: 'read' | 'write' | 'delete' | 'export' | 'import';
}

interface PermissionsContextType {
    userId: string | null;
    roleName: string | null;
    permissions: Permission[];
    modules: string[];
    isLoading: boolean;
    hasPermission: (module: string, action?: string) => boolean;
    canAccess: (module: string) => boolean;
    refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
    userId: null,
    roleName: null,
    permissions: [],
    modules: [],
    isLoading: true,
    hasPermission: () => false,
    canAccess: () => false,
    refresh: async () => { },
});

export function usePermissions() {
    return useContext(PermissionsContext);
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null);
    const [roleName, setRoleName] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/permissions');
            if (response.ok) {
                const data = await response.json();
                setUserId(data.userId);
                setRoleName(data.roleName);
                setPermissions(data.permissions || []);
                setModules(data.modules || []);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const hasPermission = (module: string, action: string = 'read'): boolean => {
        // Admin has all permissions
        if (roleName === 'admin' || roleName === 'مدير النظام') return true;
        return permissions.some((p) => p.module === module && p.action === action);
    };

    const canAccess = (module: string): boolean => {
        // Admin has all access
        if (roleName === 'admin' || roleName === 'مدير النظام') return true;
        return modules.includes(module);
    };

    return (
        <PermissionsContext.Provider
            value={{
                userId,
                roleName,
                permissions,
                modules,
                isLoading,
                hasPermission,
                canAccess,
                refresh,
            }}
        >
            {children}
        </PermissionsContext.Provider>
    );
}
