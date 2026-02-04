import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState({ user: null, token: null, isAuthenticated: false });
    }, []);

    useEffect(() => {
        const initAuth = () => {
            try {
                const savedToken = localStorage.getItem('auth_token');
                const savedUser = localStorage.getItem('auth_user');

                if (savedToken && savedUser) {
                    setState({
                        token: savedToken,
                        user: JSON.parse(savedUser),
                        isAuthenticated: true,
                    });
                }
            } catch (err) {
                console.error("Failed to rehydrate auth state:", err);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [logout]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        setState({
            token: newToken,
            user: newUser,
            isAuthenticated: true,
        });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
