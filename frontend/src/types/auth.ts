import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(5, "Password must be at least 5 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface User {
    email: string;
    is_admin: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}
