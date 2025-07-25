'use client'

import "../globals.css";
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronDown, ChevronUp, BookOpen, Calendar, Sparkles, TrendingUp, Award, Shield, Tag, Check, Clock, ArrowRight, Search, BookMarked, Star, Gift } from 'lucide-react';
import { MdOutlineDiscount, MdNewReleases, MdStars, MdCastForEducation, MdOutlineCastForEducation } from 'react-icons/md';
import { BsBoxSeam, BsBoxArrowInRight, BsGraphUp, BsBook, BsLightningChargeFill } from 'react-icons/bs';
import { GiTakeMyMoney, GiCheckMark, GiNotebook, GiDiploma, GiAchievement } from 'react-icons/gi';
import { AiFillStar, AiFillFire, AiOutlineRise } from 'react-icons/ai';
import { FaBook, FaCalculator, FaChartLine, FaPlay, FaRegClock, FaGraduationCap, FaCrown } from 'react-icons/fa';
import { TbMathFunction, TbMathIntegral, TbDiscount2 } from "react-icons/tb";
import { PiMathOperationsFill, PiStudentBold } from "react-icons/pi";
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function Packages() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [enrollmentStatus, setEnrollmentStatus] = useState({});
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        // Check login status
        const token = Cookies.get('token');
        setIsLoggedIn(!!token);

        // Get enrollment status from localStorage
        const savedEnrollments = JSON.parse(localStorage.getItem('enrolledPackages') || '[]');
        const enrollmentMap = {};
        savedEnrollments.forEach(packageId => {
            enrollmentMap[packageId] = true;
        });
        setEnrollmentStatus(enrollmentMap);

        // Listen for changes to enrollment status
        const handleStorageChange = () => {
            const savedEnrollments = JSON.parse(localStorage.getItem('enrolledPackages') || '[]');
            const enrollmentMap = {};
            savedEnrollments.forEach(packageId => {
                enrollmentMap[packageId] = true;
            });
            setEnrollmentStatus(enrollmentMap);
        };

        const handleEnrollmentUpdate = () => {
            const savedEnrollments = JSON.parse(localStorage.getItem('enrolledPackages') || '[]');
            const enrollmentMap = {};
            savedEnrollments.forEach(packageId => {
                enrollmentMap[packageId] = true;
            });
            setEnrollmentStatus(enrollmentMap);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('packageEnrollmentUpdated', handleEnrollmentUpdate);

        // Fetch packages
        fetchPackages();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('packageEnrollmentUpdated', handleEnrollmentUpdate);
        };
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`);
            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }
            const data = await response.json();
            setPackages(data.packages || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (packageId) => {
        // Directly go to payment page without login check
        const packageData = packages.find(p => p._id === packageId);

        if (enrollmentStatus[packageId]) {
            // Already enrolled, go to package details or courses
            toast.success('أنت مشترك بالفعل في هذه الحزمة');
            // Redirect to the first course in the package or to a package details page if available
            if (packageData && packageData.courses && packageData.courses.length > 0) {
                router.push(`/Courses/${packageData.courses[0]._id}`);
            } else {
                // Fallback if no courses found or package detail page isn't available
                router.push('/');
            }
        } else {
            // Redirect to payment
            router.push(`/package-payment/${packageId}`);
        }
    };

    // Define package categories
    const categories = useMemo(() => [
        {
            id: 'all',
            name: 'جميع الحزم',
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
        },
        {
            id: 'premium',
            name: 'الحزم المميزة',
            icon: AiFillFire,
            gradient: 'from-rose-500 to-red-600'
        }
    ], []);

    // Filter packages by category
    const filterPackagesByCategory = (packages) => {
        if (activeCategory === 'all') return packages;
        if (activeCategory === 'premium') {
            return packages.filter(pkg => pkg.discountPercentage > 25); // Assuming packages with higher discounts are premium
        }
        return packages.filter(pkg => pkg.level === activeCategory);
    };

    // Calculate how many packages to show
    const displayedPackages = showMore ? filterPackagesByCategory(packages) : filterPackagesByCategory(packages).slice(0, 6);

    if (loading) {
        return (
            <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">
                {/* Enhanced Background Elements */}
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

                    {/* Category Selection Skeleton */}
                    <div className="mb-12 px-4">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl rounded-2xl">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                                        <div className="w-5 h-5 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse"></div>
                                        <div className={`h-4 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded animate-pulse ${i === 1 ? 'w-20' : i === 2 ? 'w-32' : i === 3 ? 'w-36' : 'w-40'
                                            }`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Package Grid Skeleton */}
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
                                <div className="h-48 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600"></div>

                                {/* Content Skeleton */}
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg w-3/4"></div>
                                    <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg w-full"></div>
                                    <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-lg w-5/6"></div>

                                    {/* Features Skeleton */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map((j) => (
                                            <div key={j} className="h-10 bg-gradient-to-r from-slate-300/20 via-slate-200/20 to-slate-300/20 dark:from-slate-600/20 dark:via-slate-700/20 dark:to-slate-600/20 rounded-lg"></div>
                                        ))}
                                    </div>

                                    {/* Price and CTA Skeleton */}
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="h-8 bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-600 rounded-lg w-24"></div>
                                        <div className="h-10 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-700 dark:to-slate-600 rounded-xl w-32"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 mt-4">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">خطأ في تحميل الحزم</h2>
                        <p className="text-slate-700 dark:text-slate-300">{error}</p>
                        <button
                            onClick={fetchPackages}
                            className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (packages.length === 0) {
        return (
            <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 mt-4">
                        <BsBoxSeam className="text-5xl text-blue-500/50 mb-4" />
                        <h3 className="text-xl font-arabicUI3 text-slate-700 dark:text-slate-300 mb-2">لا توجد حزم متاحة حالياً</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-arabicUI3 text-center">
                            سيتم إضافة حزم جديدة قريباً. يرجى العودة لاحقاً.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" className="relative min-h-screen py-8 sm:py-12 px-2 font-arabicUI3 sm:px-4 overflow-hidden">
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
                    <BsBoxSeam className="text-7xl text-green-500/50 animate-bounce" />
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
                        <h1 className="text-3xl sm:text-5xl font-arabicUI3 text-slate-800 dark:text-white">الحزم التعليمية</h1>
                        <BsBoxSeam className="text-3xl sm:text-4xl text-blue-500 animate-spin-slow" />
                    </div>
                    <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-arabicUI3 mt-4">
                        حزم تعليمية مميزة بأسعار مخفضة لتسهيل رحلتك التعليمية
                    </p>
                </div>

                {/* Category Selection Tabs */}
                <div className="mb-12 px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/10 dark:bg-slate-800/10 backdrop-blur-xl rounded-2xl">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-500
                                        ${activeCategory === category.id ?
                                            'bg-gradient-to-r ' + category.gradient + ' text-white shadow-lg transform -translate-y-0.5' :
                                            'bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80'}`}
                                >
                                    {/* Icon */}
                                    <category.icon className={`text-xl transition-all duration-300 
                                        ${activeCategory === category.id ?
                                            'text-white scale-110' :
                                            'text-slate-600 dark:text-slate-300'}`} />

                                    {/* Category Name */}
                                    <span className={`font-arabicUI3 text-base whitespace-nowrap transition-colors duration-300
                                        ${activeCategory === category.id ?
                                            'text-white font-medium' :
                                            'text-slate-600 dark:text-slate-300'}`}>
                                        {category.name}
                                    </span>

                                    {/* Active Indicator */}
                                    {activeCategory === category.id && (
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

                {/* Filtered Packages Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 rtl-grid">
                    {displayedPackages.map((pkg) => (
                        <div key={pkg._id} className={`group relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl
                                      rounded-xl sm:rounded-2xl overflow-hidden border transform
                                      hover:scale-105 transition-all duration-500 hover:shadow-xl
                                      ${pkg.level === 'الصف الأول الثانوي' ? 'border-emerald-500/20 hover:border-emerald-400' :
                                pkg.level === 'الصف الثاني الثانوي' ? 'border-violet-500/20 hover:border-violet-400' :
                                    pkg.level === 'الصف الثالث الثانوي' ? 'border-amber-500/20 hover:border-amber-400' :
                                        'border-blue-500/20 hover:border-blue-400'
                            }`}>
                            {/* Discount Tag - Ribbon Style */}
                            <div className="absolute -left-12 top-4 -rotate-45 z-20 py-1 w-40 text-center
                                          bg-red-500 text-white shadow-red-500/20 font-arabicUI3 text-lg shadow-lg">
                                خصم {pkg.discountPercentage}%
                            </div>


                            <div className="absolute top-4 right-4 z-20">
                                <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 backdrop-blur-sm">
                                    <BookOpen size={14} />
                                    <span>{pkg.courses.length} كورسات</span>
                                </div>
                            </div>




                            <div className="relative h-48 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <img
                                    src={pkg.imageUrl || "/chbg.jpg"}
                                    alt={pkg.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/chbg.jpg";
                                    }}
                                />

                                {/* Premium Badge - Show for packages with high discount */}
                                {pkg.discountPercentage > 25 && (
                                    <div className="absolute bottom-4 right-4 z-20 bg-gradient-to-r from-yellow-400 to-amber-500 
                                              text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1
                                              shadow-lg border border-yellow-300 animate-pulse">
                                        <MdStars className="text-black" />
                                        <span>مميز</span>
                                    </div>
                                )}

                                {/* Level Badge */}
                                <div className="absolute font-arabicUI3 bottom-4 left-4 z-20 transform group-hover:-translate-x-1 transition-transform duration-300">
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2
                                        backdrop-blur-md shadow-lg border transition-colors duration-300
                                        ${pkg.level === 'الصف الأول الثانوي' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 group-hover:bg-emerald-500/30' :
                                            pkg.level === 'الصف الثاني الثانوي' ? 'bg-violet-500/20 text-violet-300 border-violet-400/30 group-hover:bg-violet-500/30' :
                                                pkg.level === 'الصف الثالث الثانوي' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30 group-hover:bg-amber-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border-blue-400/30 group-hover:bg-blue-500/30'}`}>
                                        <span className={`w-2 h-2 rounded-full 
                                            ${pkg.level === 'الصف الأول الثانوي' ? 'bg-emerald-400' :
                                                pkg.level === 'الصف الثاني الثانوي' ? 'bg-violet-400' :
                                                    pkg.level === 'الصف الثالث الثانوي' ? 'bg-amber-400' :
                                                        'bg-blue-400'} 
                                            animate-pulse`}></span>
                                        {pkg.level}
                                    </div>
                                </div>





                            </div>

                            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                {/* Package Title */}
                                <h2 className="text-xl sm:text-2xl font-arabicUI3 text-slate-800 dark:text-white group-hover:text-blue-500
                                             transition-colors">
                                    {pkg.name}
                                </h2>

                                {/* Package Description */}
                                <p className="text-base text-slate-600 dark:text-slate-300 font-arabicUI3 line-clamp-2">
                                    {pkg.description}
                                </p>

                                {/* Package Features */}
                                <div className="grid grid-cols-3 gap-2 font-arabicUI3 my-4">
                                    <div className="flex flex-col items-center p-2 bg-blue-500/5 rounded-lg">
                                        <BookOpen className="text-blue-500 mb-1" size={18} />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{pkg.courses.length} كورسات</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-red-500/5 rounded-lg">
                                        <MdOutlineDiscount className="text-red-500 mb-1" size={18} />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">خصم {pkg.discountPercentage}%</span>
                                    </div>
                                    <div className="flex flex-col items-center p-2 bg-green-500/5 rounded-lg">
                                        <FaRegClock className="text-green-500 mb-1" size={18} />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">وصول دائم</span>
                                    </div>
                                </div>

                                {/* Price and Original Price */}
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-emerald-500 dark:text-emerald-400 font-bold text-xl">{pkg.price} جنيه</div>
                                        <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                                            <span className="line-through">{pkg.originalPrice} جنيه</span>
                                            <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 rounded-sm text-[10px]">خصم {pkg.discountPercentage}%</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Link
                                        href={enrollmentStatus[pkg._id] ?
                                            (pkg.courses && pkg.courses.length > 0 ? `/Courses/${pkg.courses[0]._id}` : '/') :
                                            `/package-payment/${pkg._id}`}
                                        className={`relative group`}
                                    >
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1
                                                      ${enrollmentStatus[pkg._id]
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-400'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-400'
                                            }`}>
                                            <span className="font-arabicUI3 text-sm whitespace-nowrap">
                                                {enrollmentStatus[pkg._id] ? 'تم الاشتراك' : 'اشترك الآن'}
                                            </span>
                                            {enrollmentStatus[pkg._id] ? (
                                                <GiCheckMark className="text-white" />
                                            ) : (
                                                <GiTakeMyMoney className="text-white" />
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filterPackagesByCategory(packages).length === 0 && (
                    <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl p-8 mt-4">
                        <BsBoxSeam className="text-5xl text-blue-500/50 mb-4" />
                        <h3 className="text-xl font-arabicUI3 text-slate-700 dark:text-slate-300 mb-2">لا توجد حزم لهذه الفئة</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-arabicUI3 text-center">
                            سيتم إضافة حزم جديدة قريباً. يمكنك اختيار فئة أخرى أو العودة لاحقاً.
                        </p>
                    </div>
                )}

                {/* Show More Button */}
                {filterPackagesByCategory(packages).length > 6 && (
                    <div className="flex justify-center mt-12">
                        <button
                            onClick={() => setShowMore(!showMore)}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 dark:bg-slate-800/10 dark:hover:bg-slate-800/20 
                                     backdrop-blur-md rounded-xl text-slate-700 dark:text-white transition-all duration-300 border border-blue-400/30"
                        >
                            {showMore ? (
                                <>
                                    <span className="font-arabicUI3">عرض أقل</span>
                                    <ChevronUp size={18} />
                                </>
                            ) : (
                                <>
                                    <span className="font-arabicUI3">عرض المزيد</span>
                                    <ChevronDown size={18} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
