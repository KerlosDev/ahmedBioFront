'use client'
import { useState, useEffect, useMemo } from 'react';
import { User, Mail, Phone, Clock, Filter, Ban, Search, MapPin, Book, AlertCircle, Download, Eye, Monitor, Smartphone, Tablet, Key } from 'lucide-react';
import { FaWhatsapp, FaGraduationCap } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function StudentsList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showBanConfirm, setShowBanConfirm] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordResetLoading, setPasswordResetLoading] = useState(false);

    // New state for analytics
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [analytics, setAnalytics] = useState({
        totalStudents: 0,
        activeStudents: 0,
        bannedStudents: 0,
        governmentDistribution: [],
        levelDistribution: [],
        lastWeekActive: 0
    });

    const fetchAnalytics = async () => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Analytics HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
            } else {
                throw new Error('Failed to fetch analytics data');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('حدث خطأ في تحميل الإحصائيات');
            setAnalytics({
                totalStudents: 0,
                activeStudents: 0,
                bannedStudents: 0,
                lastWeekActive: 0,
                governmentDistribution: [],
                levelDistribution: []
            });
        }
    };    // Effect to fetch initial analytics data
    useEffect(() => {
        fetchAnalytics();
    }, []); // Only fetch once on component mount

    // Add new state for sorting
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);

    // Add dummy data structure at the beginning of the component
    const getStudentMetrics = (student) => {
        // Dummy data generator for academic metrics
        return {
            attendance: Math.floor(Math.random() * (100 - 70) + 70),
            academicProgress: Math.floor(Math.random() * (100 - 50) + 50),
            assignmentsCompleted: Math.floor(Math.random() * (20 - 5) + 5),
            totalAssignments: 20,
            quizAverage: Math.floor(Math.random() * (100 - 60) + 60),
            lastAttendance: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
            payments: {
                total: Math.floor(Math.random() * (5000 - 1000) + 1000),
                status: Math.random() > 0.3 ? 'مدفوع' : 'متأخر',
                lastPayment: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
            },
            courseProgress: {
                completed: Math.floor(Math.random() * (15 - 5) + 5),
                total: 15,
                lastAccessed: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
            }
        };
    };

    // Define fetchStudents outside useEffect so it's available to the whole component
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/students?page=${page}&limit=${limit}&search=${searchQuery}&filterStatus=${filterStatus}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                setStudents(data.data);
                setTotalPages(data.totalPages);
                setTotalStudents(data.total);
            } else {
                throw new Error(data.message || 'Failed to fetch students');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('حدث خطأ في تحميل بيانات الطلاب');
            setLoading(false);
        }
    };

    // Effect to fetch students
    useEffect(() => {
        fetchStudents();
    }, [page, limit, searchQuery, filterStatus]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [filterStatus]);

    const toggleBanStatus = async (studentId, reason = '') => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/students/${studentId}/ban`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ banReason: reason }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json(); if (data.status === 'success') {
                // First update the students list
                await fetchStudents();
                // Then update analytics since the ban status changed
                await fetchAnalytics();

                setShowBanConfirm(false);
                setBanReason('');
                toast.success('تم تحديث حالة الحظر بنجاح');
            } else {
                throw new Error(data.message || 'Failed to update ban status');
            }
        } catch (error) {
            console.error('Error updating ban status:', error);
            toast.error('حدث خطأ في تحديث حالة الحظر');
        }
    };

    // Password reset function
    const handlePasswordReset = async () => {
        if (newPassword !== confirmPassword) {
            return toast.error('كلمتا المرور غير متطابقتين');
        }

        if (newPassword.length < 6) {
            return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        setPasswordResetLoading(true);
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${selectedStudent._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                toast.success('تم إعادة تعيين كلمة المرور بنجاح');
                setShowPasswordReset(false);
                setNewPassword('');
                setConfirmPassword('');
                // Optionally, you can refetch the student data to get the updated info
                await fetchStudents();
            } else {
                throw new Error(data.message || 'فشل في إعادة تعيين كلمة المرور');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error(error.message || 'حدث خطأ في إعادة تعيين كلمة المرور');
        } finally {
            setPasswordResetLoading(false);
        }
    };

    // Filter students - now handled by backend, so we just use the students directly
    const filteredStudents = students;

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };    // WhatsApp link generator
    const getWhatsAppLink = (number) => {
        const cleanNumber = number.replace(/\D/g, '');
        return `https://wa.me/2${cleanNumber}`;
    };

    // Device info formatter
    const getDeviceInfo = (deviceInfo) => {
        if (!deviceInfo) {
            return {
                type: 'unknown',
                browser: 'غير محدد',
                os: 'غير محدد',
                icon: Monitor
            };
        }

        let type = 'desktop';
        let icon = Monitor;

        const userAgent = deviceInfo.userAgent || deviceInfo;

        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            if (/iPad|tablet/i.test(userAgent)) {
                type = 'tablet';
                icon = Tablet;
            } else {
                type = 'mobile';
                icon = Smartphone;
            }
        }

        // Extract browser info
        let browser = 'غير محدد';
        if (/Chrome/i.test(userAgent)) browser = 'Chrome';
        else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
        else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
        else if (/Edge/i.test(userAgent)) browser = 'Edge';

        // Extract OS info
        let os = 'غير محدد';
        if (/Windows/i.test(userAgent)) os = 'Windows';
        else if (/Mac/i.test(userAgent)) os = 'macOS';
        else if (/Linux/i.test(userAgent)) os = 'Linux';
        else if (/Android/i.test(userAgent)) os = 'Android';
        else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';

        return { type, browser, os, icon };
    };    // Export to Excel
    const exportToExcel = async () => {
        try {
            // Show loading toast
            const loadingToast = toast.loading('جاري تحضير ملف Excel...');

            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch all students without pagination
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/students?limit=999999`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to fetch all students');
            }

            const allStudents = data.data;

            // Create Excel worksheet with all students
            const worksheet = XLSX.utils.json_to_sheet(allStudents.map(student => {
                const deviceInfo = getDeviceInfo(student.deviceInfo);
                return {
                    'الاسم': student.name,
                    'البريد الإلكتروني': student.email,
                    'رقم الهاتف': student.phoneNumber,
                    'رقم ولي الأمر': student.parentPhoneNumber,
                    'المحافظة': student.government,
                    'المستوى': student.level,
                    'الحالة': student.isBanned ? 'محظور' : 'نشط',
                    'آخر نشاط': formatDate(student.lastActive),
                    'تاريخ التسجيل': formatDate(student.createdAt),
                    'نوع الجهاز': deviceInfo.type === 'mobile' ? 'هاتف' : deviceInfo.type === 'tablet' ? 'تابلت' : 'كمبيوتر',
                    'المتصفح': deviceInfo.browser,
                    'نظام التشغيل': deviceInfo.os,
                    'جلسة نشطة': student.hasActiveSession ? 'نعم' : 'لا'
                };
            }));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Create Blob and download
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `all-students-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Dismiss loading toast and show success
            toast.dismiss(loadingToast);
            toast.success(`تم تصدير ${allStudents.length} طالب بنجاح`);

        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('حدث خطأ في تصدير البيانات');
        }
    };    // Analytics Section Component
    const AnalyticsSection = () => (
        <div className="grid grid-cols-1 font-arabicUI3 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg text-gray-700 dark:text-white/70 mb-2">إجمالي الطلاب</h3>
                <p className="text-3xl font-arabicUI3 text-gray-900 dark:text-white">{analytics?.totalStudents || 0}</p>
                {analytics?.totalStudents !== totalStudents &&
                    <p className="text-sm text-gray-500 dark:text-white/50 mt-2">مجموع كل الطلاب في النظام</p>
                }
            </div>
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg text-gray-700 dark:text-white/70 mb-2">الطلاب النشطين</h3>
                <p className="text-3xl font-arabicUI3 text-green-600 dark:text-green-400">{analytics?.activeStudents || 0}</p>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-2">الطلاب الغير محظورين</p>
            </div>
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg text-gray-700 dark:text-white/70 mb-2">الطلاب المحظورين</h3>
                <p className="text-3xl font-arabicUI3 text-red-600 dark:text-red-400">{analytics?.bannedStudents || 0}</p>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-2">الطلاب المحظورين حالياً</p>
            </div>
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-gray-200 dark:border-white/10">
                <h3 className="text-lg text-gray-700 dark:text-white/70 mb-2">نشطين آخر أسبوع</h3>
                <p className="text-3xl font-arabicUI3 text-blue-600 dark:text-blue-400">{analytics?.lastWeekActive || 0}</p>
                <p className="text-sm text-gray-500 dark:text-white/50 mt-2">الطلاب النشطين في آخر 7 أيام</p>
            </div>
        </div>
    );

    // Charts Section
    const ChartsSection = () => {
        // Custom colors with a modern and vibrant palette
        const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

        const RADIAN = Math.PI / 180;
        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index, name }) => {
            // Only show labels for segments larger than 4%
            if (percent < 0.04) return null;

            const radius = outerRadius + 20; // Position labels outside the pie
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
                <text
                    x={x}
                    y={y}
                    fill="#374151"
                    className="dark:fill-white/70"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="500"
                >
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            );
        };

        return (
            <div className="grid font-arabicUI3 grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg text-gray-700 dark:text-white/70 mb-4">توزيع المحافظات</h3>
                    <div className="relative">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics.governmentDistribution}
                                        dataKey="value"
                                        nameKey="id"
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={100}
                                        innerRadius={60}
                                        paddingAngle={1}
                                        startAngle={90}
                                        endAngle={450}
                                        animationBegin={0}
                                        animationDuration={1500}
                                        animationEasing="ease-out"
                                    >
                                        {analytics.governmentDistribution.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                className="transition-all duration-300 hover:opacity-80"
                                                strokeWidth={2}
                                                stroke="rgba(255,255,255,0.1)"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#f3f4f6', // gray-100
                                            border: 'none',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ color: '#111827' }} // gray-900
                                        formatter={(value, name) => [
                                            `${value} طالب`,
                                            `${name}`
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend below the chart */}
                        <div className="mt-4 max-h-32 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {analytics.governmentDistribution.map((entry, index) => (
                                    <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-gray-700 dark:text-white/70 truncate">{entry.id}</span>
                                        <span className="text-gray-500 dark:text-white/50 ml-auto">
                                            {((entry.value / analytics.governmentDistribution.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-6 backdrop-blur-sm h-[400px] border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg text-gray-700 dark:text-white/70 mb-4">توزيع المستويات</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.levelDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="id"
                                stroke="#6b7280"
                            />
                            <YAxis
                                stroke="#6b7280"
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none' }}
                                labelStyle={{ color: '#111827' }}
                            />
                            <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    // Add temporary search input state
    const [tempSearchInput, setTempSearchInput] = useState("");

    // Add a function to handle search button click
    const handleSearch = () => {
        setSearchQuery(tempSearchInput); // This will trigger the API call through the useEffect dependency
    };

    // Add a function to handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Add sorting function
    const sortData = (key) => {
        setSortConfig({ key, direction });
    };

    // Sort students based on configuration
    const getSortedData = (data) => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    };

    // Table View Component
    const TableView = () => (
        <div className="overflow-x-auto font-arabicUI3 text-xs rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                        <th
                            className="p-4 text-right text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
                            onClick={() => sortData('name')}
                        >
                            <div className="flex items-center gap-2">
                                الاسم
                                {sortConfig.key === 'name' && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </th>
                        <th
                            className="p-4 text-right text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
                            onClick={() => sortData('email')}
                        >
                            <div className="flex items-center gap-2">
                                البريد الإلكتروني
                                {sortConfig.key === 'email' && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </th>
                        <th
                            className="p-4 text-right text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
                            onClick={() => sortData('phoneNumber')}
                        >
                            <div className="flex items-center gap-2">
                                رقم الهاتف
                                {sortConfig.key === 'phoneNumber' && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </th>
                        <th
                            className="p-4 text-right text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
                            onClick={() => sortData('government')}
                        >
                            <div className="flex items-center gap-2">
                                المحافظة
                                {sortConfig.key === 'government' && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'
                                        }</span>
                                )}
                            </div>
                        </th>
                        <th
                            className="p-4 text-right text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors"
                            onClick={() => sortData('lastActive')}
                        >
                            <div className="flex items-center gap-2">
                                آخر نشاط
                                {sortConfig.key === 'lastActive' && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                                    </span>
                                )}
                            </div>
                        </th>
                        <th className="p-4 text-right text-gray-700 dark:text-white/70">الجهاز</th>
                        <th className="p-4 text-right text-gray-700 dark:text-white/70">الحالة</th>
                        <th className="p-4 text-right text-gray-700 dark:text-white/70">إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {getSortedData(filteredStudents).map((student, index) => (
                        <tr
                            key={student._id}
                            className={`
                                border-b border-gray-100 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors
                                ${index % 2 === 0 ? 'bg-gray-50 dark:bg-white/[0.02]' : ''}
                            `}
                        >
                            <td className="p-4 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-600 dark:to-indigo-600 flex items-center justify-center">
                                        <User className="text-white" size={14} />
                                    </div>
                                    <div>
                                        <p className="font-arabicUI3">{student.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-white/50">{student.level}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400 dark:text-white/50" />
                                    {student.email}
                                </div>
                            </td>
                            <td className="p-4 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400 dark:text-white/50" />
                                    {student.phoneNumber}
                                    <a
                                        href={getWhatsAppLink(student.phoneNumber)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg transition-colors"
                                    >
                                        <FaWhatsapp className="text-green-600 dark:text-green-400" size={12} />
                                    </a>
                                </div>
                            </td>
                            <td className="p-4 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-400 dark:text-white/50" />
                                    {student.government}
                                </div>
                            </td>
                            <td className="p-4 text-gray-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-400 dark:text-white/50" />
                                    {formatDate(student.lastActive)}
                                </div>
                            </td>
                            <td className="p-4 text-gray-900 dark:text-white">
                                {student.deviceInfo ? (
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const deviceInfo = getDeviceInfo(student.deviceInfo);
                                            const DeviceIcon = deviceInfo.icon;
                                            return (
                                                <>
                                                    <DeviceIcon size={14} className="text-gray-400 dark:text-white/50" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs">{deviceInfo.browser}</span>
                                                        <span className="text-xs text-gray-500 dark:text-white/50">{deviceInfo.os}</span>
                                                    </div>
                                                    {student.hasActiveSession && (
                                                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full" title="جلسة نشطة" />
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <span className="text-gray-300 dark:text-white/30 text-xs">لا يوجد</span>
                                )}
                            </td>
                            <td className="p-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-arabicUI3 ${student.isBanned
                                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                                    }`}>
                                    {student.isBanned ? 'محظور' : 'نشط'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedStudent(student)}
                                        className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStudent(student);
                                            setShowBanConfirm(true);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${student.isBanned
                                            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <Ban size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStudent(student);
                                            setShowPasswordReset(true);
                                        }}
                                        className="p-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors"
                                    >
                                        <Key size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Loading skeleton
    if (loading) {
        return (
            <div className="grid font-arabicUI3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="animate-pulse bg-white/5 rounded-2xl p-6">
                        <div className="flex space-x-4">
                            <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-white/10 rounded"></div>
                                    <div className="h-3 bg-white/10 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Pagination component with smart page display
    const Pagination = () => {
        const getVisiblePages = () => {
            const delta = 2;
            const range = [];
            const rangeWithDots = [];

            for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                range.push(i);
            }

            if (page - delta > 2) {
                rangeWithDots.push(1, '...');
            } else {
                rangeWithDots.push(1);
            }

            rangeWithDots.push(...range);

            if (page + delta < totalPages - 1) {
                rangeWithDots.push('...', totalPages);
            } else {
                rangeWithDots.push(totalPages);
            }

            return rangeWithDots;
        };

        return (
            <div className="mt-6 flex font-arabicUI3 items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600 dark:text-white/60 order-1">
                    عرض {((page - 1) * limit) + 1} إلى {Math.min(page * limit, totalStudents)} من {totalStudents} طالب
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-2 flex-wrap">
                    <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${page === 1
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/30 cursor-not-allowed'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                            } transition-colors`}
                    >
                        السابق
                    </button>

                    {totalPages <= 7 ? (
                        // Show all pages if 7 or fewer
                        [...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => setPage(index + 1)}
                                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm ${page === index + 1
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                                    } transition-colors`}
                            >
                                {index + 1}
                            </button>
                        ))
                    ) : (
                        // Show smart pagination with ellipsis
                        getVisiblePages().map((pageNum, index) => {
                            if (pageNum === '...') {
                                return (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="px-1 sm:px-2 py-1 text-gray-400 dark:text-white/40 text-xs sm:text-sm"
                                    >
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm ${page === pageNum
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                                        } transition-colors`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })
                    )}

                    <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${page === totalPages
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/30 cursor-not-allowed'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'
                            } transition-colors`}
                    >
                        التالي
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container font-arabicUI3 mx-auto p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-arabicUI3 text-gray-900 dark:text-white">إدارة الطلاب</h1>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                >
                    <Download size={18} />
                    تصدير إلى Excel
                </button>
            </div>

            {/* Analytics Section */}
            <AnalyticsSection />

            {/* Charts Section */}
            <ChartsSection />

            {/* View Toggle */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70'}`}
                >
                    عرض البطاقات
                </button>
                <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-xl transition-colors ${viewMode === 'table' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70'}`}
                >
                    عرض الجدول
                </button>
            </div>

            {/* Existing Search and Filter Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-arabicUI3 text-gray-900 dark:text-white mb-6">إدارة الطلاب</h1>
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50" size={20} />
                            <input
                                type="text"
                                placeholder="البحث عن طالب..."
                                value={tempSearchInput}
                                onChange={(e) => setTempSearchInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-10 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 focus:outline-none focus:border-gray-400 dark:focus:border-white/30"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            بحث
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50" size={16} />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-10 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-white/30 appearance-none"
                        >
                            <option className='text-black' value="all">جميع الطلاب</option>
                            <option className='text-black' value="active">نشط</option>
                            <option className='text-black' value="banned">محظور</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Display */}
            {viewMode === 'grid' ? (
                // Existing Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map(student => (
                        <div
                            key={student._id}
                            dir='rtl'
                            onClick={() => setSelectedStudent(student)}
                            className={`group bg-gray-100 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all cursor-pointer
                                ${student.isBanned
                                    ? 'border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-500/5'
                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        >
                            {/* Student Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-600 dark:to-indigo-600 flex items-center justify-center">
                                        <User className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-arabicUI3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{student.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FaGraduationCap className="text-gray-500 dark:text-white/60" size={14} />
                                            <span className="text-sm text-gray-500 dark:text-white/60">{student.level}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <span className={`px-3 py-1 rounded-full text-xs 
                                    ${student.isBanned
                                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                        : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                                    {student.isBanned ? 'محظور' : 'نشط'}
                                </span>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/70">
                                    <Mail size={14} className="text-gray-400 dark:text-white/50" />
                                    <span>{student.email}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Phone size={14} className="text-gray-400 dark:text-white/50" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700 dark:text-white/70"> الطالب:{student.phoneNumber}</span>
                                        {student.phoneNumber && (
                                            <a
                                                href={getWhatsAppLink(student.phoneNumber)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                <FaWhatsapp className="text-green-600 dark:text-green-400" size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {student.parentPhoneNumber && (
                                    <div className="flex items-center gap-3">
                                        <Phone size={14} className="text-gray-400 dark:text-white/50" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700 dark:text-white/70">ولي الأمر: {student.parentPhoneNumber}</span>
                                            <a
                                                href={getWhatsAppLink(student.parentPhoneNumber)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                <FaWhatsapp className="text-green-600 dark:text-green-400" size={14} />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/70">
                                    <MapPin size={14} className="text-gray-400 dark:text-white/50" />
                                    <span>{student.government}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/70">
                                    <Clock size={14} className="text-gray-400 dark:text-white/50" />
                                    <span>آخر نشاط: {formatDate(student.lastActive)}</span>
                                </div>

                                {/* Device Information */}
                                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/70">
                                    {student.deviceInfo ? (
                                        <>
                                            {(() => {
                                                const deviceInfo = getDeviceInfo(student.deviceInfo);
                                                const DeviceIcon = deviceInfo.icon;
                                                return (
                                                    <>
                                                        <DeviceIcon size={14} className="text-gray-400 dark:text-white/50" />
                                                        <div className="flex items-center gap-2">
                                                            <span>{deviceInfo.browser} - {deviceInfo.os}</span>
                                                            {student.hasActiveSession && (
                                                                <div className="flex items-center gap-2 ml-2">
                                                                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                                                                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">جلسة نشطة</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <>
                                            <Monitor size={14} className="text-gray-400 dark:text-white/50" />
                                            <span className="text-gray-400 dark:text-white/50">لا يوجد معلومات جهاز</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStudent(student);
                                        setShowBanConfirm(true);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${student.isBanned
                                        ? 'bg-green-100 dark:bg-green-500 hover:bg-green-200 dark:hover:bg-green-600 text-green-600 dark:text-white'
                                        : 'bg-red-100 dark:bg-red-500 hover:bg-red-200 dark:hover:bg-red-600 text-red-600 dark:text-white'
                                        }`}
                                    title={student.isBanned ? 'إلغاء الحظر' : 'حظر الطالب'}
                                >
                                    <Ban size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStudent(student);
                                        setShowPasswordReset(true);
                                    }}
                                    className="p-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors"
                                    title="إعادة تعيين كلمة المرور"
                                >
                                    <Key size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <TableView />
            )}

            <Pagination />

            {/* Ban Confirmation Modal */}
            {showBanConfirm && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
                        <h3 className="text-xl  font-arabicUI3 text-white mb-4">
                            {selectedStudent.isBanned ? 'إلغاء حظر الطالب' : 'حظر الطالب'}
                        </h3>

                        {!selectedStudent.isBanned && (
                            <textarea
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="سبب الحظر..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30 mb-4"
                                rows={3}
                            />
                        )}

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowBanConfirm(false);
                                    setBanReason('');
                                }}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => toggleBanStatus(selectedStudent._id, banReason)}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                            >
                                {selectedStudent.isBanned ? 'إلغاء الحظر' : 'تأكيد الحظر'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Password Reset Modal */}
            {showPasswordReset && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
                        <h3 className="text-xl  font-arabicUI3 text-white mb-4">
                            إعادة تعيين كلمة مرور الطالب
                        </h3>

                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-white/60 mb-1 text-sm">
                                    كلمة المرور الجديدة
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
                                    placeholder="أدخل كلمة المرور الجديدة"
                                />
                            </div>
                            <div>
                                <label className="block text-white/60 mb-1 text-sm">
                                    تأكيد كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
                                    placeholder="أعد إدخال كلمة المرور الجديدة"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowPasswordReset(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handlePasswordReset}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all"
                                disabled={passwordResetLoading}
                            >
                                {passwordResetLoading ? 'جاري إعادة التعيين...' : 'تأكيد إعادة التعيين'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {selectedStudent && !showBanConfirm && !showPasswordReset && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-4xl w-full mx-4">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                    <User className="text-white" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl  font-arabicUI3 text-white">{selectedStudent.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FaGraduationCap className="text-white/60" />
                                        <span className="text-white/60">{selectedStudent.level}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm ${selectedStudent.isBanned
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {selectedStudent.isBanned ? 'محظور' : 'نشط'}
                                </span>
                            </div>
                        </div>

                        {/* Student Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">البريد الإلكتروني</h4>
                                    <p className="text-white flex items-center gap-2">
                                        <Mail size={16} className="text-white/50" />
                                        {selectedStudent.email}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">رقم الهاتف</h4>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-white/50" />
                                        <p className="text-white">{selectedStudent.phoneNumber}</p>
                                        {selectedStudent.phoneNumber && (
                                            <a
                                                href={getWhatsAppLink(selectedStudent.phoneNumber)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                <FaWhatsapp className="text-green-400" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">رقم هاتف ولي الأمر</h4>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-white/50" />
                                        <p className="text-white">{selectedStudent.parentPhoneNumber || 'غير متوفر'}</p>
                                        {selectedStudent.parentPhoneNumber && (
                                            <a
                                                href={getWhatsAppLink(selectedStudent.parentPhoneNumber)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                                            >
                                                <FaWhatsapp className="text-green-400" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">المحافظة</h4>
                                    <p className="text-white flex items-center gap-2">
                                        <MapPin size={16} className="text-white/50" />
                                        {selectedStudent.government}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">تاريخ التسجيل</h4>
                                    <p className="text-white flex items-center gap-2">
                                        <Clock size={16} className="text-white/50" />
                                        {formatDate(selectedStudent.createdAt)}
                                    </p>
                                </div>                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">آخر نشاط</h4>
                                    <p className="text-white flex items-center gap-2">
                                        <Clock size={16} className="text-white/50" />
                                        {formatDate(selectedStudent.lastActive)}
                                    </p>
                                </div>

                                {/* Device Information */}
                                <div>
                                    <h4 className="text-white/60 mb-1 text-sm">معلومات الجهاز</h4>
                                    {selectedStudent.deviceInfo ? (
                                        <>
                                            {(() => {
                                                const deviceInfo = getDeviceInfo(selectedStudent.deviceInfo);
                                                const DeviceIcon = deviceInfo.icon;
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <DeviceIcon size={16} className="text-white/50" />
                                                            <span className="text-white">{deviceInfo.browser} - {deviceInfo.os}</span>
                                                            {selectedStudent.hasActiveSession && (
                                                                <div className="flex items-center gap-2 ml-2">
                                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                                                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">جلسة نشطة</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {selectedStudent.sessionCreatedAt && (
                                                            <p className="text-sm text-white/50">
                                                                آخر جلسة: {formatDate(selectedStudent.sessionCreatedAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <p className="text-white/50 flex items-center gap-2">
                                            <Monitor size={16} className="text-white/50" />
                                            لا يوجد معلومات جهاز
                                        </p>
                                    )}
                                </div>

                                {selectedStudent.isBanned && selectedStudent.banReason && (
                                    <div>
                                        <h4 className="text-white/60 mb-1 text-sm">سبب الحظر</h4>
                                        <p className="text-red-400 flex items-center gap-2">
                                            <AlertCircle size={16} className="text-red-400" />
                                            {selectedStudent.banReason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                إغلاق
                            </button>
                            <button
                                onClick={() => setShowPasswordReset(true)}
                                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center gap-2"
                            >
                                <Key size={16} />
                                تغيير كلمة المرور
                            </button>
                            <button
                                onClick={() => {
                                    setShowBanConfirm(true);
                                }}
                                className={`px-4 py-2 rounded-xl transition-all ${selectedStudent.isBanned
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                            >
                                {selectedStudent.isBanned ? 'إلغاء الحظر' : 'حظر الطالب'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Password Reset Modal */}
            {showPasswordReset && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 max-w-md w-full mx-4">
                        <h3 className="text-xl font-arabicUI3 text-white mb-4">
                            تغيير كلمة المرور للطالب: {selectedStudent.name}
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-white/70 mb-2">كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
                                    placeholder="أدخل كلمة المرور الجديدة..."
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-white/70 mb-2">تأكيد كلمة المرور</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/30"
                                    placeholder="أعد إدخال كلمة المرور..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowPasswordReset(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                                disabled={passwordResetLoading}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handlePasswordReset}
                                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-2"
                                disabled={passwordResetLoading}
                            >
                                {passwordResetLoading ? 'جاري التحديث...' : 'تأكيد تغيير كلمة المرور'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}