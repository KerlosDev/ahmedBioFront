'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Users, Book, BarChart2, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { FaDna, FaMicroscope, FaLeaf } from "react-icons/fa";
import AdminSidebar from './components/AdminSidebar';
import DashboardStats from './components/DashboardStats';
import StudentsList from './components/StudentsList';
import PaymentsList from './components/PaymentsList';
import ExamAnalysis from './components/ExamAnalysis';
import CourseManager from './components/CourseManager';
import ExamManage from './components/ExamManage';
import StudentFollowup from '../components/StudentFollowup';
import OffersManagement from './components/OffersManagement';
import NotFound from '../not-found';
import AdminBooks from '../components/AdminBooks';
import NotificationManagement from './components/NotificationManagement';
import CoursesAnalyses from './components/CoursesAnalyses';
import PackageManagement from './components/PackageManagement';


export default function BiologyLMSAdmin() {
    const [isAdmin, setIsAdmin] = useState(null); // To track admin status
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSection, setCurrentSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Admin profile data
    const [adminData, setAdminData] = useState({
        name: " ادمن",
        email: "admin@biology-lms.com",
        phoneNumber: "0123456789",
        role: "مسؤول النظام",
        joinedDate: "2023-05-15T00:00:00.000Z",
        lastLogin: "2025-05-07T14:30:00.000Z"
    });

    useEffect(() => {
        const checkAdmin = async () => {
            const token = Cookies.get('token');
            if (!token) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (!data || (data.role !== 'admin' && data.role !== 'instructor') || data.isBanned || data.status !== 'active') {
                    setIsAdmin(false);
                    setIsLoading(false);
                    return;
                }

                setIsAdmin(true);
                setAdminData({
                    name: data.name,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    role: data.role === 'admin' ? "مسؤول النظام" : "مدرس",
                    userRole: data.role, // Keep the actual role for permissions
                    joinedDate: data.createdAt,
                    lastLogin: data.lastActive
                });
                setIsLoading(false);
            } catch (error) {
                console.error('Authentication error:', error);
                setIsAdmin(false);
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, []);

    // Move localStorage logic to useEffect to run only on client-side
    useEffect(() => {
        const savedTab = localStorage.getItem('adminActiveTab');
        if (savedTab && adminData.userRole) {
            // Check if the saved tab is allowed for the user's role
            const allowedTabs = {
                admin: ['dashboard', 'students', 'courses', 'examMangae', 'payments', 'analyses', 'exam', 'followup', 'offers', 'books', 'notifications'],
                instructor: ['examMangae']
            };

            if (allowedTabs[adminData.userRole]?.includes(savedTab)) {
                setActiveTab(savedTab);
            } else {
                // Set default tab based on role
                setActiveTab(adminData.userRole === 'instructor' ? 'examMangae' : 'dashboard');
            }
        } else if (adminData.userRole) {
            // Set default tab based on role
            setActiveTab(adminData.userRole === 'instructor' ? 'examMangae' : 'dashboard');
        }
    }, [adminData.userRole]);

    // Save tab changes to localStorage
    useEffect(() => {
        if (activeTab) {
            localStorage.setItem('adminActiveTab', activeTab);
        }
    }, [activeTab]);

    // Logout handler
    const handleLogout = () => {
        // Clear cookies
        Cookies.remove('admin_token');
        Cookies.remove('admin_name');
        Cookies.remove('admin_email');
        // Redirect to login page
        window.location.href = '/admin/login';
        setShowLogoutConfirm(false);
    };

    // Biology background component
    const BiologyBackground = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0   opacity-5 mix-blend-overlay"></div>
            <div className="absolute top-20 left-20 text-white/10 text-7xl">
                <FaMicroscope className="animate-float" />
            </div>
            <div className="absolute bottom-40 right-20 text-white/10 text-8xl">
                <FaLeaf className="animate-spin-slow" />
            </div>
            <div className="absolute top-1/2 left-1/3 text-white/10 text-6xl">
                <FaDna className="animate-bounce-slow" />
            </div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse-delayed"></div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <div className="min-h-screen p-8 relative">
            {/* Biology-themed animated background */}
            <BiologyBackground />

            <div className="relative z-10">

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <AdminSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        adminData={adminData}
                        showLogoutConfirm={showLogoutConfirm}
                        setShowLogoutConfirm={setShowLogoutConfirm}
                    />

                    {/* Main Content Area */}
                    <main className="lg:col-span-9 space-y-6">
                        {activeTab === 'dashboard' && adminData.userRole === 'admin' && (
                            <>
                                <DashboardStats />
                             </>
                        )}

                        {activeTab === 'students' && adminData.userRole === 'admin' && (
                            <StudentsList />
                        )}

                        {activeTab === 'courses' && adminData.userRole === 'admin' && (
                            <CourseManager />
                        )}

                        {activeTab === 'followup' && adminData.userRole === 'admin' && (
                            <StudentFollowup />
                        )}

                        {activeTab === 'payments' && adminData.userRole === 'admin' && (
                            <PaymentsList />
                        )}

                        {activeTab === 'notifications' && adminData.userRole === 'admin' && (
                            <NotificationManagement />
                        )}

                        {activeTab === 'exam' && adminData.userRole === 'admin' && (
                            <ExamAnalysis />
                        )}

                        {activeTab === 'examMangae' && (adminData.userRole === 'admin' || adminData.userRole === 'instructor') && (
                            <ExamManage />
                        )}

                        {activeTab === 'books' && adminData.userRole === 'admin' && (
                            <AdminBooks />
                        )}

                        {activeTab === 'offers' && adminData.userRole === 'admin' && (
                            <OffersManagement />
                        )}

                        {activeTab === 'analyses' && adminData.userRole === 'admin' && (
                            <CoursesAnalyses />
                        )}
                        {activeTab === 'packages' && adminData.userRole === 'admin' && (
                            <PackageManagement />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}