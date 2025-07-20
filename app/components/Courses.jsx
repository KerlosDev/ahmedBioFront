'use client'
import "../globals.css";
import React, { useEffect, useState, useMemo } from 'react'
import { FaBookmark, FaPlay, FaCalculator, FaChartLine } from "react-icons/fa";
import { TbMathFunction, TbMathIntegral } from "react-icons/tb";
import { PiMathOperationsFill } from "react-icons/pi";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiFillStar } from "react-icons/ai";
import { BsBook, BsGraphUp } from "react-icons/bs";
import { FaBook } from "react-icons/fa6";
import { GiTakeMyMoney, GiCheckMark } from 'react-icons/gi';

const Courses = () => {
    const router = useRouter();
    const [datacourse, setDatacourse] = useState([]);
    const [activeLevel, setActiveLevel] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrollmentStatus, setEnrollmentStatus] = useState({});
    const [enrollmentChecking, setEnrollmentChecking] = useState(false);

    useEffect(() => {
        // Check localStorage for enrolled courses
        const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
        const enrollmentMap = {};
        enrolledCourses.forEach(courseId => {
            enrollmentMap[courseId] = true;
        });
        setEnrollmentStatus(enrollmentMap);

        getAllCourses();
    }, []);

    const getAllCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const data = await response.json();
            // Filter out draft courses
            const courses = (data.courses || []).filter(course => !course.isDraft);
            setDatacourse(courses);


        } catch (error) {
            console.error('Error fetching courses:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };



    const handleSubscribe = async (courseId) => {


        const course = datacourse.find(c => c._id === courseId);

        if (course?.isFree || enrollmentStatus) {
            try {
                // Handle free course enrollment
                router.push(`/Courses/${courseId}`);
            } catch (error) {
                console.error('Error enrolling in free course:', error);
            }
        } else {
            // User is authenticated, redirect to payment page
            router.push(`/payment/${courseId}`);
        }
    };

    const levels = useMemo(() => [
        {
            id: 'all',
            name: 'جميع المراحل',
            icon: AiFillStar,
            gradient: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'الصف الأول الثانوي',
            name: 'الصف الأول الثانوي',
            icon: BsBook,
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            id: 'الصف الثاني الثانوي',
            name: 'الصف الثاني الثانوي',
            icon: BsGraphUp,
            gradient: 'from-violet-500 to-purple-600'
        },
        {
            id: 'الصف الثالث الثانوي',
            name: 'الصف الثالث الثانوي',
            icon: FaCalculator,
            gradient: 'from-amber-500 to-orange-600'
        }
    ], []);

    const filterCoursesByLevel = (courses) => {
        if (activeLevel === 'all') return courses;
        return courses.filter(course => course.level === activeLevel);
    }; if (loading) {
        return (
            <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">
                {/* Enhanced Background Elements - Same as main component */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 right-10 w-40 h-40 bg-blue-500/10 backdrop-blur-3xl rounded-full 
                                  flex items-center justify-center animate-float">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-pulse"></div>
                    </div>
                    <div className="absolute top-40 left-20 w-48 h-48 bg-red-500/10 backdrop-blur-3xl rounded-full 
                                  flex items-center justify-center animate-float-delayed">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full animate-pulse"></div>
                    </div>
                    <div className="absolute left-10 bottom-10 w-48 h-48 bg-green-500/10 backdrop-blur-3xl rounded-full 
                                  flex items-center justify-center animate-float-delayed">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full animate-pulse"></div>
                    </div>
                    <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-yellow-500/10 backdrop-blur-3xl rounded-full 
                                  flex items-center justify-center animate-pulse">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-full animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 opacity-10 bg-repeat mix-blend-overlay"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header Section Skeleton */}
                    <div className="text-center mb-8 sm:mb-16">
                        <div className="inline-flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-2 sm:py-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl rounded-2xl
                                      border border-blue-500/20 mb-6">
                            <div className="h-8 sm:h-12 w-32 sm:w-48 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg animate-pulse"></div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/30 rounded-full animate-spin"></div>
                        </div>
                        <div className="h-5 sm:h-6 w-48 sm:w-80 mx-auto bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Level Selection Skeleton */}
                    <div className="mb-12 px-4">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl rounded-2xl">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                                        <div className="w-5 h-5 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse"></div>
                                        <div className={`h-4 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse ${i === 1 ? 'w-20' : i === 2 ? 'w-32' : i === 3 ? 'w-36' : 'w-40'
                                            }`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Course Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 rtl-grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="group relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                                          rounded-xl sm:rounded-2xl overflow-hidden border border-blue-500/20 
                                          transform hover:scale-105 transition-all duration-500">

                                {/* Price Ribbon Skeleton */}
                                <div className="absolute -left-12 top-4 -rotate-45 z-20 py-1 w-40 text-center
                                              bg-gradient-to-r from-yellow-400/60 to-yellow-500/60 animate-pulse">
                                    <div className="h-4 w-16 bg-white/40 rounded mx-auto"></div>
                                </div>

                                {/* Image Section Skeleton */}
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                    <div className="w-full h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse"></div>

                                    {/* Level Badge Skeleton */}
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                            <div className="h-3 w-24 bg-blue-300/60 rounded animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* Top Badge Skeleton */}
                                    <div className="absolute top-4 right-4 z-20 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/60 to-emerald-600/60">
                                        <div className="h-3 w-20 bg-white/40 rounded animate-pulse"></div>
                                    </div>

                                    {/* Math Icon Skeleton */}
                                    <div className="absolute top-4 left-4">
                                        <div className="w-8 h-8 bg-blue-500/30 rounded animate-bounce"></div>
                                    </div>
                                </div>

                                {/* Content Section Skeleton */}
                                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                    {/* Course Title Skeleton */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 sm:h-8 flex-1 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg animate-pulse"></div>
                                        <div className="w-6 h-6 bg-blue-500/30 rounded animate-pulse"></div>
                                    </div>

                                    {/* Description Skeleton */}
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-5/6 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse"></div>
                                        <div className="h-4 w-3/4 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse"></div>
                                    </div>

                                    {/* Features Grid Skeleton */}
                                    <div className="grid grid-cols-3 gap-2 my-4">
                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className="flex flex-col items-center p-2 bg-blue-500/5 rounded-lg">
                                                <div className={`w-5 h-5 mb-1 rounded animate-pulse ${j === 1 ? 'bg-blue-500/40' : j === 2 ? 'bg-red-500/40' : 'bg-yellow-500/40'
                                                    }`}></div>
                                                <div className={`h-2 rounded animate-pulse ${j === 1 ? 'w-12 bg-blue-500/30' : j === 2 ? 'w-16 bg-red-500/30' : 'w-10 bg-yellow-500/30'
                                                    }`}></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Timeline Skeleton */}
                                    <div className="flex flex-col space-y-2">
                                        {[1, 2].map((j) => (
                                            <div key={j} className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border-r-2 ${j === 1 ? 'bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 border-blue-500/50'
                                                    : 'bg-gradient-to-r from-emerald-50/80 to-transparent dark:from-emerald-900/20 border-emerald-500/50'
                                                }`}>
                                                <div className={`w-4 h-4 rounded animate-pulse ${j === 1 ? 'bg-blue-500/40' : 'bg-emerald-500/40'
                                                    }`}></div>
                                                <div className={`h-3 w-24 rounded animate-pulse ${j === 1 ? 'bg-blue-400/30' : 'bg-emerald-400/30'
                                                    }`}></div>
                                                <div className={`h-3 w-20 rounded animate-pulse ml-auto ${j === 1 ? 'bg-blue-500/40' : 'bg-emerald-500/40'
                                                    }`}></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Buttons Skeleton */}
                                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                        {/* View Course Button Skeleton */}
                                        <div className="flex-[2] relative">
                                            <div className="h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-slate-800 dark:to-slate-900 
                                                          border-2 border-blue-400/30 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)]
                                                          dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(30,41,59,0.5)]">
                                                <div className="flex items-center justify-center gap-3 h-full px-6">
                                                    <div className="h-4 w-24 bg-slate-400/40 dark:bg-slate-500/40 rounded animate-pulse"></div>
                                                    <div className="w-3 h-3 bg-blue-500/40 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subscribe Button Skeleton */}
                                        <div className="flex-1 relative">
                                            <div className="h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-slate-800 dark:to-slate-900 
                                                          border-2 border-emerald-400/30 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)]
                                                          dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(30,41,59,0.5)]">
                                                <div className="flex items-center justify-center gap-3 h-full px-6">
                                                    <div className="h-4 w-16 bg-slate-400/40 dark:bg-slate-500/40 rounded animate-pulse"></div>
                                                    <div className="w-4 h-4 bg-emerald-500/40 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Loading Text */}
                    <div className="text-center mt-12">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl rounded-2xl">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-lg font-arabicUI2 text-slate-700 dark:text-slate-300">جاري تحميل الكورسات...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const filteredCourses = filterCoursesByLevel(datacourse); return (
        <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">
            {/* Enhanced Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-10 w-40 h-40 bg-blue-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-float">
                    <TbMathFunction className="text-6xl text-blue-500/50 animate-spin-slow" />
                </div>
                <div className="absolute top-40 left-20 w-48 h-48 bg-red-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-float-delayed">
                    <FaCalculator className="text-7xl text-red-500/50 animate-bounce" />
                </div>
                <div className="absolute left-10 bottom-10 w-48 h-48 bg-green-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-float-delayed">
                    <FaBook className="text-7xl text-green-500/50 animate-bounce" />
                </div>
                {/* New decorative elements */}
                <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-yellow-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-pulse">
                    <TbMathIntegral className="text-5xl text-yellow-500/50 animate-spin" />
                </div>
                <div className="absolute inset-0 opacity-10 bg-repeat mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-16">
                    <div className="inline-flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-2 sm:py-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl rounded-2xl
                                  border border-blue-500/20 mb-6">
                        <h1 className="text-3xl sm:text-5xl font-arabicUI2 text-slate-800 dark:text-white">الكورسات</h1>
                        <FaCalculator className="text-3xl sm:text-4xl text-blue-500 animate-spin-slow" />
                    </div>
                    <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-arabicUI3 mt-4">
                        اختر الكورس المناسب وابدأ رحلة تعلم الرياضيات
                    </p>
                </div>
                {/* Level Selection Tabs */}
                <div className="mb-12 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl rounded-2xl">
                            {levels.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => setActiveLevel(level.id)}
                                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-500
                                        ${activeLevel === level.id ?
                                            'bg-gradient-to-r ' + level.gradient + ' text-white shadow-lg transform -translate-y-0.5' :
                                            'bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80'}`}
                                >
                                    {/* Icon */}
                                    <level.icon className={`text-xl transition-all duration-300 
                                        ${activeLevel === level.id ?
                                            'text-white scale-110' :
                                            'text-slate-600 dark:text-slate-300'}`} />

                                    {/* Level Name */}
                                    <span className={`font-arabicUI2 text-base whitespace-nowrap transition-colors duration-300
                                        ${activeLevel === level.id ?
                                            'text-white font-medium' :
                                            'text-slate-600 dark:text-slate-300'}`}>
                                        {level.name}
                                    </span>

                                    {/* Active Indicator */}
                                    {activeLevel === level.id && (
                                        <>
                                            <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse-subtle"></div>
                                            <div className="absolute -inset-1 bg-white/10 rounded-xl blur-sm"></div>
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Filtered Courses Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 rtl-grid">
                    {filteredCourses.map((item, index) => (
                        <div key={item._id} className={`group relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                                      rounded-xl sm:rounded-2xl overflow-hidden border transform
                                      hover:scale-105 transition-all duration-500 hover:shadow-xl
                                      ${item.level === 'الصف الأول الثانوي' ? 'border-emerald-500/20 hover:border-emerald-400' :
                                item.level === 'الصف الثاني الثانوي' ? 'border-violet-500/20 hover:border-violet-400' :
                                    item.level === 'الصف الثالث الثانوي' ? 'border-amber-500/20 hover:border-amber-400' :
                                        'border-blue-500/20 hover:border-blue-400'
                            }`}>
                            {/* Level Badge */}
                            {/* Price Tag - Ribbon Style */}
                            <div className={`absolute -left-12 top-4 -rotate-45 z-20 py-1 w-40 text-center
                                ${item.isFree ?
                                    'bg-green-500 text-white shadow-green-500/20' :
                                    'bg-yellow-500 text-slate-700  shadow-yellow-500/20'
                                }
                                font-arabicUI2 text-lg shadow-lg`}>
                                {item.isFree ? 'مجاناً' : `${item.price} جنيه`}
                            </div>
                            <div className="relative h-48 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <img
                                    src={item.imageUrl || "/chbg.jpg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/chbg.jpg";
                                    }}
                                />
                                {/* Level Badge */}
                                <div className="absolute font-arabicUI3 bottom-4 left-4 z-20 transform group-hover:-translate-x-1 transition-transform duration-300">
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2
                                        backdrop-blur-md shadow-lg border transition-colors duration-300
                                        ${item.level === 'الصف الأول الثانوي' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 group-hover:bg-emerald-500/30' :
                                            item.level === 'الصف الثاني الثانوي' ? 'bg-violet-500/20 text-violet-300 border-violet-400/30 group-hover:bg-violet-500/30' :
                                                item.level === 'الصف الثالث الثانوي' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30 group-hover:bg-amber-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border-blue-400/30 group-hover:bg-blue-500/30'}`}>
                                        <span className={`w-2 h-2 rounded-full 
                                            ${item.level === 'الصف الأول الثانوي' ? 'bg-emerald-400' :
                                                item.level === 'الصف الثاني الثانوي' ? 'bg-violet-400' :
                                                    item.level === 'الصف الثالث الثانوي' ? 'bg-amber-400' :
                                                        'bg-blue-400'} 
                                            animate-pulse`}></span>
                                        {item.level}
                                    </div>
                                </div>
                               
                                {/* Course Title - Overlay */}
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-500/10 to-transparent" />
                                {/* Math Icon */}
                                <div className="absolute top-4 left-4">
                                    <FaCalculator className="text-3xl text-blue-500 animate-bounce" />
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                {/* Course Title */}
                                <Link href={`/Courses/${item?._id}`}>
                                    <h2 className="text-xl sm:text-2xl font-arabicUI2 text-slate-800 dark:text-white group-hover:text-blue-500
                                                 transition-colors mb-4">
                                        {item?.name}
                                        <FaCalculator className="inline-block mr-2 text-blue-500" />
                                    </h2>
                                </Link>
                                {/* Course Description */}
                                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-arabicUI3 line-clamp-2 sm:line-clamp-3">
                                    {item?.description}
                                </p>
                                {/* Course Features */}
                                <div className="grid grid-cols-3 gap-2 font-arabicUI3 my-4">
                                    <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded-lg">
                                        <TbMathFunction className="text-blue-500 mb-1" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">معادلات</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-red-500/5 rounded-lg">
                                        <FaChartLine className="text-red-500 mb-1" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">رسوم بيانية</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-yellow-500/5 rounded-lg">
                                        <PiMathOperationsFill className="text-yellow-500 mb-1" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">تمارين</span>
                                    </div>
                                </div>
                                {/* Course Stats */}
                                <div className="flex flex-col gap-2">
                                    {/* Course Timeline */}
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center gap-2 py-1.5 px-3 bg-gradient-to-r from-blue-50/80 to-transparent 
                                                    dark:from-blue-900/20 dark:to-transparent rounded-lg border-r-2 border-blue-500/50">
                                            <div className="flex items-center gap-2 min-w-[140px]">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 font-arabicUI3">تاريخ الإنشاء:</span>
                                            </div>
                                            <span className="text-sm text-blue-600 dark:text-blue-400 font-arabicUI2 ml-auto">
                                                {item.createdAt ? new Intl.DateTimeFormat('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }).format(new Date(item.createdAt)) : 'غير محدد'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 py-1.5 px-3 bg-gradient-to-r from-emerald-50/80 to-transparent 
                                                    dark:from-emerald-900/20 dark:to-transparent rounded-lg border-r-2 border-emerald-500/50">
                                            <div className="flex items-center gap-2 min-w-[140px]">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 font-arabicUI3">آخر تحديث:</span>
                                            </div>
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-arabicUI2 ml-auto">
                                                {item.updatedAt ? new Intl.DateTimeFormat('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }).format(new Date(item.updatedAt)) : 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Action Buttons Container */}
                                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                    {/* View Course Button - Takes 2/3 width */}
                                    <Link href={`/Courses/${item?._id}`} className="flex-[2]">
                                        <button className="w-full h-full relative group">
                                            {/* Neumorphic base */}
                                            <div className="absolute inset-0 border-2 group-hover:border-none border-blue-400 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 
                                                          dark:from-slate-800 dark:to-slate-900 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)] 
                                                          dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(30,41,59,0.5)]
                                                          transform group-hover:scale-[0.98] group-active:scale-95 transition-all duration-300"></div>
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 
                                                          dark:from-blue-400/10 dark:to-indigo-400/10 opacity-0 group-hover:opacity-100 
                                                          transition-opacity duration-300 backdrop-blur-sm"></div>
                                            {/* Content container */}
                                            <div className="relative flex items-center justify-center gap-3 px-6 py-3.5">
                                                <span className="font-arabicUI2 text-lg text-slate-700 dark:text-slate-200 
                                                             group-hover:text-blue-600  dark:group-hover:text-blue-400 
                                                             transition-colors duration-300">
                                                    مشاهدة الكورس
                                                </span>
                                                <div className="relative">
                                                    <FaPlay className="text-sm text-blue-500 dark:text-blue-400 
                                                                    group-hover:text-blue-600 dark:group-hover:text-blue-300 
                                                                    transform group-hover:-translate-y-0.5 group-hover:scale-110 
                                                                    transition-all duration-300" />
                                                    <div className="absolute inset-0 blur-sm bg-blue-400/30 dark:bg-blue-300/30 
                                                                opacity-0 group-hover:opacity-100 scale-150 transition-all duration-300"></div>
                                                </div>
                                            </div>
                                        </button>
                                    </Link>
                                    {/* Subscribe Button - Takes 1/3 width */}
                                    {!item.isFree && (
                                        <button
                                            onClick={() => handleSubscribe(item?._id)}
                                            disabled={enrollmentChecking}
                                            className="flex-1 relative group"
                                        >
                                            {/* Neumorphic base - changes color based on enrollment status */}
                                            <div className={`absolute border-2 group-hover:border-none ${enrollmentStatus[item._id] ? 'border-green-400' : 'border-green-400'
                                                } inset-0 rounded-2xl ${enrollmentStatus[item._id]
                                                    ? 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-700/90 dark:to-green-800/40'
                                                    : 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-slate-800 dark:to-slate-900'
                                                } shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.8)]
                                        dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(30,41,59,0.5)]
                                        transform group-hover:scale-[0.98] group-active:scale-95 transition-all duration-300`}></div>

                                            {/* Gradient overlay - changes color based on enrollment status */}
                                            <div className={`absolute inset-[2px] rounded-2xl ${enrollmentStatus[item._id]
                                                ? 'bg-gradient-to-br from-green-500/20 to-indigo-500/20 dark:from-green-400/10 dark:to-indigo-400/10'
                                                : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/10 dark:to-teal-400/10'
                                                } opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm`}></div>

                                            {/* Content container */}
                                            <div className="relative flex items-center justify-center gap-3 px-6 py-3.5">
                                                <span className={`font-arabicUI2 text-lg ${enrollmentStatus[item._id]
                                                    ? 'text-green-700 dark:text-blue-200 group-hover:text-green-600 dark:group-hover:text-green-300'
                                                    : 'text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                                                    } transition-colors duration-300`}>
                                                    {enrollmentStatus[item._id] ? 'مشترك بالفعل' : 'اشترك الآن'}
                                                </span>

                                                <div className="relative">
                                                    {enrollmentStatus[item._id] ? (
                                                        <GiCheckMark className={`text-xl ${enrollmentStatus[item._id]
                                                            ? 'text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300'
                                                            : 'text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                                                            } transform group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300`} />
                                                    ) : (
                                                        <GiTakeMyMoney className="text-xl text-emerald-500 dark:text-emerald-400 
                                                                  group-hover:text-emerald-600 dark:group-hover:text-emerald-300 
                                                                  transform group-hover:-translate-y-1 group-hover:scale-110 
                                                                  transition-all duration-300" />
                                                    )}

                                                    <div className={`absolute inset-0 blur-sm ${enrollmentStatus[item._id]
                                                        ? 'bg-green-400/30 dark:bg-green-300/30'
                                                        : 'bg-emerald-400/30 dark:bg-emerald-300/30'
                                                        } opacity-0 group-hover:opacity-100 scale-150 transition-all duration-300`}></div>
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Empty State */}
                {filterCoursesByLevel(datacourse).length === 0 && (
                    <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 mt-4">
                        <FaBook className="text-5xl text-blue-500/50 mb-4" />
                        <h3 className="text-xl font-arabicUI2 text-slate-700 dark:text-slate-300 mb-2">لا توجد كورسات لهذه المرحلة</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-arabicUI3 text-center">
                            سيتم إضافة كورسات جديدة قريباً. يمكنك اختيار مرحلة أخرى أو العودة لاحقاً.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Courses;