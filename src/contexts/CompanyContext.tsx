'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Branch {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    is_headquarters: boolean;
}

interface Company {
    id: string;
    code?: string;
    name: string;
    name_en?: string;
    name_ar?: string;
    logo_url?: string;
    currency?: string;
    settings?: {
        currency?: string;
        currency_symbol?: string;
        vat_enabled?: boolean;
        vat_rate?: number;
    };
}

interface UserRole {
    id: string;
    name: string;
    name_ar?: string;
    is_super_admin: boolean;
}

interface CompanyContextType {
    company: Company | null;
    companies: Company[];
    branch: Branch | null;
    branches: Branch[];
    role: UserRole | null;
    isLoading: boolean;
    isOwner: boolean;
    setCompany: (company: Company) => void;
    setBranch: (branch: Branch) => void;
    refreshCompanies: () => Promise<void>;
    refreshBranches: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
    company: null,
    companies: [],
    branch: null,
    branches: [],
    role: null,
    isLoading: true,
    isOwner: false,
    setCompany: () => { },
    setBranch: () => { },
    refreshCompanies: async () => { },
    refreshBranches: async () => { },
});

export function useCompany() {
    return useContext(CompanyContext);
}

export function CompanyProvider({ children }: { children: ReactNode }) {
    const [company, setCompanyState] = useState<Company | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [branch, setBranchState] = useState<Branch | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load companies on mount
    useEffect(() => {
        refreshCompanies();
    }, []);

    // Load branches when company changes
    useEffect(() => {
        if (company?.id) {
            refreshBranches();
            loadUserRole();
        }
    }, [company?.id]);

    // Load saved selections from localStorage
    useEffect(() => {
        const savedCompanyId = localStorage.getItem('selected_company_id');
        if (savedCompanyId && companies.length > 0) {
            const found = companies.find(c => c.id === savedCompanyId);
            if (found) {
                setCompanyState(found);
            } else if (companies.length > 0) {
                setCompanyState(companies[0]);
            }
        } else if (companies.length > 0 && !company) {
            setCompanyState(companies[0]);
        }
    }, [companies]);

    // Load saved branch
    useEffect(() => {
        const savedBranchId = localStorage.getItem('selected_branch_id');
        if (savedBranchId && branches.length > 0) {
            const found = branches.find(b => b.id === savedBranchId);
            if (found) {
                setBranchState(found);
            } else {
                // Select headquarters by default
                const hq = branches.find(b => b.is_headquarters);
                setBranchState(hq || branches[0]);
            }
        } else if (branches.length > 0 && !branch) {
            const hq = branches.find(b => b.is_headquarters);
            setBranchState(hq || branches[0]);
        }
    }, [branches]);

    const refreshCompanies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/companies');
            const data = await response.json();
            setCompanies(data || []);

            if (data.length > 0 && !company) {
                const savedId = localStorage.getItem('selected_company_id');
                const found = data.find((c: Company) => c.id === savedId);
                setCompanyState(found || data[0]);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBranches = async () => {
        if (!company?.id) return;

        try {
            const response = await fetch(`/api/branches?company_id=${company.id}`);
            const data = await response.json();
            setBranches(data || []);
        } catch (error) {
            console.error('Error loading branches:', error);
        }
    };

    const loadUserRole = async () => {
        if (!company?.id) return;

        try {
            const response = await fetch(`/api/auth/me?company_id=${company.id}`);
            if (response.ok) {
                const data = await response.json();
                setRole(data.role || null);
                setIsOwner(data.is_owner || false);
            }
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    };

    const setCompany = (newCompany: Company) => {
        setCompanyState(newCompany);
        localStorage.setItem('selected_company_id', newCompany.id);
        document.cookie = `company_id=${newCompany.id}; path=/; max-age=31536000`;
        // Reset branch when company changes
        setBranchState(null);
        localStorage.removeItem('selected_branch_id');
    };

    const setBranch = (newBranch: Branch) => {
        setBranchState(newBranch);
        localStorage.setItem('selected_branch_id', newBranch.id);
        document.cookie = `branch_id=${newBranch.id}; path=/; max-age=31536000`;
    };

    return (
        <CompanyContext.Provider value={{
            company,
            companies,
            branch,
            branches,
            role,
            isLoading,
            isOwner,
            setCompany,
            setBranch,
            refreshCompanies,
            refreshBranches,
        }}>
            {children}
        </CompanyContext.Provider>
    );
}
