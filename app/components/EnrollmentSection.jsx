'use client'
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { FaLock, FaUnlock, FaGraduationCap, FaPlay } from "react-icons/fa";
import { BsLightningChargeFill } from "react-icons/bs";
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import axios from 'axios';

const EnrollmentSection = ({ courseInfo }) => {
    const [loading, setLoading] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Debug courseInfo to see what properties are available
        console.log('courseInfo:', courseInfo);

        // Check if user is logged in by looking for token in cookies
        const token = Cookies.get('token');
        if (token) {
            setIsLoggedIn(true);
            // Get user data from cookies or localStorage if available
            const userDataStr = localStorage.getItem('username');
            if (userDataStr) {
                setUserData(JSON.parse(userDataStr));
            }
        }

        // Check enrollment status from courseInfo (which now comes from the new combined endpoint)
        if (courseInfo.hasOwnProperty('isEnrolled')) {
            setEnrolled(courseInfo.isEnrolled);
        }
    }, [courseInfo]);

    const handleEnrollFree = async () => {
        if (!isLoggedIn) {
            toast.error('يرجى تسجيل الدخول أولاً');
            return;
        }

        setLoading(true);
        try {
            const token = Cookies.get('token');

            // Get the correct course ID - handle different possible formats
            const courseId = courseInfo._id || courseInfo.id || courseInfo.nicknameforcourse;

            // Create enrollment for free course - backend will automatically set payment status to 'paid'
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/active`, {
                courseId: courseId,
                price: courseInfo.price || 0,
                phoneNumber: '01000000000' // Replace with actual phone number if needed
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                setEnrolled(true);
                toast.success('تم التسجيل في الكورس بنجاح');
                // Optionally reload to update the UI
                window.location.reload();
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('حدث خطأ في التسجيل');
            }
        } finally {
            setLoading(false);
        }
    };

    if (courseInfo.isFree) {
        return (
            <div className="relative group">
                {/* Glowing background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
                    <div className="space-y-6">
                        {/* Free Course Badge */}
                        <div className="text-center">
                            <div className="inline-flex items-center gap-3 bg-green-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-green-400/30 shadow-lg">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <FaUnlock className="text-green-400 text-lg" />
                                <span className="text-green-300 font-semibold text-lg">كورس مجاني تماماً</span>
                            </div>
                        </div>

                        {/* Price Display */}
                        <div className="text-center space-y-2">
                            <div className="relative">
                                <h3 className="text-5xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                                    مجاني
                                </h3>
                                <div className="absolute inset-0 text-5xl font-black text-green-400/20 blur-sm">
                                    مجاني
                                </div>
                            </div>
                            <p className="text-gray-300 font-medium">وصول مدى الحياة بدون تكلفة</p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <span>جميع دروس الكورس</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <span>الاختبارات التفاعلية</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                </div>
                                <span>وصول مدى الحياة</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        {!isLoggedIn ? (
                            <Link href="/sign-in" className="block">
                                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                                    <FaLock className="text-lg" />
                                    <span>تسجيل دخول للمشاهدة</span>
                                </button>
                            </Link>
                        ) : enrolled ? (
                            <div className="text-center">
                                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                                    <FaPlay className="text-lg" />
                                    <span>ابدأ المشاهدة الآن</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEnrollFree}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
                            >
                                <FaGraduationCap className="text-lg" />
                                <span>{loading ? 'جاري التسجيل...' : 'ابدأ التعلم مجاناً'}</span>
                                {loading && (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
                <div className="space-y-6">
                    {isLoggedIn ? (
                        enrolled ? (
                            <div className="space-y-6">
                                {/* Enrolled Status Badge */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-3 bg-emerald-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-400/30 shadow-lg">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                        <BsLightningChargeFill className="text-emerald-400 text-lg" />
                                        <span className="text-emerald-300 font-semibold text-lg">تم تفعيل الكورس</span>
                                    </div>
                                </div>

                                {/* Access Status */}
                                <div className="text-center space-y-2">
                                    <div className="relative">
                                        <h3 className="text-4xl font-black text-transparent bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text">
                                            مُفعَّل
                                        </h3>
                                        <div className="absolute inset-0 text-4xl font-black text-emerald-400/20 blur-sm">
                                            مُفعَّل
                                        </div>
                                    </div>
                                    <p className="text-gray-300 font-medium">يمكنك الآن الوصول لجميع المحتويات</p>
                                </div>

                                {/* Features for enrolled users */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>جميع الدروس مفتوحة</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>تحميل الملفات والمواد</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>الاختبارات التفاعلية</span>
                                    </div>
                                </div>

                                {/* Continue Learning Button */}
                                <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                                    <FaPlay className="text-lg" />
                                    <span>متابعة التعلم</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Premium Badge */}
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-3 bg-blue-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-blue-400/30 shadow-lg">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        <BsLightningChargeFill className="text-blue-400 text-lg" />
                                        <span className="text-blue-300 font-semibold text-lg">كورس مدفوع</span>
                                    </div>
                                </div>

                                {/* Price Display */}
                                <div className="text-center space-y-2">
                                    <div className="relative">
                                        <h3 className="text-5xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                                            {courseInfo.price}
                                        </h3>
                                        <div className="absolute inset-0 text-5xl font-black text-blue-400/20 blur-sm">
                                            {courseInfo.price}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 font-medium">جنيه - اشتراك لمرة واحدة</p>
                                </div>

                                {/* Premium Features */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>وصول مدى الحياة</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>جميع الدروس والمواد</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>شهادة إتمام معتمدة</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <span>دعم فني مباشر</span>
                                    </div>
                                </div>

                                {/* Subscribe Button */}
                                <Link href={`/payment/${courseInfo._id || courseInfo.id || courseInfo.nicknameforcourse}`} className="block">
                                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                                        <BsLightningChargeFill className="text-lg" />
                                        <span>اشترك الآن</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                        </svg>
                                    </button>
                                </Link>
                            </div>
                        )
                    ) : (
                        <div className="space-y-6">
                            {/* Login Required Badge */}
                            <div className="text-center">
                                <div className="inline-flex items-center gap-3 bg-orange-500/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-orange-400/30 shadow-lg">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                                    <FaLock className="text-orange-400 text-lg" />
                                    <span className="text-orange-300 font-semibold text-lg">تسجيل دخول مطلوب</span>
                                </div>
                            </div>

                            {/* Price Display */}
                            <div className="text-center space-y-2">
                                <div className="relative">
                                    <h3 className="text-5xl font-black text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text">
                                        {courseInfo.price}
                                    </h3>
                                    <div className="absolute inset-0 text-5xl font-black text-orange-400/20 blur-sm">
                                        {courseInfo.price}
                                    </div>
                                </div>
                                <p className="text-gray-300 font-medium">جنيه - سجل دخول للاشتراك</p>
                            </div>

                            {/* Login Benefits */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-5 h-5 bg-gray-600/20 rounded-full flex items-center justify-center">
                                        <FaLock className="w-3 h-3 text-gray-500" />
                                    </div>
                                    <span>وصول مدى الحياة</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-5 h-5 bg-gray-600/20 rounded-full flex items-center justify-center">
                                        <FaLock className="w-3 h-3 text-gray-500" />
                                    </div>
                                    <span>جميع الدروس والمواد</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-5 h-5 bg-gray-600/20 rounded-full flex items-center justify-center">
                                        <FaLock className="w-3 h-3 text-gray-500" />
                                    </div>
                                    <span>شهادة إتمام معتمدة</span>
                                </div>
                            </div>

                            {/* Login Button */}
                            <Link href="/sign-in" className="block">
                                <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-2xl p-4 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3">
                                    <FaLock className="text-lg" />
                                    <span>تسجيل دخول</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                    </svg>
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EnrollmentSection;