import { z } from 'zod';

export const deviceCreateSchema = z.object({
    device_id: z.string().min(3, "Node ID must be at least 3 characters").max(20, "Node ID too long").regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric, underscores, or hyphens only"),
    category: z.enum(['SENSOR', 'GATEWAY', 'ACTUATOR']),
    location: z.string().default("Casablanca"),
    simulation_config: z.object({
        is_active: z.boolean(),
        temp_min: z.number().min(-50).max(150),
        temp_max: z.number().min(-50).max(150),
        humidity_min: z.number().min(0).max(100),
        humidity_max: z.number().min(0).max(100),
        update_interval: z.number().min(1).max(600),
    }),
}).refine(data => data.simulation_config.temp_min < data.simulation_config.temp_max, {
    message: "Min temperature must be less than max",
    path: ["simulation_config", "temp_max"],
});

export type DeviceCreateValues = z.infer<typeof deviceCreateSchema>;

export interface DeviceMetadata {
    id: string;
    category: 'SENSOR' | 'GATEWAY' | 'ACTUATOR';
    created_at: string;
    firmware: string;
    simulation_enabled: boolean;
}
