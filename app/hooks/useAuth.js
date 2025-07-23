import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import sessionManager from '../utils/sessionManager';

/**
 * Hook to manage authentication state and session validation
 */
export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const validateSession = async () => {
            try {
                const userData = sessionManager.getUserData();

                if (userData) {
                    // Validate session with server
                    const isValid = await sessionManager.validateSession();

                    if (isValid) {
                        setUser(userData);
                        setIsAuthenticated(true);
                    } else {
                        sessionManager.clearSession();
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error validating session:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        }; validateSession();

        // Listen to session changes
        const unsubscribe = sessionManager.addListener((event, data) => {
            if (event === 'login') {
                setUser(data);
                setIsAuthenticated(true);
                setIsLoading(false);
            } else if (event === 'logout') {
                setUser(null);
                setIsAuthenticated(false);
            }
        });

        // Listen for immediate session invalidation
        const handleSessionInvalidated = () => {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        };

        // Listen for user banned event
        const handleUserBanned = () => {
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        };

        window.addEventListener('session_invalidated', handleSessionInvalidated);
        window.addEventListener('user_banned', handleUserBanned);

        return () => {
            unsubscribe();
            window.removeEventListener('session_invalidated', handleSessionInvalidated);
            window.removeEventListener('user_banned', handleUserBanned);
        };
    }, []);

    const logout = async () => {
        await sessionManager.logout();
        router.push('/');
    };

    return {
        isAuthenticated,
        isLoading,
        user,
        logout,
        isAdmin: user?.role === 'admin'
    };
};

/**
 * Component to protect routes that require authentication
 */
export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/sign-in');
                return;
            }

            if (requireAdmin && user?.role !== 'admin') {
                router.push('/');
                return;
            }
        }
    }, [isAuthenticated, isLoading, user, requireAdmin, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return null;
    }

    return children;
};

/**
 * Component to redirect authenticated users away from auth pages
 */
export const GuestRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return null;
    }

    return children;
};
