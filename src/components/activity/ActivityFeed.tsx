'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    MessageSquare,
    Mail,
    Phone,
    FileText,
    User,
    Clock,
    ChevronDown,
    Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityLog, ActivityActionType, actionColors } from '@/types/notifications';

const actionIcons: Record<ActivityActionType, typeof Plus> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    status_change: RefreshCw,
    comment: MessageSquare,
    email: Mail,
    call: Phone,
    note: FileText,
};

interface ActivityFeedProps {
    modelType: string;
    modelId: string;
    showCommentBox?: boolean;
}

export default function ActivityFeed({ modelType, modelId, showCommentBox = true }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [filter, setFilter] = useState<'all' | 'changes' | 'comments'>('all');

    useEffect(() => {
        fetchActivities();
    }, [modelType, modelId]);

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/activity-logs?model_type=${modelType}&model_id=${modelId}`);
            const data = await response.json();
            setActivities(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendComment = async () => {
        if (!comment.trim()) return;

        setIsSending(true);
        try {
            await fetch('/api/activity-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_type: modelType,
                    model_id: modelId,
                    action_type: 'comment',
                    title: 'تعليق جديد',
                    description: comment,
                    user_name: 'أحمد محمد', // TODO: Get from auth
                }),
            });
            setComment('');
            fetchActivities();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSending(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} د`;
        if (diffHours < 24) return `منذ ${diffHours} س`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    const filteredActivities = activities.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'changes') return ['create', 'update', 'delete', 'status_change'].includes(a.action_type);
        if (filter === 'comments') return ['comment', 'note'].includes(a.action_type);
        return true;
    });

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    <h3 className="font-semibold">سجل النشاط</h3>
                    <span className="text-xs text-muted-foreground">({activities.length})</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    {(['all', 'changes', 'comments'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1 rounded-lg transition-colors",
                                filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            )}
                        >
                            {f === 'all' ? 'الكل' : f === 'changes' ? 'التغييرات' : 'التعليقات'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment Box */}
            {showCommentBox && (
                <div className="p-4 border-b border-border">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            AM
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="اكتب تعليقاً أو ملاحظة..."
                                rows={2}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={sendComment}
                                    disabled={isSending || !comment.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                                >
                                    <Send size={14} />
                                    {isSending ? 'جاري الإرسال...' : 'إرسال'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Timeline */}
            <div className="max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">لا يوجد نشاط بعد</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute right-7 top-0 bottom-0 w-0.5 bg-border" />

                        {filteredActivities.map((activity, index) => {
                            const Icon = actionIcons[activity.action_type] || FileText;
                            const color = actionColors[activity.action_type] || 'slate';
                            const userInitials = activity.user_name
                                ? activity.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                : 'N';

                            return (
                                <div key={activity.id} className="relative flex gap-4 p-4 hover:bg-muted/30 transition-colors">
                                    {/* User Avatar with Action Icon */}
                                    <div className="relative flex-shrink-0 z-10">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm border-2 border-background">
                                            {userInitials}
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background",
                                            activity.action_type === 'create' && "bg-emerald-500 text-white",
                                            activity.action_type === 'update' && "bg-blue-500 text-white",
                                            activity.action_type === 'delete' && "bg-red-500 text-white",
                                            activity.action_type === 'status_change' && "bg-purple-500 text-white",
                                            activity.action_type === 'comment' && "bg-sky-500 text-white",
                                            activity.action_type === 'note' && "bg-slate-500 text-white",
                                            !['create', 'update', 'delete', 'status_change', 'comment', 'note'].includes(activity.action_type) && "bg-gray-500 text-white"
                                        )}>
                                            <Icon size={10} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="font-semibold text-sm text-primary">
                                                    {activity.user_name || 'النظام'}
                                                </span>
                                                <span className="text-sm text-foreground mr-2">
                                                    {activity.title}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded">
                                                {getTimeAgo(activity.created_at)}
                                            </span>
                                        </div>

                                        {activity.description && (
                                            <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-lg">
                                                {activity.description}
                                            </p>
                                        )}

                                        {/* Changes */}
                                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {Object.entries(activity.changes).map(([field, change]) => (
                                                    <div key={field} className="text-xs bg-muted/50 rounded px-2 py-1 inline-block ml-2">
                                                        <span className="text-muted-foreground">{field}:</span>
                                                        <span className="line-through text-red-500 mx-1">{String(change.old)}</span>
                                                        <span className="text-emerald-600">→ {String(change.new)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
