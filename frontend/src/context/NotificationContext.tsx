import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationItem } from '@/components/ui/notification';

export type NotificationType = 'info' | 'warning' | 'critical';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    deviceId?: string;
    timestamp: number;
}

interface NotificationContextType {
    showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const timestamp = Date.now();

        setNotifications((prev) => {
            // Basic De-duplication: Don't show the same alert for the same device within 5 seconds
            const isDuplicate = prev.some(
                (existing) =>
                    existing.deviceId === n.deviceId &&
                    existing.message === n.message &&
                    timestamp - existing.timestamp < 5000
            );

            if (isDuplicate) return prev;

            return [...prev, { ...n, id, timestamp }];
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, removeNotification }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none w-full max-w-sm">
                <AnimatePresence mode="popLayout">
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={() => removeNotification(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
