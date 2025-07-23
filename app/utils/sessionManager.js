import Cookies from 'js-cookie';

class SessionManager {
    constructor() {
        this.eventListeners = new Set();
        this.setupUnloadListener();
    }

    // Get token from cookies
    getToken() {
        return Cookies.get('token');
    }

    // Get user data from cookies
    getUserData() {
        const username = Cookies.get('username');
        const token = this.getToken();

        if (!username || !token) return null;

        try {
            // Decode JWT to get user info
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                return {
                    id: payload.id,
                    username: decodeURIComponent(username),
                    role: payload.role,
                    sessionToken: payload.sessionToken
                };
            }
        } catch (error) {
            console.error('Error parsing token:', error);
        }

        return null;
    }

    // Set user session
    setSession(token, userData, rememberMe = false) {
        const expires = rememberMe ? 30 : 1; // 30 days if remember me, 1 day otherwise

        Cookies.set('token', token, { expires });
        Cookies.set('username', encodeURIComponent(userData.name), { expires });

        // Notify listeners of login
        this.notifyListeners('login', userData);
    }    // Clear session
    clearSession() {
        // Remove all auth-related cookies
        Cookies.remove('token');
        Cookies.remove('username');
        Cookies.remove('user');

        // Clear localStorage
        localStorage.removeItem('lastReadTime');
        localStorage.setItem('userSignOut', Date.now().toString());

        // Notify listeners of logout immediately
        this.notifyListeners('logout');

        // Trigger storage event for immediate updates across components
        window.dispatchEvent(new Event('storage'));

        // Trigger custom auth state change event
        window.dispatchEvent(new CustomEvent('auth_state_change'));
    }

    // Make authenticated API request
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();

        if (!token) {
            throw new Error('No authentication token available');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);

            // Check if session is invalid or user is banned
            if (response.status === 401 || response.status === 403) {
                const data = await response.json();

                // Check if it's a session invalidation due to login from another device
                if (data.code === 'SESSION_INVALID') {
                    this.handleSessionInvalidation(data.message);
                    throw new Error('SESSION_INVALID');
                }

                // Check if user is banned
                if (data.code === 'USER_BANNED') {
                    this.handleUserBanned(data.message);
                    throw new Error('USER_BANNED');
                }
            }

            return response;
        } catch (error) {
            if (error.message === 'SESSION_INVALID' || error.message === 'USER_BANNED') {
                throw error;
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }    // Handle session invalidation
    handleSessionInvalidation(message) {
        // Clear current session
        this.clearSession();

        // Show notification to user
        this.showSessionInvalidationNotification(message);

        // Trigger storage event for immediate UI updates
        window.dispatchEvent(new Event('storage'));

        // Trigger custom event for components listening
        window.dispatchEvent(new CustomEvent('session_invalidated', {
            detail: { message }
        }));

        // Immediate redirect using window.location (more reliable than router)
        setTimeout(() => {
            window.location.replace('/sign-in');
        }, 1500); // Reduced to 1.5 seconds for faster redirect
    }

    // Handle user banned
    handleUserBanned(message) {
        // Clear current session
        this.clearSession();

        // Show ban notification to user
        this.showBanNotification(message);

        // Trigger storage event for immediate UI updates
        window.dispatchEvent(new Event('storage'));

        // Trigger custom event for components listening
        window.dispatchEvent(new CustomEvent('user_banned', {
            detail: { message }
        }));

        // Immediate redirect using window.location
        setTimeout(() => {
            window.location.replace('/sign-in');
        }, 2000); // 2 seconds to read the ban message
    }    // Show session invalidation notification
    showSessionInvalidationNotification(message) {
        // Create a toast notification
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 z-[9999] bg-red-500 text-white p-4 rounded-lg shadow-lg
            transform transition-all duration-300 ease-in-out
        `;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="font-arabicUI2">
                    <p class="font-semibold">تم تسجيل الخروج</p>
                    <p class="text-sm">${message || 'تم تسجيل الدخول من جهاز آخر'}</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Show immediately (no slide animation delay)
        notification.style.transform = 'translateX(0)';

        // Remove after 1.5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 1500);
    }

    // Show ban notification
    showBanNotification(message) {
        // Create a toast notification for banned users
        const notification = document.createElement('div');
        notification.className = `
            fixed top-4 right-4 z-[9999] bg-red-600 text-white p-4 rounded-lg shadow-lg
            transform transition-all duration-300 ease-in-out max-w-md
        `;
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path>
                    </svg>
                </div>
                <div class="font-arabicUI2">
                    <p class="font-semibold text-lg">تم حظر حسابك</p>
                    <p class="text-sm mt-1">${message || 'تم حظر حسابك من المنصة. يرجى التواصل مع الإدارة.'}</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Show immediately
        notification.style.transform = 'translateX(0)';

        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // Logout with server notification
    async logout() {
        try {
            // Notify server about logout
            await this.makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error during server logout:', error);
            // Continue with client-side logout even if server request fails
        }

        // Clear session
        this.clearSession();
    }

    // Add event listener for session changes
    addListener(callback) {
        this.eventListeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.eventListeners.delete(callback);
        };
    }

    // Notify all listeners
    notifyListeners(event, data = null) {
        this.eventListeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in session listener:', error);
            }
        });
    }

    // Check if user is logged in
    isAuthenticated() {
        const token = this.getToken();
        const userData = this.getUserData();
        return !!(token && userData);
    }

    // Check if user is admin
    isAdmin() {
        const userData = this.getUserData();
        return userData?.role === 'admin';
    }

    // Setup listener for page unload to handle cleanup
    setupUnloadListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                // Any cleanup needed before page unload
            });
        }
    }    // Validate current session with server
    async validateSession() {
        try {
            const response = await this.makeAuthenticatedRequest(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/validate`,
                { method: 'GET' }
            );

            if (response.ok) {
                return true;
            } else {
                this.clearSession();
                return false;
            }
        } catch (error) {
            if (error.message === 'SESSION_INVALID') {
                return false;
            }
            if (error.message === 'USER_BANNED') {
                return false; // Session validation fails for banned users
            }
            // For other errors, assume session is still valid to avoid unnecessary logouts
            console.error('Session validation network error:', error);
            return true;
        }
    }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
