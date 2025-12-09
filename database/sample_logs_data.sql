-- ============================================
-- Sample Login & Security Logs Data
-- شغل هذا الملف بعد تشغيل:
-- 1. security_logs.sql
-- 2. notifications_activity_log.sql
-- ============================================

-- إدخال سجلات تسجيل دخول تجريبية
INSERT INTO login_logs (company_id, user_id, user_email, user_name, event_type, status, ip_address, user_agent, device_type, browser, os, created_at) VALUES
('33333333-3333-3333-3333-333333333333', NULL, 'ahmed@example.com', 'أحمد محمد', 'login', 'success', '197.37.45.120', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'desktop', 'Chrome', 'Windows', NOW() - INTERVAL '5 minutes'),
('33333333-3333-3333-3333-333333333333', NULL, 'ahmed@example.com', 'أحمد محمد', 'login', 'success', '197.37.45.120', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'desktop', 'Chrome', 'Windows', NOW() - INTERVAL '2 hours'),
('33333333-3333-3333-3333-333333333333', NULL, 'sara@example.com', 'سارة أحمد', 'login', 'success', '41.233.12.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1.15', 'mobile', 'Safari', 'iOS', NOW() - INTERVAL '1 hour'),
('33333333-3333-3333-3333-333333333333', NULL, 'mohamed@example.com', 'محمد علي', 'login', 'failed', '102.45.67.89', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120.0', 'desktop', 'Firefox', 'Windows', NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', NULL, 'ahmed@example.com', 'أحمد محمد', 'logout', 'success', '197.37.45.120', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 'desktop', 'Chrome', 'Windows', NOW() - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', NULL, 'unknown@hacker.com', 'Unknown', 'login_failed', 'failed', '185.220.101.34', 'HackBot/1.0', 'desktop', 'unknown', 'unknown', NOW() - INTERVAL '45 minutes'),
('33333333-3333-3333-3333-333333333333', NULL, 'sara@example.com', 'سارة أحمد', 'password_reset', 'success', '41.233.12.55', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1.15', 'mobile', 'Safari', 'iOS', NOW() - INTERVAL '3 days'),
('33333333-3333-3333-3333-333333333333', NULL, 'admin@company.com', 'المدير العام', 'login', 'success', '156.192.45.23', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15', 'desktop', 'Safari', 'macOS', NOW() - INTERVAL '15 minutes');

-- إدخال سجلات أمان تجريبية
INSERT INTO security_logs (company_id, user_id, user_name, event_type, description, ip_address, severity, created_at) VALUES
('33333333-3333-3333-3333-333333333333', NULL, 'أحمد محمد', 'password_change', 'تم تغيير كلمة المرور بنجاح', '197.37.45.120', 'high', NOW() - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', NULL, 'المدير العام', 'role_change', 'تم تغيير دور المستخدم سارة أحمد إلى محاسب', '156.192.45.23', 'high', NOW() - INTERVAL '2 days'),
('33333333-3333-3333-3333-333333333333', NULL, 'سارة أحمد', 'data_export', 'تم تصدير تقرير المبيعات الشهري', '41.233.12.55', 'medium', NOW() - INTERVAL '3 hours'),
('33333333-3333-3333-3333-333333333333', NULL, 'النظام', 'suspicious_activity', 'محاولات دخول فاشلة متكررة من IP: 185.220.101.34', '185.220.101.34', 'critical', NOW() - INTERVAL '45 minutes'),
('33333333-3333-3333-3333-333333333333', NULL, 'أحمد محمد', '2fa_enabled', 'تم تفعيل التحقق الثنائي', '197.37.45.120', 'medium', NOW() - INTERVAL '5 days'),
('33333333-3333-3333-3333-333333333333', NULL, 'محمد علي', 'settings_change', 'تم تحديث إعدادات الشركة', '102.45.67.89', 'low', NOW() - INTERVAL '1 week');
