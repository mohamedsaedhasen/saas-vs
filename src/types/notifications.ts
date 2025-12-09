// ============================================
// Notifications & Activity Log Types
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'action';
export type NotificationCategory = 'order' | 'payment' | 'inventory' | 'shipping' | 'system';
export type ActivityActionType = 'create' | 'update' | 'delete' | 'status_change' | 'comment' | 'email' | 'call' | 'note';
export type CommentType = 'comment' | 'note' | 'email' | 'call' | 'meeting';
export type ActivityStatus = 'pending' | 'done' | 'cancelled' | 'overdue';

export interface Notification {
    id: string;
    company_id: string;
    user_id?: string;
    type: NotificationType;
    category?: NotificationCategory;
    title: string;
    message?: string;
    icon?: string;
    link_type?: string;
    link_id?: string;
    link_url?: string;
    is_read: boolean;
    read_at?: string;
    priority: number;
    expires_at?: string;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    company_id: string;
    user_id?: string;
    user_name?: string;
    model_type: string;
    model_id: string;
    model_name?: string;
    action_type: ActivityActionType;
    title: string;
    description?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    metadata?: Record<string, unknown>;
    importance: 'low' | 'normal' | 'high';
    created_at: string;
}

export interface Comment {
    id: string;
    company_id: string;
    user_id?: string;
    user_name: string;
    user_avatar?: string;
    model_type: string;
    model_id: string;
    comment_type: CommentType;
    content: string;
    attachments?: Array<{
        name: string;
        url: string;
        type: string;
        size: number;
    }>;
    mentions?: Array<{
        user_id: string;
        name: string;
    }>;
    parent_id?: string;
    reactions?: Record<string, string[]>;
    is_internal: boolean;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
}

export interface ScheduledActivity {
    id: string;
    company_id: string;
    model_type: string;
    model_id: string;
    activity_type: string;
    title: string;
    description?: string;
    due_date: string;
    due_time?: string;
    assigned_to?: string;
    assigned_name?: string;
    created_by?: string;
    status: ActivityStatus;
    completed_at?: string;
    reminder_minutes?: number;
    reminder_sent: boolean;
    created_at: string;
    updated_at: string;
}

// Action Icons Map
export const actionIcons: Record<ActivityActionType, string> = {
    create: 'Plus',
    update: 'Edit',
    delete: 'Trash',
    status_change: 'RefreshCw',
    comment: 'MessageSquare',
    email: 'Mail',
    call: 'Phone',
    note: 'FileText',
};

// Action Colors Map
export const actionColors: Record<ActivityActionType, string> = {
    create: 'emerald',
    update: 'blue',
    delete: 'red',
    status_change: 'purple',
    comment: 'sky',
    email: 'amber',
    call: 'green',
    note: 'slate',
};
