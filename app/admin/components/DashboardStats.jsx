'use client'
import {
    Users, CheckCircle, CreditCard, AlertTriangle,
    TrendingUp, Activity, Award, GraduationCap,
    BarChart2, PieChart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { toast } from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const DashboardStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        newStudents: 0,
        totalRevenue: 0,
        pendingEnrollments: 0,
        completionRate: 0,
        monthlyActiveUsers: 0,
        highEngagement: 0,
        averageExamScore: 0,
        governmentDistribution: [],
        levelDistribution: []
    });
    const [signupData, setSignupData] = useState({
        labels: [],
        datasets: []
    });


    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Fetch all dashboard stats in a single request
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/dashboard`, { headers });
            const data = await response.json();

            if (!data.success) throw new Error('Failed to load dashboard stats');
            const d = data.data;

            // Process signup data for the chart
            if (d.signups && Array.isArray(d.signups)) {
                const labels = d.signups.map(item => {
                    const date = new Date(item._id);
                    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                });
                const values = d.signups.map(item => item.count);

                setSignupData({
                    labels,
                    datasets: [
                        {
                            label: 'الطلاب الجدد',
                            data: values,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            tension: 0.4,
                        }
                    ]
                });
            }

            setStats({
                totalStudents: d.totalStudents || 0,
                newStudents: d.newStudents || 0,
                totalRevenue: d.totalRevenue || 0,
                pendingEnrollments: d.pendingEnrollments || 0,
                completionRate: d.completionRate || 0,
                monthlyActiveUsers: d.monthlyActiveUsers || 0,
                highEngagement: d.highEngagement || 0,
                averageExamScore: d.averageExamScore || 0,
                governmentDistribution: d.governmentDistribution || [],
                levelDistribution: d.levelDistribution || []
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('حدث خطأ في تحميل الإحصائيات');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600 dark:text-white/80">جاري التحميل...</span>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 font-arabicUI3 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-500">
                                <Users className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <span className="text-3xl font-arabicUI3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                                {stats.newStudents}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-white/60 mt-1">طالب جديد</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-gray-600 dark:text-white/80 font-arabicUI3 group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-500">الطلاب الجدد في آخر 7 أيام</p>
                </div>

                {/* Completion Rate */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                            <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                            </div>
                            <span className="text-3xl font-arabicUI3 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                                {stats.completionRate}%
                            </span>
                            <span className="text-sm text-gray-500 dark:text-white/60 mt-1">معدل الإكمال</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-gray-600 dark:text-white/80 font-arabicUI3 group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-500">معدل إكمال الكورسات</p>
                </div>

                {/* Total Revenue */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                            <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-500">
                                <CreditCard className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                            <span className="text-3xl font-arabicUI3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                                {stats.totalRevenue} ج.م
                            </span>
                            <span className="text-sm text-gray-500 dark:text-white/60 mt-1">الإيرادات</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-gray-600 dark:text-white/80 font-arabicUI3 group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-500">إجمالي الإيرادات</p>
                </div>

                {/* Pending Requests */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="relative w-full aspect-square flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                            <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 transform group-hover:scale-110 transition-transform duration-500">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400" size={24} />
                            </div>
                            <span className="text-3xl font-arabicUI3 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                                {stats.pendingEnrollments}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-white/60 mt-1">طلب معلق</span>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-gray-600 dark:text-white/80 font-arabicUI3 group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-500">الطلبات المعلقة</p>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                {/* Monthly Active Users */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-white/10 flex items-center justify-center">
                            <Activity className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <span className="text-2xl font-arabicUI3 text-indigo-600 dark:text-indigo-400">
                            {stats.monthlyActiveUsers}
                        </span>
                    </div>
                    <h4 className="text-gray-600 dark:text-white/80 font-arabicUI3">المستخدمين النشطين شهرياً</h4>
                </div>

                {/* High Engagement Users */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="text-rose-600 dark:text-rose-400" size={24} />
                        </div>
                        <span className="text-2xl font-arabicUI3 text-rose-600 dark:text-rose-400">
                            {stats.highEngagement}
                        </span>
                    </div>
                    <h4 className="text-gray-600 dark:text-white/80 font-arabicUI3">الطلاب الأكثر نشاطاً</h4>
                </div>

                {/* Average Exam Score */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-white/10 flex items-center justify-center">
                            <Award className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <span className="text-2xl font-arabicUI3 text-emerald-600 dark:text-emerald-400">
                            {stats.averageExamScore}%
                        </span>
                    </div>
                    <h4 className="text-gray-600 dark:text-white/80 font-arabicUI3">متوسط درجات الاختبارات</h4>
                </div>

                {/* Student Level */}
                <div className="group bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/40 transition-all duration-500 hover:transform hover:scale-105 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-cyan-50 dark:bg-white/10 flex items-center justify-center">
                            <GraduationCap className="text-cyan-600 dark:text-cyan-400" size={24} />
                        </div>
                        <span className="text-2xl font-arabicUI3 text-cyan-600 dark:text-cyan-400">
                            {stats.levelDistribution?.length || 0}
                        </span>
                    </div>
                    <h4 className="text-gray-600 dark:text-white/80 font-arabicUI3">المستويات الدراسية</h4>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Student Signups Chart */}
                <div className="bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-white/20 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all duration-500 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-arabicUI3 text-gray-800 dark:text-white/90">
                            إحصائيات تسجيل الطلاب الجدد آخر 30 يوم
                        </h3>
                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                    </div>
                    <div className="w-full h-[400px]">
                        <Line
                            data={signupData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(0, 0, 0, 0.1)',
                                        },
                                        ticks: {
                                            color: 'rgb(107, 114, 128)',
                                            font: {
                                                family: 'arabicUI3'
                                            }
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            color: 'rgb(107, 114, 128)',
                                            font: {
                                                family: 'arabicUI3'
                                            }
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: 'rgb(107, 114, 128)',
                                            font: {
                                                family: 'arabicUI3'
                                            }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        bodyFont: {
                                            family: 'arabicUI3'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Government Distribution */}
                <div className="bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-white/20 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all duration-500 shadow-lg group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-arabicUI3 text-gray-800 dark:text-white/90 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                            توزيع الطلاب حسب المحافظة
                        </h3>
                        <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <PieChart className="text-purple-600 dark:text-purple-400" size={20} />
                        </div>
                    </div>
                    <div className="w-full aspect-square">
                        <Pie
                            data={{
                                labels: stats.governmentDistribution?.map(item => item.id) || [],
                                datasets: [{
                                    data: stats.governmentDistribution?.map(item => item.value) || [],
                                    backgroundColor: [
                                        'rgba(147, 51, 234, 0.7)',
                                        'rgba(236, 72, 153, 0.7)',
                                        'rgba(59, 130, 246, 0.7)',
                                        'rgba(16, 185, 129, 0.7)',
                                        'rgba(249, 115, 22, 0.7)',
                                        'rgba(139, 92, 246, 0.7)',
                                        'rgba(14, 165, 233, 0.7)',
                                        'rgba(168, 85, 247, 0.7)',
                                    ],
                                    borderColor: 'rgba(255, 255, 255, 0.8)',
                                    borderWidth: 2,
                                    hoverBorderColor: 'white',
                                    hoverBorderWidth: 3,
                                    hoverOffset: 8
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            font: {
                                                family: 'arabicUI3',
                                                size: 12
                                            },
                                            padding: 20,
                                            usePointStyle: true,
                                            pointStyle: 'circle'
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        bodyFont: {
                                            family: 'arabicUI3'
                                        },
                                        callbacks: {
                                            label: (context) => {
                                                const value = context.raw;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = Math.round((value / total) * 100);
                                                return ` ${context.label}: ${value} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Level Distribution Chart */}
            <div className="mt-6">
                <div className="bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-white/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-500 shadow-lg group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-arabicUI3 text-gray-800 dark:text-white/90 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                            توزيع الطلاب حسب المستوى
                        </h3>
                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <BarChart2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                    </div>
                    <div className="w-full h-[400px]">
                        <Bar
                            data={{
                                labels: stats.levelDistribution?.map(item => item.id) || [],
                                datasets: [{
                                    label: 'عدد الطلاب',
                                    data: stats.levelDistribution?.map(item => item.value) || [],
                                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                                    borderColor: 'rgb(99, 102, 241)',
                                    borderWidth: 2,
                                    borderRadius: 8,
                                    hoverBackgroundColor: 'rgba(99, 102, 241, 0.9)',
                                    barThickness: 32,
                                    maxBarThickness: 48
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(0, 0, 0, 0.05)',
                                            drawBorder: false
                                        },
                                        ticks: {
                                            font: {
                                                family: 'arabicUI3',
                                                size: 12
                                            },
                                            padding: 10,
                                            color: 'rgb(107, 114, 128)'
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            font: {
                                                family: 'arabicUI3',
                                                size: 12
                                            },
                                            padding: 10,
                                            color: 'rgb(107, 114, 128)'
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        bodyFont: {
                                            family: 'arabicUI3'
                                        },
                                        callbacks: {
                                            label: (context) => {
                                                const value = context.raw;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = Math.round((value / total) * 100);
                                                return `عدد الطلاب: ${value} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

        </>
    );
};

export default DashboardStats;