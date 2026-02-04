import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    HardDrive,
    Bell,
    LogOut,
    Shield,
    Activity,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

const menuItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: HardDrive, label: 'Devices', path: '/inventory' },
    { icon: Activity, label: 'Analytics', path: '/analytics' },
    { icon: Bell, label: 'Alerts', path: '/incidents' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "h-screen flex flex-col bg-bg-0 border-r border-border-subtle transition-all duration-300",
                collapsed ? "w-16" : "w-60"
            )}
        >
            {/* Logo */}
            <div className="h-14 flex items-center gap-3 px-4 border-b border-border-subtle">
                <div className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-black" />
                </div>
                {!collapsed && (
                    <span className="font-semibold text-text-primary text-sm tracking-tight">
                        IoT Command
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 h-10 rounded-md transition-all duration-150",
                                "text-text-secondary hover:text-text-primary hover:bg-bg-2",
                                isActive && "bg-bg-2 text-text-primary border-l-2 border-cyan"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-cyan")} />
                            {!collapsed && (
                                <span className="text-body-sm font-medium truncate">{item.label}</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-2 border-t border-border-subtle">
                {!collapsed && (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-bg-1 mb-2">
                        <div className="w-8 h-8 rounded-full bg-bg-3 border border-border-default flex items-center justify-center text-xs font-semibold text-text-primary">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-body-sm font-medium text-text-primary truncate">
                                {user?.email || 'user@example.com'}
                            </p>
                            <p className="text-caption text-text-tertiary">Administrator</p>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 h-10 rounded-md transition-all duration-150",
                        "text-error hover:bg-error-soft"
                    )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-body-sm font-medium">Logout</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 h-10 mt-2 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-2 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="text-body-sm">Collapse</span>}
                </button>
            </div>
        </aside>
    );
};
