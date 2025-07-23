'use client';
import React, { useEffect, useState } from 'react';
import { FaMicroscope } from "react-icons/fa";
import { GiDna2, GiMolecule, GiPlantSeed } from "react-icons/gi";
import { FaUser, FaEnvelope, FaLock, FaPhoneAlt, FaUsers, FaMapMarkerAlt, FaGraduationCap, FaChevronDown, FaLeaf } from "react-icons/fa";
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';
import sessionManager from '../utils/sessionManager';

const SignInPage = () => {
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    }); const [errors, setErrors] = useState({});
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionWarning, setSessionWarning] = useState('');    // منع المستخدم اللي داخل فعلاً من الوصول لصفحة اللوجين
    useEffect(() => {
        setMounted(true);
        if (sessionManager.isAuthenticated()) {
            router.replace("/");
        }
    }, []);

    if (!mounted) return null;

    const validateForm = () => {
        const newErrors = {};        // Email validation
        if (!formData.email) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[\w-\.]+@gmail\.com$/.test(formData.email)) {
            newErrors.email = 'يجب استخدام بريد Gmail فقط';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else if (formData.password.length < 8) {
            newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    }; const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSessionWarning('');

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Use session manager to handle login
                sessionManager.setSession(data.token, data.user, formData.rememberMe);

                // Show session warning if user was logged out from another device
                if (data.wasLoggedOutFromOtherDevice) {
                    setSessionWarning('تم تسجيل الخروج من الجهاز الآخر بنجاح');
                }

                // Dispatch event for other components
                window.dispatchEvent(new Event("login_success"));

                // Redirect after a short delay to show the warning message
                setTimeout(() => {
                    router.replace("/");
                }, data.wasLoggedOutFromOtherDevice ? 2000 : 100);
            } else {
                // Check if user is banned
                if (data.code === 'USER_BANNED') {
                    setError(`🚫 ${data.message}`);
                } else {
                    setError(data.message || "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة");
                }
            }

        } catch (err) {
            setError('حصلت مشكلة في الاتصال بالسيرفر');
            console.error(err);
        }

        setLoading(false);
    };

    const handleForgotPassword = () => {
        // Navigate to forgot password page or open modal
        router.push('/forgot-password');
    };

    return (
        <div dir='rtl' className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">                {/* Animated background elements */}
            {/* Animated background elements */}            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 opacity-5 mix-blend-overlay"></div>
                <div className="absolute top-20 left-20 text-white/10 text-5xl sm:text-7xl animate-float">
                    <FaMicroscope />
                </div>
                <div className="absolute bottom-40 right-20 text-white/10 text-6xl sm:text-8xl animate-spin-slow">
                    <GiDna2 />
                </div>
                <div className="absolute top-1/2 left-1/3 text-white/10 text-4xl sm:text-6xl animate-bounce-slow">
                    <GiMolecule />
                </div>
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse-delayed"></div>
            </div>
            {/* Main container */}
            <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 p-0">
                {/* Left side - Content */}                <div className="w-full lg:w-1/2 text-center lg:text-right space-y-6 px-4 lg:px-0">
                    <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl
                         bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 
                         transform hover:scale-105 transition-all duration-500">
                        <FaMicroscope className="text-3xl text-blue-300" />
                        <span className="font-arabicUI2 text-xl text-blue-300">منصة احمد السيد </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-arabicUI2 font-bold text-white leading-tight">
                        مرحباً بعودتك إلى
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                            عالم الاحياء الممتع
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl font-arabicUI2 text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        سجل دخولك الآن واستكمل رحلتك في تعلم الاحياء بطريقة مختلفة ومبتكرة
                        <span className="text-blue-300"> مع أفضل المدرسين </span>
                        وأحدث طرق شرح المفاهيم العلميه ❤️
                    </p>

                    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-end mt-6">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl">
                            <GiDna2 className="text-purple-300 text-2xl" />
                            <span className="font-arabicUI2 text-white/90">شرح سهل وبسيط </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl">
                            <FaMicroscope className="text-blue-300 text-2xl" />
                            <span className="font-arabicUI2 text-white/90">حل اصعب الاسئلة </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl">
                            <GiPlantSeed className="text-teal-300 text-2xl" />
                            <span className="font-arabicUI2 text-white/90">متابعة مستواك طول السنه </span>
                        </div>
                    </div>  </div>

                {/* Right side - Sign In Form */}
                <div className="w-full lg:w-1/2 px-4 lg:px-0">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl transition-all hover:shadow-blue-500/20">
                        <div className="mb-6 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                                    <FaMicroscope className="text-3xl text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-arabicUI2 font-bold text-white mb-2">تسجيل الدخول</h2>
                            <p className="text-white/60 font-arabicUI2">عد إلى حسابك واستمر في رحلة التعلم</p>
                        </div>                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-white font-arabicUI2 text-center">
                                {error}
                            </div>
                        )}

                        {/* Session Warning Message */}
                        {sessionWarning && (
                            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-white font-arabicUI2 text-center">
                                {sessionWarning}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FaEnvelope className="text-blue-300 group-focus-within:text-white transition-colors" />
                                </div>                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    placeholder="البريد الإلكتروني"
                                    suppressHydrationWarning
                                    className={`pr-10 w-full py-4 bg-white/10 border ${errors.email ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI3 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.email}</p>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <FaLock className="text-blue-300 group-focus-within:text-white transition-colors" />
                                </div>                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password || ''}
                                    onChange={handleChange}
                                    placeholder="كلمة المرور"
                                    suppressHydrationWarning
                                    className={`pr-10 w-full py-4 font-arabicUI3 bg-white/10 border ${errors.password ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.password}</p>
                                )}
                            </div>                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <input
                                        id="rememberMe"
                                        name="rememberMe"
                                        type="checkbox"
                                        checked={formData.rememberMe || false}
                                        onChange={handleChange}
                                        suppressHydrationWarning
                                        className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-400"
                                    />
                                    <label htmlFor="rememberMe" className="mr-2 text-sm text-white/70 font-arabicUI2">
                                        تذكرني
                                    </label>
                                </div>

                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                suppressHydrationWarning
                                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-arabicUI2 font-bold rounded-xl transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                            >
                                <span suppressHydrationWarning>
                                    {loading ? (
                                        <>
                                            <span className="animate-spin inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></span>
                                            <span>جاري تسجيل الدخول...</span>
                                        </>
                                    ) : "تسجيل الدخول"}
                                </span>
                            </button>

                            {/* Social Login Buttons - Optional */}
                            <div className="mt-6 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-indigo-900 text-white/60 font-arabicUI2">أو الدخول باستخدام</span>
                                </div>
                            </div>


                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-white/60 font-arabicUI2">
                                ليس لديك حساب؟{" "}
                                <a href="/sign-up" className="text-blue-300 hover:underline font-bold">إنشاء حساب جديد</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInPage;