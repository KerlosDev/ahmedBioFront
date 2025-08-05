'use client'
import { useState } from 'react';
import {
    User, Book, BarChart2, FileText, Settings as SettingsIcon,
    LogOut, CreditCard, Camera, Users, CheckCircle, AlertTriangle,
    Bell, Wallet,
    Clapperboard,
    BookAIcon
} from 'lucide-react';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';
import { IoAnalyticsOutline } from 'react-icons/io5';
import { IoIosAnalytics } from 'react-icons/io';
import { BsBoxSeam } from 'react-icons/bs';

export default function AdminSidebar({ activeTab, setActiveTab, adminData, showLogoutConfirm, setShowLogoutConfirm }) {
    const allMenuItems = [
        {
            id: 1,
            label: "لوحة التحكم",
            icon: <BarChart2 size={20} />,
            tab: 'dashboard',
            roles: ['admin'] // Only admin can see dashboard
        },
        {
            id: 2,
            label: "إدارة الطلاب",
            icon: <Users size={20} />,
            tab: 'students',
            roles: ['admin'] // Only admin can manage students
        },
        {
            id: 3,
            label: "إدارة الكورسات",
            icon: <Book size={20} />,
            tab: 'courses',
            roles: ['admin'] // Only admin can manage courses
        },
        {
            id: 4,
            label: "ادارة الامتحانات",
            icon: <FileText size={20} />,
            tab: 'examMangae',
            roles: ['admin', 'instructor'] // Both admin and instructor can manage exams
        },
        {
            id: 5,
            label: "المدفوعات",
            icon: <Wallet size={20} />,
            tab: 'payments',
            roles: ['admin'] // Only admin can see payments
        },
        {
            id: 6,
            label: "احصائيات الكورسات",
            icon: <IoAnalyticsOutline size={20} />,
            tab: 'analyses',
            roles: ['admin'] // Only admin can see course analytics
        },
        {
            id: 7,
            label: "احصائيات الامتحانات",
            icon: <IoIosAnalytics size={20} />,
            tab: 'exam',
            roles: ['admin'] // Only admin can see exam analytics
        },
        {
            id: 8,
            label: " متابعة الطلاب",
            icon: <User size={20} />,
            tab: 'followup',
            roles: ['admin'] // Only admin can follow up students
        },
        {
            id: 9,
            label: "إدارة العروض",
            icon: <Clapperboard size={20} />,
            tab: 'offers',
            roles: ['admin'] // Only admin can manage offers
        },
        {
            id: 10,
            label: "إدارة الكتب",
            icon: <Book size={20} />,
            tab: 'books',
            roles: ['admin'] // Only admin can manage books
        },
        {
            id: 11,
            label: "إدارة الإشعارات",
            icon: <Bell size={20} />,
            tab: 'notifications',
            roles: ['admin'] // Only admin can manage notifications
        },
        {
            id: 12,
            label: "الإعدادات",
            icon: <SettingsIcon size={20} />,
            tab: 'settings',
            roles: ['admin'] // Only admin can access settings
        },
        {
            id: 12,
            label: "إدارة الحزم",
            icon: <BsBoxSeam size={20} />,
            tab: 'packages',
            roles: ['admin'] // Only admin can manage packages
        }
    ];

    // Filter menu items based on user role
    const menuItems = allMenuItems.filter(item =>
        item.roles.includes(adminData.userRole)
    );

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    return (
        <aside className="lg:col-span-3 font-arabicUI3 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/30 transition-all duration-500 h-fit shadow-lg">
            <div className="flex flex-col items-center mb-8">
                <div className="group relative">
                    <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-4 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/50">
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-white/20 dark:group-hover:bg-black/20 transition-all duration-300"></div>
                        <MdOutlineAdminPanelSettings size={50} className="text-white relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                        <button className="absolute bottom-2 right-2 w-8 h-8 bg-black/10 dark:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Camera size={16} className="text-gray-700 dark:text-white" />
                        </button>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h2 className="text-2xl font-arabicUI3 text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors duration-300">{adminData.name}</h2>
                        </div>
                        <p className="text-indigo-600 dark:text-indigo-200 font-arabicUI3 text-sm mb-2">{adminData.role}</p>

                    </div>
                </div>
            </div>

            <nav className="space-y-2">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.tab)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300
                            ${activeTab === item.tab
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <span>{item.label}</span>
                        {item.icon}
                    </button>
                ))}

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-between p-3 mt-4 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                >
                    <span>خروج من المنصة</span>
                    <LogOut size={20} />
                </button>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-xl font-arabicUI2 text-gray-800 dark:text-white mb-4">تأكيد تسجيل الخروج</h3>
                        <p className="text-gray-600 dark:text-white/80 mb-6">هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة التحكم؟</p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
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
        </aside>
    );
}