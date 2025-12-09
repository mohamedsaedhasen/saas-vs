'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Sales Stats
// ============================================

export async function getSalesStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    // Orders this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const today = new Date().toISOString().split('T')[0];

    const { data: orders } = await supabase
        .from('sales_orders')
        .select('id, total, status, payment_status, order_date')
        .eq('company_id', COMPANY_ID)
        .gte('order_date', startOfMonth.toISOString().split('T')[0]);

    const totalOrders = orders?.length || 0;
    const totalSales = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const pendingOrders = orders?.filter(o => o.status === 'draft' || o.status === 'confirmed').length || 0;
    const shippedOrders = orders?.filter(o => o.status === 'shipped').length || 0;
    const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
    const todaySales = orders?.filter(o => o.order_date >= today).reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const unpaidAmount = orders?.filter(o => o.payment_status !== 'paid').reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    // Total customers
    const { count: totalCustomers } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'customer');

    return {
        totalOrders,
        totalSales,
        todaySales,
        pendingOrders,
        shippedOrders,
        completedOrders,
        unpaidAmount,
        totalCustomers: totalCustomers || 0,
    };
}

// ============================================
// Sales Orders
// ============================================

export async function getSalesOrders(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('sales_orders')
        .select(`
            id,
            order_number,
            order_date,
            customer_id,
            customer_name,
            customer_phone,
            subtotal,
            shipping_cost,
            total,
            status,
            payment_method,
            payment_status,
            fulfillment_status,
            tracking_number,
            cod_amount,
            created_at
        `)
        .eq('company_id', COMPANY_ID)
        .order('order_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data || [];
}

export async function getSalesOrderById(orderId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: order } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (!order) return null;

    const { data: items } = await supabase
        .from('sales_order_items')
        .select('*')
        .eq('order_id', orderId);

    return { ...order, items: items || [] };
}

// ============================================
// Customers
// ============================================

export async function getCustomers(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('contacts')
        .select(`
            id,
            code,
            name,
            name_en,
            phone,
            email,
            city,
            customer_group,
            total_orders,
            total_spent,
            balance:current_balance,
            credit_balance,
            credit_limit,
            is_active
        `)
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'customer')
        .order('name', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    return data || [];
}

export async function getCustomerById(customerId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: customer } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', customerId)
        .single();

    if (!customer) return null;

    // Get customer orders
    const { data: orders } = await supabase
        .from('sales_orders')
        .select('id, order_number, order_date, total, status, payment_status')
        .eq('customer_id', customerId)
        .order('order_date', { ascending: false })
        .limit(10);

    return { ...customer, orders: orders || [] };
}

export async function getCustomerStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('contacts')
        .select('id, total_spent, total_orders, customer_group')
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'customer');

    const total = data?.length || 0;
    const retail = data?.filter(c => c.customer_group === 'retail').length || 0;
    const wholesale = data?.filter(c => c.customer_group === 'wholesale').length || 0;
    const totalSpent = data?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;

    return { total, retail, wholesale, totalSpent };
}

// ============================================
// Daily Sales Report
// ============================================

export async function getDailySalesReport() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Today's orders
    const { data: todayOrders } = await supabase
        .from('sales_orders')
        .select(`
            id, total, payment_method, customer_name,
            items:sales_order_items(product_name, quantity, total_price)
        `)
        .eq('company_id', COMPANY_ID)
        .gte('order_date', today);

    // Yesterday's orders for comparison
    const { data: yesterdayOrders } = await supabase
        .from('sales_orders')
        .select('id, total')
        .eq('company_id', COMPANY_ID)
        .gte('order_date', yesterday)
        .lt('order_date', today);

    const totalSales = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const totalOrders = todayOrders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalItems = todayOrders?.reduce((sum, o) =>
        sum + ((o.items as Array<{ quantity: number }>)?.reduce((s, i) => s + i.quantity, 0) || 0), 0) || 0;

    const yesterdaySales = yesterdayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const salesChange = yesterdaySales > 0 ? ((totalSales - yesterdaySales) / yesterdaySales) * 100 : 0;
    const ordersChange = (yesterdayOrders?.length || 0) > 0
        ? ((totalOrders - (yesterdayOrders?.length || 0)) / (yesterdayOrders?.length || 1)) * 100
        : 0;

    const codOrders = todayOrders?.filter(o => o.payment_method === 'cod').length || 0;
    const paidOrders = todayOrders?.filter(o => o.payment_method === 'paid').length || 0;
    const creditOrders = todayOrders?.filter(o => o.payment_method === 'credit').length || 0;

    // Top products
    const productMap: Record<string, { name: string; quantity: number; total: number }> = {};
    todayOrders?.forEach(order => {
        (order.items as Array<{ product_name: string; quantity: number; total_price: number }>)?.forEach(item => {
            if (!productMap[item.product_name]) {
                productMap[item.product_name] = { name: item.product_name, quantity: 0, total: 0 };
            }
            productMap[item.product_name].quantity += item.quantity;
            productMap[item.product_name].total += item.total_price;
        });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Top customers
    const customerMap: Record<string, { name: string; orders: number; total: number }> = {};
    todayOrders?.forEach(order => {
        if (!customerMap[order.customer_name]) {
            customerMap[order.customer_name] = { name: order.customer_name, orders: 0, total: 0 };
        }
        customerMap[order.customer_name].orders++;
        customerMap[order.customer_name].total += order.total || 0;
    });
    const topCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 5);

    return {
        totalSales,
        totalOrders,
        averageOrderValue,
        totalItems,
        salesChange: Math.round(salesChange),
        ordersChange: Math.round(ordersChange),
        codOrders,
        paidOrders,
        creditOrders,
        topProducts,
        topCustomers,
    };
}
