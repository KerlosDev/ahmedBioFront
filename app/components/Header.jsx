'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import { useRouter } from 'next/navigation'
import { PiStudentBold } from "react-icons/pi";
import { TbMathPi } from "react-icons/tb";
import { TbMathFunction, TbMathSymbols } from "react-icons/tb";
import { PiMathOperationsBold } from "react-icons/pi";
import { RiMenu4Fill } from "react-icons/ri";
import { IoClose, IoNotifications, IoPersonCircle } from "react-icons/io5";
import NotificationButton from './NotificationButton';
import { LuUser, LuLogOut, LuUserCircle, LuChevronDown, LuLogIn, LuUserPlus } from 'react-icons/lu';
import sessionManager from '../utils/sessionManager';

const Header = () => {

    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false); const [unreadCount, setUnreadCount] = useState(0);
    const [username, setUsername] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [lastReadTime, setLastReadTime] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('lastReadTime') || '0';
        }
        return '0';
    });
    const [showMobileNotifications, setShowMobileNotifications] = useState(false); useEffect(() => {
        // Check if user is logged in on component mount
        checkUserLogin();

        // Set up session manager listener
        const unsubscribe = sessionManager.addListener((event, data) => {Z
            if (event === 'login') {
                checkUserLogin();
            } else if (event === 'logout') {
                setIsLoggedIn(false);
                setUsername('');
                setIsAdmin(false);
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        // Set up event listeners for auth state changes
        window.addEventListener('storage', checkUserLogin);
        window.addEventListener('auth_state_change', checkUserLogin);

        // Listen for session invalidation events
        const handleSessionInvalidated = (event) => {
            setIsLoggedIn(false);
            setUsername('');
            setIsAdmin(false);
            setNotifications([]);
            setUnreadCount(0);
        };
        window.addEventListener('session_invalidated', handleSessionInvalidated);

        // Custom event dispatch for login success
        const handleLoginSuccess = () => {
            checkUserLogin();
        };
        window.addEventListener('login_success', handleLoginSuccess);

        return () => {
            unsubscribe();
            window.removeEventListener('storage', checkUserLogin);
            window.removeEventListener('auth_state_change', checkUserLogin);
            window.removeEventListener('session_invalidated', handleSessionInvalidated);
            window.removeEventListener('login_success', handleLoginSuccess);
        };
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
            // Fetch notifications every 5 minutes
            const interval = setInterval(fetchNotifications, 300000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]); const checkUserLogin = () => {
        try {
            const userData = sessionManager.getUserData();

            if (userData) {
                setUsername(userData.username);
                setIsLoggedIn(true);
                setIsAdmin(userData.role === 'admin'|| userData.role === 'instructor');
                return;
            }

            setUsername('');
            setIsLoggedIn(false);
            setIsAdmin(false);
        } catch (error) {
            console.error("Error checking user login:", error);
            setUsername('');
            setIsLoggedIn(false);
            setIsAdmin(false);
        }
    }; const fetchNotifications = async () => {
        try {
            const response = await sessionManager.makeAuthenticatedRequest(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/recent`,
                {
                    method: 'GET'
                }
            );

            const data = await response.json();

            if (data.success && data.data) {
                const notifArray = data.data.map(n => ({
                    id: n._id,
                    message: n.message,
                    createdAt: n.createdAt,
                    updatedAt: n.updatedAt
                }));

                setNotifications(notifArray);

                // Count notifications created after last read time
                const unread = notifArray.filter(n =>
                    new Date(n.createdAt) > new Date(lastReadTime)
                ).length;
                setUnreadCount(unread);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            if (error.message === 'SESSION_INVALID') {
                // Session manager will handle this automatically
                return;
            }
            console.error("Error fetching notifications:", error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const handleNotificationOpen = () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications) {
            const now = new Date().toISOString();
            setLastReadTime(now);
            localStorage.setItem('lastReadTime', now);
            setUnreadCount(0);
        }
    };

    const handleMobileNotificationClick = () => {
        setShowMobileNotifications(!showMobileNotifications);
        if (!showMobileNotifications) {
            const now = new Date().toISOString();
            setLastReadTime(now);
            localStorage.setItem('lastReadTime', now);
            setUnreadCount(0);
        }
    };

    const handleSignUp = () => {
        router.push("/sign-up")
    }

    const handleSignIn = () => {
        router.push("/sign-in")
    }

    const handleCoursesClick = () => {
        router.push("/profile?tab=courses");
        setIsMobileMenuOpen(false);
    }; const handleProfileClick = () => {
        router.push("/profile");
        setUserDropdownOpen(false);
    }

    const handleSignOut = async () => {
        try {
            // Use session manager to handle logout
            await sessionManager.logout();

            // Clear state (session manager listener will also handle this)
            setIsLoggedIn(false);
            setUsername('');
            setUserDropdownOpen(false);
            setNotifications([]);
            setUnreadCount(0);
            setIsAdmin(false);

            // Redirect with a smooth transition
            router.push('/');
        } catch (error) {
            console.error('Error during logout:', error);
            // Fallback: clear session anyway
            sessionManager.clearSession();
            router.push('/');
        }
    }

    return (<header dir='rtl' className="sticky top-0 z-[100] bg-gradient-to-b from-white/80 to-white/60 dark:from-slate-900/80 dark:to-slate-900/60 
                          backdrop-blur-xl border-b border-blue-500/10 dark:border-blue-500/5">
        {/* Math-themed background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-2 right-1/4 opacity-20">
                <TbMathPi className="text-3xl text-blue-500 animate-spin-slow" />
            </div>
            <div className="absolute -bottom-2 left-1/3 opacity-20">
                <TbMathSymbols className="text-2xl text-yellow-500 animate-pulse" />
            </div>
            <div className="absolute top-1/2 right-1/2 transform -translate-y-1/2 opacity-20">
                <TbMathFunction className="text-2xl text-red-500 animate-bounce" />
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
            <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">                    {/* Logo with enhanced math animation */}
                <Link href='/' className='shrink-0 group'>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">                                <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12
                                              bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl
                                              transform group-hover:scale-110 transition-all duration-500">
                            <Image
                                src="/pi.png"
                                alt="Pi Symbol"
                                width={24}
                                height={24}
                                className="text-2xl sm:text-3xl filter brightness-0 invert"
                            />
                            <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl 
                                                  opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        </div>
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-xl 
                                              opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="font-arabicUI2 text-lg sm:text-2xl font-bold 
                                             bg-clip-text text-transparent bg-gradient-to-r 
                                             from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600
                                             transition-all duration-300">
                               احمد السيد
                            </h2>
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-arabicUI2">
                                مدرس الاحياء
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Desktop Menu - Hidden on Mobile */}
                <div className="hidden md:flex items-center gap-1.5 sm:gap-2 md:gap-4">
                    {isLoggedIn ? (<div className="flex items-center gap-1.5 sm:gap-2">
                        {isAdmin && (
                            <Link href="/admin"
                                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg 
                                                 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <span className="font-arabicUI">لوحة التحكم</span>
                            </Link>
                        )}
                        <div className="hidden sm:flex items-center">
                            <Link href="/profile?tab=courses"
                                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg 
                                                 text-slate-600 dark:text-slate-300 text-sm">
                                <PiStudentBold className="text-lg sm:text-xl" />
                                <span className="font-arabicUI">كورساتي</span>
                            </Link>
                        </div>
                        <NotificationButton
                            notifications={notifications}
                            unreadCount={unreadCount}
                            lastReadTime={lastReadTime}
                            setLastReadTime={setLastReadTime}
                        />

                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <IoPersonCircle className="text-xl" />
                                </div>
                                <span className="font-arabicUI3 text-sm text-slate-700 dark:text-slate-300">
                                    {username}
                                </span>
                            </button>

                            {/* User dropdown menu */}
                            {userDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg 
                                                      border border-slate-200 dark:border-slate-700 z-50">
                                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                                        <p className="font-arabicUI3 font-medium text-slate-800 dark:text-white">
                                            {username}
                                        </p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={handleProfileClick}
                                            className="w-full text-right px-3 py-2 rounded-md hover:bg-slate-100 
                                                             dark:hover:bg-slate-700 font-arabicUI text-slate-700 dark:text-slate-300"
                                        >
                                            الملف الشخصي
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-right px-3 py-2 rounded-md hover:bg-red-50 
                                                             dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-arabicUI"
                                        >
                                            تسجيل الخروج
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                                onClick={handleSignIn}
                                className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-xl 
                                             text-slate-600 dark:text-slate-300 font-arabicUI2 
                                             hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg 
                                             transition-all duration-300 relative group flex items-center gap-1.5
                                             border-2  border-blue-200 dark:border-blue-700 
                                             hover:border-blue-400 dark:hover:border-blue-500"
                            >
                                <span className="relative z-10">تسجيل الدخول</span>
                                <PiStudentBold className="text-blue-500 text-sm sm:text-xl animate-pulse group-hover:animate-none" />
                                <div className="absolute inset-0 bg-blue-500/5 rounded-lg scale-0 
                                                  group-hover:scale-100 transition-transform duration-300"></div>
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-0 
                                                  group-hover:opacity-20 blur-md transition-opacity duration-500"></div>
                            </button>
                            <button
                                onClick={handleSignUp}
                                className="relative overflow-hidden px-2 py-1.5 sm:px-3 sm:py-2 
                                             bg-gradient-to-r from-blue-500 to-blue-600 
                                             text-white text-xs sm:text-xl font-arabicUI3 rounded-lg
                                             transition-all duration-300 hover:shadow-lg
                                             hover:shadow-blue-500/40 flex items-center gap-1.5 hover:scale-105
                                             border-2 border-blue-400 dark:border-blue-400 
                                             hover:border-blue-300 dark:hover:border-blue-300
                                             outline outline-1 outline-white/40 dark:outline-white/20"
                            >
                                <div className="absolute inset-0 bg-white/20 rounded-lg scale-0 
                                                  hover:scale-100 transition-transform duration-300"></div>
                                <span className="hidden xs:inline relative z-10">انشاء حساب</span>
                                <span className="xs:hidden relative z-10">حساب جديد</span>
                                <PiMathOperationsBold className="text-white text-sm sm:text-xl animate-duration-2000" />
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/50 to-blue-700/50 rounded-lg blur-md 
                                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                            </button>
                        </div>
                    )}
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ?
                        <IoClose className="text-2xl" /> :
                        <RiMenu4Fill className="text-2xl" />
                    }
                </button>
            </div>
        </div>

        {/* Mobile Menu Overlay - Fixed */}
        <div className={`fixed inset-0 z-[200] ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300
                        ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div className={`absolute right-0 top-0 h-[100dvh] w-72 bg-white dark:bg-slate-900 shadow-xl 
                                transform transition-transform duration-300 ease-in-out overflow-y-auto
                                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col p-4 gap-3">
                    {/* Menu Header */}
                    <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-arabicUI font-semibold text-slate-800 dark:text-white">القائمة</h3>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <IoClose className="text-2xl text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>

                    {/* User Info (if logged in) */}
                    {isLoggedIn && (
                        <div className="p-3 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <IoPersonCircle className="text-2xl" />
                                </div>
                                <div>
                                    <p className="font-arabicUI3 font-medium text-slate-800 dark:text-white">
                                        {username}
                                    </p>
                                    <button
                                        onClick={handleProfileClick}
                                        className="text-xs text-blue-600 dark:text-blue-400 font-arabicUI"
                                    >
                                        عرض الملف الشخصي
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="flex flex-col gap-2">
                        {isAdmin && (
                            <Link href="/admin"
                                className="flex items-center gap-2 px-4 py-3 text-blue-600 dark:text-blue-400 
                                             hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl font-arabicUI
                                             transition-colors duration-200 w-full text-right"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span>لوحة التحكم</span>
                            </Link>
                        )}
                        <button
                            onClick={handleCoursesClick}
                            className="flex items-center gap-2 px-4 py-3 text-slate-600 dark:text-slate-300 
                                         hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl font-arabicUI
                                         transition-colors duration-200 w-full text-right"
                        >
                            <PiStudentBold className="text-xl text-blue-500" />
                            <span>كورساتي</span>
                        </button>

                        {/* Auth Section */}
                        {isLoggedIn ? (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleMobileNotificationClick}
                                    className="flex items-center justify-between w-full px-4 py-3 text-slate-600 
                                                 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 
                                                 rounded-xl font-arabicUI transition-colors duration-200"
                                >
                                    <span>الاشعارات</span>
                                    <div className="relative">
                                        <IoNotifications className="text-xl text-blue-500" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 
                                                               text-white text-xs flex items-center justify-center 
                                                               rounded-full">{unreadCount}</span>
                                        )}
                                    </div>
                                </button>

                                {/* Mobile Notifications Popup */}
                                {showMobileNotifications && (
                                    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4"
                                        onClick={(e) => e.stopPropagation()}>
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                            onClick={() => setShowMobileNotifications(false)}></div>
                                        <div className="relative w-full max-w-md max-h-[80vh] bg-white dark:bg-slate-800 
                                                          rounded-xl shadow-xl overflow-hidden scale-100 opacity-100
                                                          animate-in fade-in zoom-in duration-200">
                                            <div className="flex items-center justify-between p-4 border-b 
                                                              border-slate-200 dark:border-slate-700">
                                                <h3 className="font-arabicUI font-semibold text-slate-800 dark:text-white">الاشعارات</h3>
                                                <button onClick={() => setShowMobileNotifications(false)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                                    <IoClose className="text-xl text-slate-600 dark:text-slate-300" />
                                                </button>
                                            </div>
                                            <div className="overflow-y-auto p-4 max-h-[60vh]">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notification) => (
                                                        <div key={notification.id}
                                                            className="p-3 mb-2 rounded-lg bg-slate-50 
                                                                          dark:bg-slate-700/50 text-slate-800 dark:text-slate-200">
                                                            <p className="font-arabicUI">{notification.message}</p>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                                                                {new Date(notification.updatedAt).toLocaleString('ar-EG')}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-slate-500 dark:text-slate-400 font-arabicUI py-8">
                                                        لا توجد اشعارات
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-4 py-3 text-red-600 dark:text-red-400
                                                 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-arabicUI
                                                 transition-colors duration-200 w-full text-right"
                                >
                                    <span>تسجيل الخروج</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => { handleSignIn(); setIsMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 text-slate-600 dark:text-slate-300 
                                                 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl 
                                                 font-arabicUI text-right flex items-center justify-between 
                                                 transition-all duration-300 hover:shadow-sm group
                                                 border border-blue-200 dark:border-blue-700/50
                                                 hover:border-blue-400 dark:hover:border-blue-500"
                                >
                                    <span>تسجيل الدخول</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center
                                                     group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors
                                                     ring-1 ring-blue-300 dark:ring-blue-500/30">
                                        <LuLogIn className="text-blue-500 text-lg" />
                                    </div>
                                </button>
                                <button
                                    onClick={() => { handleSignUp(); setIsMobileMenuOpen(false); }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                                                 font-arabicUI hover:from-blue-700 hover:to-blue-800 rounded-xl 
                                                 flex items-center justify-between transition-all duration-300 
                                                 hover:shadow-md hover:shadow-blue-500/30 relative overflow-hidden
                                                 border-2 border-blue-400 dark:border-blue-500
                                                 outline outline-1 outline-white/30 dark:outline-white/10"
                                >
                                    <span className="relative z-10">انشاء حساب</span>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center
                                                     relative z-10 ring-2 ring-white/40">
                                        <LuUserPlus className="text-white text-lg" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 to-blue-400/30 
                                                     opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <div className="px-4 pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
    );
}

export default Header;