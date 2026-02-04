import { useState, useEffect } from 'react';
import { Plus, Server, Wifi, WifiOff, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deviceService } from '@/services/api';
import { RegisterDeviceModal } from '@/components/inventory/RegisterDeviceModal';

interface Device {
    id: string;
    type: string;
    status: string;
    last_seen: string;
}

export const DeviceInventory = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ONLINE' | 'OFFLINE'>('all');

    const fetchDevices = async () => {
        try {
            const data = await deviceService.getDevices();
            setDevices(data);
        } catch (error) {
            console.error("Failed to fetch devices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    // Filter devices based on search and status
    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
    const offlineCount = devices.filter(d => d.status === 'OFFLINE').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-h1 text-text-primary">Device Inventory</h1>
                    <p className="text-body text-text-secondary mt-1">
                        {devices.length} devices registered • {onlineCount} online
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Register Device
                </button>
            </header>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search devices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-bg-1 border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan transition-colors"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-bg-1 border border-border-subtle rounded-lg p-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={cn(
                            "px-3 h-8 rounded-md text-body-sm font-medium transition-colors",
                            statusFilter === 'all' ? "bg-bg-2 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        All ({devices.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('ONLINE')}
                        className={cn(
                            "px-3 h-8 rounded-md text-body-sm font-medium transition-colors flex items-center gap-1.5",
                            statusFilter === 'ONLINE' ? "bg-bg-2 text-success" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        Online ({onlineCount})
                    </button>
                    <button
                        onClick={() => setStatusFilter('OFFLINE')}
                        className={cn(
                            "px-3 h-8 rounded-md text-body-sm font-medium transition-colors flex items-center gap-1.5",
                            statusFilter === 'OFFLINE' ? "bg-bg-2 text-error" : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-error" />
                        Offline ({offlineCount})
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg bg-bg-3" />
                                <div className="w-16 h-6 rounded-full bg-bg-3" />
                            </div>
                            <div className="h-5 w-32 bg-bg-3 rounded mb-2" />
                            <div className="h-4 w-20 bg-bg-3 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredDevices.length === 0 ? (
                <div className="card border-dashed flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                        <Server className="w-8 h-8 text-text-tertiary" />
                    </div>
                    {devices.length === 0 ? (
                        <>
                            <h3 className="text-h3 text-text-primary mb-2">No Devices Found</h3>
                            <p className="text-body text-text-secondary max-w-sm mb-4">
                                You haven't registered any devices yet. Add your first device to start monitoring.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                            >
                                <Plus className="w-4 h-4" />
                                Register First Device
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-h3 text-text-primary mb-2">No Results</h3>
                            <p className="text-body text-text-secondary">
                                No devices match your search criteria.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((device) => (
                        <div
                            key={device.id}
                            className="card hover:border-cyan/30 transition-colors cursor-pointer group"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-lg bg-cyan-soft border border-cyan/20 flex items-center justify-center">
                                    <Server className="w-6 h-6 text-cyan" />
                                </div>
                                <span className={cn(
                                    "badge flex items-center gap-1.5",
                                    device.status === 'ONLINE' ? "badge-success" : "badge-error"
                                )}>
                                    {device.status === 'ONLINE' ? (
                                        <Wifi className="w-3 h-3" />
                                    ) : (
                                        <WifiOff className="w-3 h-3" />
                                    )}
                                    {device.status}
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-body font-semibold text-text-primary mb-1 group-hover:text-cyan transition-colors">
                                {device.id}
                            </h3>
                            <p className="label-uppercase text-text-tertiary mb-4">
                                {device.type}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center gap-2 text-caption text-text-tertiary pt-3 border-t border-border-subtle">
                                <Clock className="w-3.5 h-3.5" />
                                Last seen: {new Date(device.last_seen || Date.now()).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <RegisterDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDevices}
            />
        </div>
    );
};
