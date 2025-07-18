'use client'
import { useState, useEffect, use } from 'react';
import {
    User, Book, BarChart2, Award, Eye, FileText, Settings as SettingsIcon,
    LogOut, CreditCard, ChevronDown, Mail, Phone, BookOpen,
    Clock, Target, Brain, Beaker, Edit2, Camera, Sun, Moon
} from 'lucide-react';
import { FaAtom, FaDna, FaFlask, FaLeaf, FaMicroscope, FaPlay, FaSeedling } from "react-icons/fa";
import { HiOutlineAcademicCap } from "react-icons/hi";
import { FaVirus } from "react-icons/fa";
import Cookies from 'js-cookie';
import axios from 'axios';
import Settings from '../../app/components/Settings'; // Import the Settings component
import MyCourses from '../components/MyCourses';
import LessonViews from '../components/LessonViews'; // أو مسار الملف حسب مكانه
import ExamAnalysis from '../components/ExamAnalysis'; // غيّر المسار لو الملف في مكان تاني
import Chat from '../components/Chat'; // غيّر المسار لو مختلف

export default function ChemistryLMSProfile({ searchParams }) {
    const params = use(searchParams);
    const [activeTab, setActiveTab] = useState('profile');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showCourses, setShowCourses] = useState(false);
    const [showLessonView, setShowLessonView] = useState(false);
    const [showExamAnalysis, setShowExamAnalysis] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Theme state - synced with header theme toggle
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Load theme preference and sync with document class
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme ? savedTheme === 'dark' : true;
        setIsDarkMode(isDark);

        // Sync with document class
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Listen for theme changes from other components (like header)
    useEffect(() => {
        const handleThemeChange = () => {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark';
            setIsDarkMode(isDark);
        };

        // Listen for storage changes (when theme is changed in other tabs/components)
        window.addEventListener('storage', handleThemeChange);

        // Also check periodically in case theme is changed by other components in same tab
        const interval = setInterval(() => {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark';
            if (isDark !== isDarkMode) {
                setIsDarkMode(isDark);
            }
        }, 100);

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            clearInterval(interval);
        };
    }, [isDarkMode]);

    // Save theme preference and sync with document class
    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');

        // Update document class to sync with header toggle
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // User profile data
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        parentPhoneNumber: "",
        level: "",
        gender: "",
        government: "",
        createdAt: ""
    });    // Stats data
    const [stats, setStats] = useState({
        platformActivity: '0%',
        averageScore: '0%',
        completedExams: { value: 0, },
        enrolledCourses: { value: 0, subText: 'إجمالي الكورسات' }
    });
    const [lastActive, setLastActive] = useState("اليوم");

    // Fetch stats data
    const fetchStats = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stats/user-stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Process the response data to ensure proper formatting
            const statsData = response.data.stats;

            // Handle the completedExams subText properly based on actual data
            if (statsData.completedExams) {
                const totalExams = statsData.completedExams.total || 0;
                const completedValue = statsData.completedExams.value || 0;
                statsData.completedExams.subText = `${completedValue} من ${totalExams}`;
            }

            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const tab = params?.tab;
        if (tab === 'courses') {
            setActiveTab('courses');
            setShowCourses(true);
            setShowSettings(false);
            setShowLessonView(false);
            setShowExamAnalysis(false);
            setShowChat(false);
        }
    }, []);
    // Format join date
    const formatJoinDate = (dateString) => {
        const date = new Date(dateString);
        return date.getFullYear().toString();
    };

    // Calculate time since joining
    const calculateTimeSinceJoining = (dateString) => {
        const joinDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "اليوم";
        if (diffDays === 1) return "الأمس";
        if (diffDays < 7) return `منذ ${diffDays} أيام`;
        if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
        if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
        return `منذ ${Math.floor(diffDays / 365)} سنوات`;
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            // Get token from cookies
            const token = Cookies.get('token');

            // Make request to the endpoint
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });            // Update state with fetched data
            setUserData(response.data);

            // Calculate last active time based on current date
            setLastActive(calculateTimeSinceJoining(response.data.createdAt));

        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('فشل في تحميل بيانات المستخدم. يرجى المحاولة مرة أخرى.');

            // Fallback to cookies data if API fails
            const storedUsername = Cookies.get('username');
            const storedEmail = Cookies.get('email');
            const storedPhone = Cookies.get('phone');

            if (storedUsername || storedEmail || storedPhone) {
                setUserData(prev => ({
                    ...prev,
                    name: storedUsername ? decodeURIComponent(storedUsername) : prev.name,
                    email: storedEmail ? decodeURIComponent(storedEmail) : prev.email,
                    phoneNumber: storedPhone ? decodeURIComponent(storedPhone) : prev.phoneNumber
                }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle user data update from Settings component
    const handleUserDataUpdate = (updatedData) => {
        setUserData(prev => ({
            ...prev,
            ...updatedData
        }));
    }; const statsDisplay = [
        {
            id: 1,
            value: stats.platformActivity,
            label: "نشاطك على المنصة",
            color: "bg-blue-600",
            icon: <Target className="text-blue-600" />,
            gradient: "from-blue-600 to-indigo-600"
        },
        {
            id: 2,
            value: stats.averageScore,
            label: "متوسط النتائج",
            color: "bg-indigo-600",
            icon: <FaDna className="text-indigo-600" />,
            gradient: "from-indigo-600 to-purple-600"
        },
        {
            id: 3,
            value: stats.completedExams.value.toString(),
            label: "الاختبارات المكتملة",
            color: "bg-purple-600",
            icon: <FaMicroscope className="text-purple-600" />,
            gradient: "from-purple-600 to-indigo-600"
        },
        {
            id: 4,
            value: stats.enrolledCourses.value.toString(),
            label: "الكورسات المسجلة",
            subText: stats.enrolledCourses.subText,
            color: "bg-blue-600",
            icon: <FaLeaf className="text-blue-600" />,
            gradient: "from-blue-600 to-indigo-600"
        }
    ];


    const menuItems = [
        {
            id: 1, label: "ملف الشخصي", icon: <User size={20} />, onClick: () => {
                setActiveTab('profile');
                setShowSettings(false);
                setShowExamAnalysis(false);
                setShowCourses(false);
                setShowSettings(false);
                setShowLessonView(false);
                setShowCourses(false);
                setShowChat(false)
                setShowLessonView(false); // لازم تضيف دي عشان تخفي LessonViews لو ظاهر
            }
        }, { id: 2, label: "كورساتي", icon: <Book size={20} />, onClick: () => { setActiveTab('courses'); setShowCourses(true); setShowSettings(false); } },
        {
            id: 3, label: "تفاصيل المشاهدات", icon: <Eye size={20} />, onClick: () => {
                setActiveTab('lesson');
                setShowLessonView(true);
                setShowCourses(false);
                setShowSettings(false);
            }
        }, {
            id: 4, label: "الامتحانات", icon: <FileText size={20} />, onClick: () => {
                setActiveTab('exams');
                setShowExamAnalysis(true);
                setShowCourses(false);
                setShowSettings(false);
                setShowLessonView(false);
            }
        },
        ,
        {
            id: 5, label: "تواصل", icon: <Mail size={20} />, onClick: () => {
                setActiveTab('call');
                setShowChat(true);
                setShowSettings(false);
                setShowCourses(false);
                setShowLessonView(false);
                setShowExamAnalysis(false);
            }
        }, { id: 6, label: "الاعدادات", icon: <SettingsIcon size={20} />, onClick: () => { setActiveTab('settings'); setShowSettings(true); setShowCourses(false); } }
    ];

    // Logout handler
    const handleLogout = () => {
        // Clear cookies
        Cookies.remove('token');
        Cookies.remove('username');
        Cookies.remove('email');
        Cookies.remove('phone');

        // Redirect to login page
        window.location.href = '/sign-in';

        setShowLogoutConfirm(false);
    };

    // Chemistry background component
    const ChemBackground = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute inset-0 opacity-5 mix-blend-overlay ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}></div>
            <div className={`absolute top-20 left-20 text-7xl ${isDarkMode ? 'text-white/10' : 'text-gray-300/30'}`}>
                <FaSeedling className="animate-float" />
            </div>
            <div className={`absolute bottom-40 right-20 text-8xl ${isDarkMode ? 'text-white/10' : 'text-gray-300/30'}`}>
                <FaDna className="animate-spin-slow" />
            </div>
            <div className={`absolute top-1/2 left-1/3 text-6xl ${isDarkMode ? 'text-white/10' : 'text-gray-300/30'}`}>
                <FaLeaf className="animate-bounce-slow" />
            </div>
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-200/40'} rounded-full filter blur-3xl animate-pulse`}></div>
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-200/40'} rounded-full filter blur-3xl animate-pulse-delayed`}></div>
        </div>
    );

    // Sidebar component for reuse
    const Sidebar = () => (
        <aside className={`lg:col-span-3 ${isDarkMode ? 'bg-white/10 border-white/20 hover:border-white/30' : 'bg-white/80 border-gray-200 hover:border-gray-300'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 h-fit`}>
            {/* Theme Toggle Button */}

            <div className="flex flex-col items-center mb-8">
                <div className="group relative">
                    <div className="flex  justify-center">
                        <div className="  relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-4 flex items-center justify-center overflow-hidden transition-all duration-300  ">
                            <User size={50} className="text-white relative z-10 transform group-hover:scale-110 transition-transform duration-300" />

                        </div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className={`text-2xl font-arabicUI3 ${isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-gray-900 group-hover:text-blue-600'} transition-colors duration-300`}>{userData.name}</h2>
                        </div>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>{userData.level}</p>
                        <div className={`flex items-center justify-center gap-2 text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                            <span>انضم في {formatJoinDate(userData.createdAt)}</span>
                            <span>•</span>
                            <span>آخر نشاط: {lastActive}</span>
                        </div>
                    </div>
                </div>
            </div>

            <nav className="space-y-2">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300
                            ${(item.label === "ملف الشخصي" && activeTab === 'profile') ||
                                (item.label === "الاعدادات" && activeTab === 'settings') ||
                                (item.label === "الامتحانات" && activeTab === 'exams') ||
                                (item.label === "تواصل" && activeTab === 'call') ||
                                (item.label === "تفاصيل المشاهدات" && activeTab === 'lesson') ||
                                (item.label === "كورساتي" && activeTab === 'courses') ?
                                'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' :
                                `${isDarkMode ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}`}
                    >
                        <span>{item.label}</span>
                        {item.icon}
                    </button>
                ))}

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-between p-3 mt-4 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                >
                    <span>خروج من المنصة</span>
                    <LogOut size={20} />
                </button>
            </nav>
        </aside>
    );

    // Main Profile Content
    const ProfileContent = () => (
        <>
            {/* Welcome Card */}
            <div className={`h-fit font-arabicUI3 ${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white' : 'bg-gradient-to-br from-white to-blue-50 text-gray-900 border border-gray-200'} rounded-2xl p-6 relative overflow-hidden shadow-lg`}>
                <div className={`absolute top-0 right-0 w-64 h-64 ${isDarkMode ? 'bg-white/10' : 'bg-blue-100/50'} rounded-full -translate-y-32 translate-x-32`} />
                <div className={`absolute bottom-0 left-0 w-32 h-32 ${isDarkMode ? 'bg-white/10' : 'bg-blue-100/50'} rounded-full translate-y-16 -translate-x-16`} />

                <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`h-16 w-16 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-blue-100'} backdrop-blur-xl flex items-center justify-center`}>
                            <HiOutlineAcademicCap className={`text-3xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-arabicUI3">
                                مرحباً, {userData.name}
                            </h1>
                            <p className={`mt-1 ${isDarkMode ? 'text-blue-100' : 'text-gray-600'}`}>إليك نظرة على ملفك الشخصي</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 mt-8">
                        <div className={`${isDarkMode ? 'bg-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur rounded-xl p-4`}>
                            <p className={`text-sm mb-1 ${isDarkMode ? 'text-blue-100' : 'text-gray-600'}`}>البريد الإلكتروني</p>
                            <div className="flex items-center gap-2">
                                <Mail size={16} className={`${isDarkMode ? 'text-white/70' : 'text-gray-500'}`} />
                                <h3 className="text-lg font-arabicUI3">{userData.email}</h3>
                            </div>
                        </div>
                        <div className={`${isDarkMode ? 'bg-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur rounded-xl p-4`}>
                            <p className={`text-sm mb-1 ${isDarkMode ? 'text-blue-100' : 'text-gray-600'}`}>رقم الهاتف</p>
                            <div className="flex items-center gap-2">
                                <Phone size={16} className={`${isDarkMode ? 'text-white/70' : 'text-gray-500'}`} />
                                <h3 className="text-lg font-arabicUI3">{userData.phoneNumber}</h3>
                            </div>
                        </div>
                        <div className={`${isDarkMode ? 'bg-white/10' : 'bg-white/70 border border-gray-200'} backdrop-blur rounded-xl p-4`}>
                            <p className={`text-sm mb-1 ${isDarkMode ? 'text-blue-100' : 'text-gray-600'}`}>المحافظة</p>
                            <h3 className="text-lg font-arabicUI3">{userData.government}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsDisplay.map(stat => (
                    <div key={stat.id} className={`group ${isDarkMode ? 'bg-white/10 border-white/20 hover:border-white/40' : 'bg-white/80 border-gray-200 hover:border-gray-300'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:transform hover:scale-105 shadow-lg`}>
                        <div className="relative w-full aspect-square flex items-center justify-center">
                            {/* Glowing background */}
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-slow`}></div>

                            {/* Circular Progress Bar */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                <circle
                                    className={`${isDarkMode ? 'text-white/5' : 'text-gray-200'}`}
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                                <circle
                                    className={`text-${stat.color.replace('bg-', '')} transition-all duration-1000 ease-in-out`}
                                    strokeWidth="8"
                                    strokeDasharray={`${parseInt(stat.value) * 2.51}, 251.2`}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                            </svg>

                            {/* Content */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                                <div className={`h-12 w-12 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-white/50'} backdrop-blur-sm flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-500`}>
                                    {stat.icon}
                                </div>
                                <span className={`text-2xl font-bold text-${stat.color.replace('bg-', '')} group-hover:scale-110 transition-transform duration-500 drop-shadow-lg`}>
                                    {stat.value}
                                </span>
                                {stat.subText && <span className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>{stat.subText}</span>}
                            </div>
                        </div>
                        <p className={`mt-4 text-center font-arabicUI3 transition-colors duration-500 ${isDarkMode ? 'text-white/80 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Achievements Section */}


        </>
    );

    // Main Content Handler
    const MainContent = () => {
        if (showSettings) {
            return <Settings userData={userData} onClose={() => setShowSettings(false)} onUpdate={handleUserDataUpdate} />;
        }


        if (showCourses) {
            return <MyCourses onBack={() => setShowCourses(false)} />;
        }
        if (showLessonView) {
            return <LessonViews onBack={() => setShowLessonView(false)} />;
        }
        if (showExamAnalysis) {
            return <ExamAnalysis onBack={() => setShowExamAnalysis(false)} />;
        }
        if (showChat) {
            return <Chat onBack={() => setShowChat(false)} />;

        }

        return <ProfileContent />;
    };

    return (
        <div className={`min-h-screen font-arabicUI3 relative transition-colors duration-300 ${isDarkMode ? ' ' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`} dir="rtl">
            {/* Chemistry Background */}
            <ChemBackground />

            {/* Main Content */}
            <div className="relative z-20 container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className={`${isDarkMode ? 'bg-red-500/20 text-white' : 'bg-red-100 text-red-800 border border-red-200'} backdrop-blur-xl rounded-xl p-4 text-center`}>
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Sidebar - User Navigation */}
                        <Sidebar />

                        {/* Main Content Area */}
                        <div className="lg:col-span-9 space-y-6">
                            <MainContent />
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900'} backdrop-blur-xl p-6 rounded-2xl border max-w-md w-full mx-4`}>
                        <h3 className="text-xl font-bold mb-4">تأكيد تسجيل الخروج</h3>
                        <p className={`mb-6 ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`}>هل أنت متأكد من رغبتك في تسجيل الخروج من المنصة؟</p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className={`px-4 py-2 rounded-xl transition-all ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                                تأكيد الخروج
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}