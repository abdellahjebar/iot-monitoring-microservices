import React from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen bg-bg-0 text-text-primary overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Optional: Top Bar would go here */}

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="animate-fade-in max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
