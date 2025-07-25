'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, CheckCircle2, AlertCircle, Loader2, ArrowLeft, CreditCard, BookOpen } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { BsCashCoin } from 'react-icons/bs';

export default function PaymentPage() {
    const params = useParams();
    const { packageId } = params;
    const router = useRouter();

    const [itemData, setItemData] = useState(null);
    const [itemType, setItemType] = useState('package'); // 'package' or 'course'
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check login status
        const token = Cookies.get('token');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                setIsLoggedIn(true);
                setUser(JSON.parse(userData));

                // Check if user is already enrolled
                const enrolledItems = JSON.parse(localStorage.getItem('enrolledItems') || '[]');
                if (enrolledItems.includes(packageId)) {
                    toast.success('أنت مشترك بالفعل في هذه الحزمة أو الكورس');
                    router.push('/');
                    return;
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                // Clear invalid user data
                Cookies.remove('token');
                localStorage.removeItem('userData');
                setIsLoggedIn(false);
                setUser(null);
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }

        // Attempt to fetch package or course data
        fetchItemData();
    }, [packageId, router]);

    const fetchItemData = async () => {
        setLoading(true);
        try {
            // Try to fetch as a package first
            const packageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages/${packageId}`);

            if (packageResponse.ok) {
                const packageData = await packageResponse.json();
                setItemData(packageData.package);
                setItemType('package');
                setLoading(false);
                return;
            }

            // If not a package, try as a course
            const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/${packageId}`);

            if (courseResponse.ok) {
                const courseData = await courseResponse.json();
                setItemData(courseData);
                setItemType('course');
                setLoading(false);
                return;
            }

            // If neither worked, throw error
            throw new Error('لم يتم العثور على الكورس أو الحزمة المطلوبة');

        } catch (error) {
            console.error('Error fetching item:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        // If not logged in, redirect to sign-in page with return URL

        setPaymentLoading(true);
        try {
            const token = Cookies.get('token');

            if (!token) {
                // Session expired, need to login again
                localStorage.setItem('redirectAfterLogin', `/package-payment/${packageId}`);
                router.push('/sign-in');
                return;
            }

            // Redirect to the payment page with the item ID
            if (itemType === 'package') {
                // Redirect to payment page for package
                router.push(`/payment/${packageId}?type=package`);
            } else {
                // Redirect to payment page for course
                router.push(`/payment/${packageId}?type=course`);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.message || 'حدث خطأ أثناء معالجة الطلب');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A1121] font-arabicUI3 p-4">
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: '#0A1121',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                        },
                    }}
                />
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h2 className="text-xl text-white mb-2">جاري تحميل البيانات</h2>
                    <p className="text-white/70">يرجى الانتظار قليلاً...</p>
                </div>
            </div>
        );
    }

    if (error || !itemData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A1121] font-arabicUI3 p-4">
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: '#0A1121',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                        },
                    }}
                />
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl text-white mb-2">حدث خطأ</h2>
                    <p className="text-white/70 mb-6">{error || 'لم يتم العثور على العنصر المطلوب'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl text-white flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={18} />
                        <span>العودة للصفحة الرئيسية</span>
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div dir='rtl' className="min-h-screen bg-[#0A1121]  text-white font-arabicUI3">
            {/* Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-5" />
                <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/20 to-transparent blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-indigo-500/20 to-transparent blur-[120px]" />
            </div>

            <div className="relative container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{itemData.name}</h1>
                        <p className="text-blue-400 text-sm sm:text-base">
                            اشترك الآن واحصل على {itemData.courses.length} كورس بخصم {itemData.discountPercentage}%
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Package Details & Course Cards - 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Package Overview */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                        <Package className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold">{itemData.name}</h2>
                                                <p className="text-blue-400">{itemData.level}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-emerald-400">{itemData.price} جنيه</div>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="line-through text-white/60">{itemData.originalPrice} جنيه</span>
                                                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg text-xs">
                                                        خصم {itemData.discountPercentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-white/80 mb-5">{itemData.description}</p>

                                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-500/30">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-1">وفر {itemData.originalPrice - itemData.price} جنيه</h3>
                                            <p className="text-white/80">
                                                اشترك في هذه الحزمة الآن للحصول على جميع الكورسات بخصم {itemData.discountPercentage}% على السعر الأصلي.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Course Cards - Grid Layout */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">الكورسات المضمنة في الحزمة</h3>
                                    <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-xl">
                                        {itemData.courses.length} كورس
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {itemData.courses.map((course, index) => (
                                        <div key={course._id}
                                            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 
                                                          hover:border-blue-500/50 transition-all duration-300 
                                                          group cursor-pointer">
                                            <div className="flex items-start gap-4">
                                                <div className="h-16 w-16 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-lg 
                                                                    flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-500 
                                                                    transition-all duration-300">
                                                    <BookOpen className="h-8 w-8 text-blue-300 group-hover:text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-medium text-white group-hover:text-blue-300 transition-colors">{course.name}</h4>
                                                    <p className="text-white/60 text-sm mb-2">{course.level}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-emerald-400 font-bold">{course.price} جنيه</span>
                                                        <div className="bg-blue-500/20 px-2 py-1 rounded-lg text-blue-300 text-xs">
                                                            مضمن في الحزمة
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary - 1 column */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sticky top-8">
                                <h2 className="text-xl font-bold mb-6">ملخص الطلب</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">سعر الكورسات</span>
                                        <span className="text-white line-through">{itemData.originalPrice} جنيه</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-white/80">الخصم</span>
                                        <span className="text-emerald-400">- {itemData.originalPrice - itemData.price} جنيه</span>
                                    </div>

                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-medium">الإجمالي</span>
                                            <span className="text-white text-2xl font-bold">{itemData.price} جنيه</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Advantages */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6">
                                    <h3 className="text-lg font-medium mb-3">مميزات الاشتراك</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-white/80">الوصول الفوري لجميع الكورسات</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-white/80">توفير {itemData.discountPercentage}% من سعر الكورسات المنفردة</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-white/80">محتوى تعليمي متكامل ومترابط</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-white/80">دعم فني على مدار الساعة</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Payment Method Preview */}
                                <div className="bg-gradient-to-tr from-[#ff3b42]/20 to-[#FF8C8F]/20 p-4 rounded-xl text-center mb-6 border border-[#ff3b42]/30">
                                    <div className="space-y-2 flex flex-col items-center">
                                        <img src="/vodafone.png" alt="Vodafone Cash" className="w-24 filter brightness-0 invert mx-auto mb-2" />
                                        <p className="text-white/80 text-sm">سيتم الدفع باستخدام فودافون كاش</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={paymentLoading}
                                    className={`w-full py-4 px-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 
                                            ${paymentLoading
                                            ? 'bg-indigo-700/50 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                        } transition-all duration-300`}
                                >
                                    {paymentLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>جاري التجهيز...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-5 w-5" />
                                            <span>{isLoggedIn ? 'الدفع والاشتراك الآن' : 'تسجيل الدخول والاشتراك'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}