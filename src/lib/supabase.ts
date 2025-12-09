import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types (سيتم تحديثها لاحقاً باستخدام supabase gen types)
export type Database = {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    email: string;
                    phone: string | null;
                    logo_url: string | null;
                    settings: Record<string, unknown>;
                    subscription_plan: string;
                    subscription_status: string;
                    subscription_ends_at: string | null;
                    enabled_modules: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
            };
            users: {
                Row: {
                    id: string;
                    tenant_id: string | null;
                    email: string;
                    password_hash: string | null;
                    full_name: string;
                    full_name_en: string | null;
                    phone: string | null;
                    avatar_url: string | null;
                    role: string;
                    is_owner: boolean;
                    is_active: boolean;
                    preferences: Record<string, unknown>;
                    email_verified_at: string | null;
                    last_login_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            companies: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    name_en: string | null;
                    legal_name: string | null;
                    tax_number: string | null;
                    commercial_register: string | null;
                    address: string | null;
                    city: string | null;
                    country: string;
                    phone: string | null;
                    email: string | null;
                    website: string | null;
                    logo_url: string | null;
                    settings: Record<string, unknown>;
                    is_default: boolean;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['companies']['Insert']>;
            };
            branches: {
                Row: {
                    id: string;
                    company_id: string;
                    name: string;
                    name_en: string | null;
                    code: string | null;
                    address: string | null;
                    city: string | null;
                    phone: string | null;
                    email: string | null;
                    manager_id: string | null;
                    shopify_store_url: string | null;
                    shopify_api_key: string | null;
                    shopify_api_secret: string | null;
                    shopify_access_token: string | null;
                    shopify_last_sync_at: string | null;
                    is_main: boolean;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['branches']['Insert']>;
            };
            // المزيد من الأنواع سيتم إضافتها...
        };
    };
};
