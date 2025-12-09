'use client';

import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface DeviceInfo {
    fingerprint: string;
    browser: string;
    os: string;
    platform: string;
    screenResolution: string;
    timezone: string;
    language: string;
}

export function useDeviceFingerprint() {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getFingerprint() {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();

                // Get additional device info
                const info: DeviceInfo = {
                    fingerprint: result.visitorId,
                    browser: getBrowserName(),
                    os: getOSName(),
                    platform: navigator.platform || 'Unknown',
                    screenResolution: `${window.screen.width}x${window.screen.height}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language,
                };

                setDeviceInfo(info);
            } catch (error) {
                console.error('Error getting device fingerprint:', error);
            } finally {
                setIsLoading(false);
            }
        }

        getFingerprint();
    }, []);

    return { deviceInfo, isLoading };
}

function getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
}

function getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
}

// Helper function to get device display name
export function getDeviceDisplayName(info: DeviceInfo): string {
    return `${info.browser} على ${info.os}`;
}
