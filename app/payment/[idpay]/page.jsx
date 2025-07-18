'use client'
import React, { use, useEffect, useState } from 'react'
// Import useRef for client-only rendering
import { useRef } from 'react'
import { HiHeart } from "react-icons/hi";
import { ToastContainer, toast } from 'react-toastify';
import { GiMolecule } from "react-icons/gi";
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MdMoney } from 'react-icons/md';
import { BiMoneyWithdraw } from 'react-icons/bi';
import { BsCashCoin } from 'react-icons/bs';

const Page = ({ params }) => {
    const { idpay } = use(params);
    const router = useRouter();
    const [courseInfo, setCourseInfo] = useState(null);
    const [number, setNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(true);
    const [showmodel, setshowmodel] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [userData, setUserData] = useState(null);
    // Track if component is mounted (client-side only)
    const isMounted = useRef(false);
    const [isClient, setIsClient] = useState(false);

    // Safe token access (client-side only)
    const [token, setToken] = useState('');

    // Handle client-side initialization
    useEffect(() => {
        setIsClient(true);
        isMounted.current = true;

        // Now safely get the token from cookies (client-side only)
        const cookieToken = Cookies.get("token");
        setToken(cookieToken || '');

        return () => {
            isMounted.current = false;
        };
    }, []);

    // Check for token after client-side initialization
    useEffect(() => {
        if (!isClient) return; // Skip server-side execution

        if (!token) {
            router.replace("/sign-in");
        } else {
            // Fetch user data after confirming token exists
            fetchUserData();
        }
    }, [router, token, isClient]);

    // Fetch user data from API
    const fetchUserData = async () => {
        setUserLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setUserData(response.data);
                // Pre-fill the phone number from user data 
            } else {
                throw new Error("فشل في جلب بيانات المستخدم");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error("حدث خطأ أثناء جلب بيانات المستخدم");
        } finally {
            setUserLoading(false);
        }
    };

    const handlenumber = (e) => {
        setNumber(e.target.value);
    };

    const getallcoures = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/${idpay}`);
            if (!res.ok) {
                throw new Error('Failed to fetch course');
            }

            const data = await res.json();
            console.log(data)
            if (!data) {
                setError('الكورس غير موجود');
                return;
            }
            setCourseInfo(data);
        } catch (error) {
            console.error("Error fetching course info:", error);
            setError('حدث خطأ في تحميل بيانات الكورس');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (idpay) {
            getallcoures();
        }
    }, [idpay]);

    const handleclicknum = async () => {
        if (!token) {
            toast.error("يرجى تسجيل الدخول أولا");
            return;
        }

        if (number.length < 10) {
            toast.error("رقم الموبايل غير صحيح");
            return;
        }

        setLoading(true);
        try {
            if (!token) {
                toast.error("جلسة منتهية. يرجى تسجيل الدخول مرة أخرى");
                router.replace("/sign-in");
                return;
            }

            // Submit data to the API
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/active`, {
                phoneNumber: number,
                courseId: idpay,
                price: courseInfo.price

            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                toast.success("تم إرسال طلبك بنجاح! سيتم التفعيل خلال 24 ساعة");
                setSubmitted(true);
                setshowmodel(true);
            } else {
                throw new Error("فشل في إرسال البيانات");
            }
        } catch (error) {
            console.error("Error processing enrollment:", error);
            toast.error(error.response?.data?.message || "حدث خطأ أثناء معالجة الطلب");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleclicknum();
        }
    };

    // Only render login requirement after client-side hydration
    if (isClient && !token) {
        return (
            <div className="min-h-screen bg-[#0A1121] text-white font-arabicUI3 flex items-center justify-center">
                <div className="relative container mx-auto px-4">
                    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m5-6a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold">يجب تسجيل الدخول</h2>
                        <p className="text-gray-400">الرجاء تسجيل الدخول أو إنشاء حساب للوصول إلى صفحة الدفع</p>
                        <div className="space-y-3">
                            <Link href="/sign-in">
                                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl py-3">
                                    تسجيل الدخول
                                </button>
                            </Link>
                            <Link href="/sign-up">
                                <button className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3">
                                    إنشاء حساب جديد
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state during initial client-side hydration
    if (!isClient) {
        return (
            <div className="min-h-screen bg-[#0A1121] text-white font-arabicUI3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const renderPaymentContent = () => {
        if (showmodel && submitted) {
            return (
                <div className="text-center space-y-6 py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-medium text-green-400">تم استلام طلبك بنجاح</h3>
                        <p className="text-blue-400">سيتم تفعيل الكورس خلال 24 ساعة</p>
                    </div>
                    <Link href="/">
                        <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-300">
                            العودة للصفحة الرئيسية
                        </button>
                    </Link>
                </div>
            );
        }

        // Show payment form directly
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                    <h3 dir='rtl' className="text-lg gap-4 sm:text-xl font-medium text-center flex  place-items-center"> طريقة الدفع فودافون كاش <span><BsCashCoin></BsCashCoin></span> </h3>
                    <div className="bg-gradient-to-tr from-[#ff3b42] to-[#FF8C8F] p-4 sm:p-6 rounded-xl text-center space-y-3">
                        <div className="space-y-2 flex flex-col items-center">
                            <img src="/vodafone.png" alt="Vodafone Cash" className="w-40 filter brightness-0 invert mx-auto mb-2" />
                            <p className="text-lg sm:text-xl">حول على رقم فودافون كاش</p>
                            <p className="text-2xl sm:text-4xl font-bold tracking-wider">01069750047</p>
                        </div>
                    </div>
                </div>
                

                <div className="space-y-4">
                    <label className="block text-sm text-blue-400">أدخل رقم الموبايل الذي حولت منه</label>
                    <input
                        type="number"
                        value={number}
                        placeholder="01XXXXXXXXX"
                        onChange={handlenumber}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                             text-center focus:outline-none focus:border-blue-500 transition-colors"
                    />

                    <button
                        disabled={number.length < 10 || loading}
                        onClick={handleclicknum}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 
                             hover:from-blue-600 hover:to-indigo-600 
                             disabled:from-gray-600 disabled:to-gray-700
                             text-white rounded-xl py-4 transition-all duration-300
                             flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                <span>جاري التحقق...</span>
                            </div>
                        ) : (
                            <>
                                <span>تأكيد عملية الدفع</span>
                                <HiHeart className="text-xl" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0A1121] text-white font-arabicUI3">
            {/* Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0   opacity-5" />
                <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/20 to-transparent blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-indigo-500/20 to-transparent blur-[120px]" />
            </div>

            {isClient && (
                <ToastContainer
                    position="top-center"
                    rtl={true}
                    theme="dark"
                />
            )}

            <div className="relative container mx-auto px-4 py-4 sm:py-8">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">إتمام عملية الشراء</h1>
                        <p className="text-blue-400 text-sm sm:text-base">خطوة واحدة تفصلك عن بداية رحلتك العلمية</p>
                    </div>

                    {error ? (
                        <div className="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/20">
                            <h2 className="text-xl text-red-400 mb-4">{error}</h2>
                            <Link href="/">
                                <button className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl">
                                    العودة للصفحة الرئيسية
                                </button>
                            </Link>
                        </div>
                    ) : loading && !courseInfo ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                        </div>
                    ) : courseInfo ? (
                        <div className="grid md:grid-cols-5 gap-4 sm:gap-8">
                            {/* Left Section: Course Details */}
                            <div dir='rtl' className="md:col-span-2 space-y-4 sm:space-y-6">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                                <GiMolecule className="text-2xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium">{courseInfo.name}</h3>
                                                <p className="text-blue-400 text-sm">مع د/ احمد السيد </p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-blue-400">سعر الكورس</span>
                                                <span className="text-2xl font-bold">{courseInfo.price} جنيه</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div dir='rtl' className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                    <h3 className="text-lg font-medium mb-4">معلومات المشترك</h3>
                                    {userLoading ? (
                                        <div className="text-center text-gray-400 py-4">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                                            </div>
                                            <p className="mt-2">جاري تحميل معلومات المستخدم...</p>
                                        </div>
                                    ) : userData ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <span className="text-blue-400">الاسم</span>
                                                <span>{userData.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <span className="text-blue-400">البريد الإلكتروني</span>
                                                <span className="text-sm">{userData.email}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <span className="text-blue-400">رقم الهاتف</span>
                                                <span>{userData.phoneNumber}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <span className="text-blue-400">المرحلة الدراسية</span>
                                                <span>{userData.level}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                                <span className="text-blue-400">المحافظة</span>
                                                <span>{userData.government}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-red-400 py-4">
                                            <p>حدث خطأ في جلب معلومات المستخدم</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Form Section */}
                            <div className="md:col-span-3">
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
                                    {renderPaymentContent()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;