'use client'
import { useState, useEffect, useMemo } from 'react';
import { Book, Play, Calendar, Clock, ChevronRight, FileText } from 'lucide-react';
import { FaAtom, FaFlask, FaMicroscope, FaSquareRootAlt, FaInfinity, FaCalculator } from "react-icons/fa";
import { GiMolecule } from "react-icons/gi";
import Cookies from 'js-cookie';
import axios from 'axios';
import Link from 'next/link';

export default function MyCourses({ onBack }) {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [enrolledPackages, setEnrolledPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [activeTab, setActiveTab] = useState('chapters');
    const [activeView, setActiveView] = useState('courses'); // 'courses' or 'packages'

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

        // Check less frequently to reduce performance impact (1000ms instead of 100ms)
        const interval = setInterval(() => {
            const savedTheme = localStorage.getItem('theme');
            const isDark = savedTheme === 'dark';
            if (isDark !== isDarkMode) {
                setIsDarkMode(isDark);
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            clearInterval(interval);
        };
    }, [isDarkMode]);

    // Chemistry background component


    useEffect(() => {
        // Fetch data only once when component mounts
        fetchData();
    }, []);

    // Combined fetch function to improve performance
    const fetchData = async () => {
        setIsLoading(true);

        try {
            // Process both requests in parallel
            await Promise.all([
                fetchEnrolledCourses(),
                fetchEnrolledPackages()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEnrolledCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/active`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.isHeEnrolled && response.data.coursesAreEnrolled?.length > 0) {
                // Filter out courses with null courseId and ensure courseId has required properties
                const validCourses = response.data.coursesAreEnrolled
                    .filter(course => course.courseId !== null)
                    .map(course => ({
                        ...course,
                        courseId: {
                            ...course.courseId,
                            name: course.courseId?.name || 'كورس',
                            description: course.courseId?.description || '',
                            level: course.courseId?.level || '',
                            chapters: course.courseId?.chapters || [],
                            _id: course.courseId?._id || ''
                        },
                        // If this course came from a package, keep that information
                        fromPackage: course.fromPackage || false,
                        packageName: course.packageName || null
                    }));

                setEnrolledCourses(validCourses);
            } else {
                setEnrolledCourses([]);
            }
        } catch (err) {
            console.error('Error fetching enrolled courses:', err);
            setError('فشل في تحميل الكورسات المشترك بها. يرجى المحاولة مرة أخرى.');
        }
    };

    const fetchEnrolledPackages = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/active/packages/all`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.hasEnrolledPackages) {
                // Validate package data before setting state
                const validPackages = response.data.packages.map(pkg => ({
                    ...pkg,
                    courses: pkg.courses || [],
                    packageName: pkg.packageName || 'باقة',
                    packageDescription: pkg.packageDescription || '',
                    packagePrice: pkg.packagePrice || 0,
                    enrolledAt: pkg.enrolledAt || new Date().toISOString()
                }));

                setEnrolledPackages(validPackages);
            } else {
                setEnrolledPackages([]);
            }
        } catch (err) {
            console.error('Error fetching enrolled packages:', err);
            // Don't set global error here to avoid overriding more important errors
            console.warn('Failed to fetch packages but continuing with courses');
        }
    };


    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Select a course to view details
    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
        setSelectedPackage(null);
    };

    // Select a package to view details
    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        setSelectedCourse(null);
    };

    // Return to course/package list
    const handleBackToList = () => {
        setSelectedCourse(null);
        setSelectedPackage(null);
    };

    // Course subject icon mapper
    const getSubjectIcon = (courseName = '') => {
        if (!courseName) return <GiMolecule className="text-indigo-400" size={28} />;

        if (courseName.includes("كيمياء")) {
            return <FaFlask className="text-green-400" size={28} />;
        } else if (courseName.includes("فيزياء")) {
            return <FaAtom className="text-blue-400" size={28} />;
        } else if (courseName.includes("أحياء")) {
            return <FaMicroscope className="text-purple-400" size={28} />;
        } else {
            return <GiMolecule className="text-indigo-400" size={28} />;
        }
    };

    // Empty state component
    const EmptyCoursesState = ({ type = 'courses' }) => (
        <div className="bg-white/80 border-gray-200 dark:bg-white/10 dark:border-white/20 backdrop-blur-xl rounded-2xl p-8 border text-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-600/30 flex items-center justify-center">
                    <Book size={36} className="text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-2xl font-arabicUI2 text-gray-900 dark:text-white/90">
                    {type === 'courses' ? 'لم تشترك في أي كورسات بعد' : 'لم تشترك في أي باقات بعد'}
                </h3>
                <p className="text-gray-600 dark:text-white/70 max-w-md mx-auto">
                    {type === 'courses'
                        ? 'استكشف مجموعتنا الواسعة من الكورسات التعليمية واشترك فيما يناسب احتياجاتك التعليمية.'
                        : 'باقاتنا التعليمية توفر لك مجموعة متكاملة من الكورسات بسعر مخفض. استكشف الباقات المتاحة واستفد من العروض.'}
                </p>
                <Link href="/">
                    <button className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2">
                        <span>{type === 'courses' ? 'استكشف الكورسات المتاحة' : 'استكشف الباقات المتاحة'}</span>
                        <ChevronRight size={18} />
                    </button>
                </Link>
            </div>
        </div>
    );

    // Render course cards with the new design
    const renderCourseList = () => (
        <>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden mb-6 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />

                <div className="relative">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                            <Book className="text-3xl text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-arabicUI3">كورساتي</h1>
                            <p className="text-blue-100 mt-1">الكورسات والباقات التي قمت بالاشتراك بها</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-2">
                            <FileText size={18} className="text-white/70" />
                            <h3 className="text-lg font-arabicUI3">{enrolledCourses.length} كورسات مشترك بها</h3>
                        </div>

                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-2">
                            <FileText size={18} className="text-white/70" />
                            <h3 className="text-lg font-arabicUI3">{enrolledPackages.length} باقات مشترك بها</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-white/10 backdrop-blur-md rounded-xl p-1">
                <button
                    onClick={() => setActiveView('courses')}
                    className={`flex-1 py-3 rounded-lg text-center transition-all ${activeView === 'courses'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-white/70 hover:text-white/90'
                        }`}
                >
                    الكورسات
                </button>
                <button
                    onClick={() => setActiveView('packages')}
                    className={`flex-1 py-3 rounded-lg text-center transition-all ${activeView === 'packages'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'text-white/70 hover:text-white/90'
                        }`}
                >
                    الباقات
                </button>
            </div>

            {activeView === 'courses' ? (
                enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {enrolledCourses.map((course) => (
                            <div
                                key={course._id}
                                className="group bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-white/10 dark:border-white/20 dark:hover:border-white/40 backdrop-blur-xl rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer hover:transform hover:scale-105 shadow-lg"
                            >
                                <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />

                                    <div className="relative flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
                                            {getSubjectIcon(course.courseId?.name || '')}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-arabicUI2 text-white group-hover:text-blue-300 transition-colors duration-300">
                                                {course.courseId?.name || 'كورس'}
                                            </h3>
                                            <p className="text-blue-100 text-sm">{course.courseId?.level || ''}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-gray-700 dark:text-white/80 mb-4 line-clamp-2">{course.courseId?.description || 'لا يوجد وصف'}</p>

                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-xs flex items-center gap-1 text-gray-600 dark:text-white/70">
                                            <Calendar size={12} />
                                            <span>تاريخ الاشتراك: {formatDate(course.enrolledAt)}</span>
                                        </div>

                                        {course.fromPackage ? (
                                            <div className="bg-purple-100 dark:bg-purple-900/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 text-purple-600 dark:text-purple-300">
                                                <Book size={12} />
                                                <span>من باقة: {course.packageName || 'باقة'}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-xs flex items-center gap-1 text-gray-600 dark:text-white/70">
                                                <Clock size={12} />
                                                <span>حالة الدفع: {course.paymentStatus === 'paid' ? 'مدفوع' : 'قيد الانتظار'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                                            <span className="text-gray-600 dark:text-white/70 text-sm">{course.courseId?.chapters?.length || 0} فصول</span>
                                        </div>

                                        <Link href={`/Courses/${course.courseId?._id || ''}`}>
                                            <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white text-sm flex items-center gap-1 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
                                                <span>عرض الكورس</span>
                                                <Play size={14} />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyCoursesState type="courses" />
                )
            ) : (
                enrolledPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {enrolledPackages.map((pkg) => (
                            <div
                                key={pkg.packageId}
                                onClick={() => handleSelectPackage(pkg)}
                                className="group bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-white/10 dark:border-white/20 dark:hover:border-white/40 backdrop-blur-xl rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer hover:transform hover:scale-105 shadow-lg"
                            >
                                <div className="relative h-40 bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />

                                    <div className="relative flex items-center gap-4">
                                        <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
                                            <Book size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-arabicUI2 text-white group-hover:text-pink-200 transition-colors duration-300">
                                                {pkg.packageName || 'باقة'}
                                            </h3>
                                            <p className="text-pink-100 text-sm">{(pkg.courses?.length || 0)} كورسات</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-gray-700 dark:text-white/80 mb-4 line-clamp-2">{pkg.packageDescription || 'لا يوجد وصف'}</p>

                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-xs flex items-center gap-1 text-gray-600 dark:text-white/70">
                                            <Calendar size={12} />
                                            <span>تاريخ الاشتراك: {formatDate(pkg.enrolledAt || new Date())}</span>
                                        </div>

                                        <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-xs flex items-center gap-1 text-gray-600 dark:text-white/70">
                                            <Clock size={12} />
                                            <span>السعر: {pkg.packagePrice || 0} جنيه</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <FileText size={14} className="text-purple-600 dark:text-purple-400" />
                                            <span className="text-gray-600 dark:text-white/70 text-sm">{pkg.courses?.length || 0} كورسات</span>
                                        </div>

                                        <button className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-sm flex items-center gap-1 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all">
                                            <span>عرض الباقة</span>
                                            <Play size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyCoursesState type="packages" />
                )
            )}
        </>
    );

    // Render course details (placeholder for future enhancement)
    const renderCourseDetails = () => (
        <div className="bg-white/80 border-gray-200 dark:bg-white/10 dark:border-white/20 backdrop-blur-xl rounded-2xl p-8 border">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-all text-gray-700 dark:text-white"
                >
                    <ChevronRight size={20} />
                    <span>العودة للكورسات</span>
                </button>
                <h2 className="text-2xl font-arabicUI3 text-gray-900 dark:text-white">{selectedCourse?.courseId.name}</h2>
            </div>
            <p className="text-gray-600 dark:text-white/70">تفاصيل الكورس ستكون متاحة قريباً...</p>
        </div>
    );

    // Render package details with its courses
    const renderPackageDetails = () => {
        if (!selectedPackage) return null;

        return (
            <div className="bg-white/80 border-gray-200 dark:bg-white/10 dark:border-white/20 backdrop-blur-xl rounded-2xl p-8 border">
                {/* Package Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-all text-gray-700 dark:text-white"
                    >
                        <ChevronRight size={20} />
                        <span>العودة للقائمة</span>
                    </button>
                    <h2 className="text-2xl font-arabicUI3 text-gray-900 dark:text-white">{selectedPackage.packageName || 'باقة'}</h2>
                </div>

                {/* Package Details */}
                <div className="mb-8">
                    <p className="text-gray-600 dark:text-white/70 mb-4">{selectedPackage.packageDescription || 'لا يوجد وصف'}</p>

                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-lg text-sm flex items-center gap-1 text-gray-600 dark:text-white/70">
                            <Calendar size={16} />
                            <span>تاريخ الاشتراك: {formatDate(selectedPackage.enrolledAt || new Date())}</span>
                        </div>

                        <div className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-lg text-sm flex items-center gap-1 text-gray-600 dark:text-white/70">
                            <Clock size={16} />
                            <span>السعر: {selectedPackage.packagePrice || 0} جنيه</span>
                        </div>
                    </div>
                </div>

                {/* Courses in Package Section */}
                <div>
                    <h3 className="text-xl font-arabicUI3 text-gray-900 dark:text-white mb-4">الكورسات المتضمنة في الباقة:</h3>

                    {selectedPackage.courses && selectedPackage.courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedPackage.courses.map((course) => (
                                <div
                                    key={course._id || Math.random().toString()}
                                    className="group bg-white/80 border-gray-200 hover:border-gray-300 dark:bg-white/10 dark:border-white/20 dark:hover:border-white/40 backdrop-blur-xl rounded-2xl border transition-all duration-500 overflow-hidden shadow-lg"
                                >
                                    <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-6 -translate-x-6" />

                                        <div className="relative flex items-center gap-3">
                                            <div className="h-14 w-14 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
                                                {getSubjectIcon(course.name)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-arabicUI2 text-white group-hover:text-blue-300 transition-colors duration-300">
                                                    {course.name || 'كورس'}
                                                </h3>
                                                <p className="text-blue-100 text-sm">{course.level || ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <p className="text-gray-700 dark:text-white/80 mb-3 line-clamp-2 text-sm">{course.description || 'لا يوجد وصف'}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                                                <span className="text-gray-600 dark:text-white/70 text-sm">{course.chapters?.length || 0} فصول</span>
                                            </div>

                                            <Link href={`/Courses/${course._id || ''}`}>
                                                <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white text-sm flex items-center gap-1 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
                                                    <span>عرض الكورس</span>
                                                    <Play size={14} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white/10 dark:bg-white/5 rounded-xl">
                            <p className="text-gray-600 dark:text-white/70">لا توجد كورسات في هذه الباقة</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen font-arabicUI3 relative" dir="rtl">

            <div className="relative z-20 container mx-auto px-4 py-8">
                {/* Back to profile button */}
                {!selectedCourse && !selectedPackage && (
                    <div className="flex justify-start mb-6">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        >
                            <ChevronRight size={20} className="text-white" />
                            <span className="text-white">العودة للملف الشخصي</span>
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/20 backdrop-blur-xl rounded-xl p-4 text-white text-center">
                        {error}
                    </div>
                ) : selectedCourse ? (
                    renderCourseDetails()
                ) : selectedPackage ? (
                    renderPackageDetails()
                ) : (
                    renderCourseList()
                )}
            </div>
        </div>
    );
}