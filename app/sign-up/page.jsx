'use client';
import React, { useEffect, useState } from 'react';
import { FaMicroscope } from "react-icons/fa";
import { GiDna2, GiMolecule, GiPlantSeed } from "react-icons/gi";
import { FaUser, FaEnvelope, FaLock, FaPhoneAlt, FaUsers, FaMapMarkerAlt, FaGraduationCap, FaChevronDown, FaLeaf } from "react-icons/fa";
import { BsGenderAmbiguous } from "react-icons/bs";
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';
import sessionManager from '../utils/sessionManager';

// All Egyptian governorates
const egyptGovernments = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
    "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
    "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
    "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
    "قنا", "شمال سيناء", "سوهاج"
];

const Page = () => {
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        parentPhone: '',
        government: '',
        level: '',
        gender: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [stepErrors, setStepErrors] = useState({
        step1: false,
        step2: false,
        step3: false
    }); const router = useRouter();    // ⛔ منع المستخدم اللي داخل فعلاً من الوصول لصفحة اللوجين
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // For multi-step form

    useEffect(() => {
        setMounted(true);
        if (sessionManager.isAuthenticated()) {
            router.replace("/");
        }
    }, []);

    if (!mounted) return null;

    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'email':
                if (!value) {
                    error = 'البريد الإلكتروني مطلوب';
                } else if (!/^[\w-\.]+@gmail\.com$/.test(value)) {
                    error = 'يجب استخدام بريد Gmail فقط';
                }
                break;

            case 'phoneNumber':
            case 'parentPhone':
                if (!value) {
                    error = 'رقم الهاتف مطلوب';
                } else if (!/^01[0125][0-9]{8}$/.test(value)) {
                    error = 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ ب 01';
                }
                break;

            case 'password':
                if (!value) {
                    error = 'كلمة المرور مطلوبة';
                } else if (value.length < 8) {
                    error = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
                } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value)) {
                    error = 'كلمة المرور يجب أن تحتوي على أحرف وأرقام';
                }
                break;

            case 'confirmPassword':
                if (!value) {
                    error = 'تأكيد كلمة المرور مطلوب';
                } else if (value !== formData.password) {
                    error = 'كلمة المرور وتأكيدها غير متطابقين';
                }
                break;
        }

        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Instant validation
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));

        // Special validation for parent phone being different from student phone
        if (name === 'parentPhone' && value === formData.phoneNumber) {
            setErrors(prev => ({
                ...prev,
                parentPhone: 'رقم هاتف ولي الأمر يجب أن يكون مختلف عن رقم هاتف الطالب'
            }));
        } else if (name === 'phoneNumber' && value === formData.parentPhone) {
            setErrors(prev => ({
                ...prev,
                phoneNumber: 'رقم هاتف الطالب يجب أن يكون مختلف عن رقم هاتف ولي الأمر'
            }));
        }
    };

    const validateStep = (stepNumber) => {
        let isValid = true;
        const newErrors = {};

        if (stepNumber === 1) {
            if (!formData.name || formData.name.length < 3) {
                newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
                isValid = false;
            }
            if (!formData.email || !/^[\w-\.]+@gmail\.com$/.test(formData.email)) {
                newErrors.email = 'يجب استخدام بريد Gmail فقط';
                isValid = false;
            }
            if (!formData.gender) {
                newErrors.gender = 'النوع مطلوب';
                isValid = false;
            }
        } if (stepNumber === 2) {
            if (!formData.phoneNumber || !/^01[0125][0-9]{8}$/.test(formData.phoneNumber)) {
                newErrors.phoneNumber = 'رقم الهاتف يجب أن يكون 11 رقم ويبدأ ب 01';
                isValid = false;
            }
            if (!formData.parentPhone || !/^01[0125][0-9]{8}$/.test(formData.parentPhone)) {
                newErrors.parentPhone = 'رقم هاتف ولي الأمر يجب أن يكون 11 رقم ويبدأ ب 01';
                isValid = false;
            }
            if (formData.phoneNumber === formData.parentPhone) {
                newErrors.parentPhone = 'رقم هاتف ولي الأمر يجب أن يكون مختلف عن رقم هاتف الطالب';
                isValid = false;
            }
            if (!formData.level) {
                newErrors.level = 'المرحلة مطلوبة';
                isValid = false;
            }
            if (!formData.government) {
                newErrors.government = 'المحافظة مطلوبة';
                isValid = false;
            }
        }

        if (stepNumber === 3) {
            if (!formData.password) {
                newErrors.password = 'كلمة المرور مطلوبة';
                isValid = false;
            } else if (formData.password.length < 8) {
                newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
                isValid = false;
            } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(formData.password)) {
                newErrors.password = 'كلمة المرور يجب أن تحتوي على أحرف وأرقام';
                isValid = false;
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
                isValid = false;
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقين';
                isValid = false;
            }
        }

        setErrors(newErrors);
        setStepErrors(prev => ({ ...prev, [`step${stepNumber}`]: !isValid }));
        return isValid;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name || formData.name.length < 3) {
            newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
        }

        // Email validation (Gmail only)
        if (!formData.email) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[\w-\.]+@gmail\.com$/.test(formData.email)) {
            newErrors.email = 'يجب استخدام بريد Gmail فقط';
        }

        // Phone validation
        const phoneRegex = /^01[0125][0-9]{8}$/;
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'رقم الهاتف مطلوب';
        } else if (!phoneRegex.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'رقم الهاتف غير صحيح';
        }

        // Parent phone validation
        if (!formData.parentPhone) {
            newErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب';
        } else if (!phoneRegex.test(formData.parentPhone)) {
            newErrors.parentPhone = 'رقم الهاتف غير صحيح';
        } else if (formData.parentPhone === formData.phoneNumber) {
            newErrors.parentPhone = 'رقم هاتف ولي الأمر يجب أن يكون مختلف عن رقم هاتف الطالب';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else if (formData.password.length < 8) {
            newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(formData.password)) {
            newErrors.password = 'كلمة المرور يجب أن تحتوي على أحرف وأرقام';
        }

        // Confirm Password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقين';
        }

        // Gender validation
        if (!formData.gender) {
            newErrors.gender = 'النوع مطلوب';
        } else if (!['ذكر', 'انثي'].includes(formData.gender)) {
            newErrors.gender = 'النوع يجب أن يكون ذكر أو انثي';
        }

        // Level validation
        if (!formData.level) {
            newErrors.level = 'المرحلة مطلوبة';
        } else if (!["الصف الثالث الثانوي", "الصف الثاني الثانوي", "الصف الأول الثانوي"].includes(formData.level)) {
            newErrors.level = 'المرحلة غير صحيحة';
        }

        // Government validation
        if (!formData.government) {
            newErrors.government = 'المحافظة مطلوبة';
        } else if (!egyptGovernments.includes(formData.government)) {
            newErrors.government = 'المحافظة غير مدرجة';
        }

        return newErrors;
    }; const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields before submission
        const step1Valid = validateStep(1);
        const step2Valid = validateStep(2);
        const step3Valid = validateStep(3);

        if (!step1Valid || !step2Valid || !step3Valid) {
            alert('من فضلك صحح الأخطاء في النموذج');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    parentPhoneNumber: formData.parentPhone,
                    government: formData.government,
                    level: formData.level,
                    gender: formData.gender,
                    password: formData.password
                })
            });

            const data = await response.json(); if (response.ok) {
                // Use session manager to handle signup login
                sessionManager.setSession(data.token, data.user, true); // Default to remember me for signup

                alert("✅ تم التسجيل بنجاح!");
                router.replace("/");
            } else {
                alert(data.message || "❌ حدث خطأ في التسجيل");
            }
            window.dispatchEvent(new Event("login_success"));

        } catch (err) {
            alert('حصلت مشكلة في الاتصال بالسيرفر');
            console.error(err);
        }

        console.log(formData)
        setLoading(false);
    };


    // All Egyptian governorates
    const egyptGovernments = [
        "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
        "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
        "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
        "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
        "قنا", "شمال سيناء", "سوهاج"
    ];

    return (
        <div dir='rtl' className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
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
            </div>            {/* Main container */}
            <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-6 sm:gap-8 p-0 sm:p-8">{/* Left side - Content */}
                <div className="w-full lg:w-1/2 text-center lg:text-right space-y-6 px-4 lg:px-0">
                    <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl
                         bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 
                         transform hover:scale-105 transition-all duration-500">
                        <FaMicroscope className="text-3xl text-blue-300" />
                        <span className="font-arabicUI2 text-xl text-blue-300">منصة احمد السيد </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-arabicUI2 font-bold text-white leading-tight">
                        انضم إلى منصة
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                            عالم الاحياء
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl font-arabicUI2 text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                        فالمنصة دي كان هدفي اخلي الاحياء بالنسبالك لعبة مش مجرد ماده هتاخدها وبعد متخلص ثانوية عامه
                        <span className="text-blue-300"> ترميها لا بالعكس </span>
                        انت هتبقي عايز تكمل فيها لان احنا خليناها عادة مش مجرد ماده ❤️
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
                    </div>
                </div>

                {/* Right side - Sign Up Form */}                <div className="w-full lg:w-1/2 px-4 lg:px-0">
                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl transition-all hover:shadow-blue-500/20">
                        <div className="mb-6 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                                    <FaMicroscope className="text-3xl text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-arabicUI2 font-bold text-white mb-2">سجل معنا الآن</h2>
                            <p className="text-white/60 font-arabicUI2">ابدأ رحلتك مع عالم الاحياء الممتع</p>

                            {/* Progress Bar */}
                            <div className="mt-6 mb-4 flex justify-between items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500' : 'bg-white/20'} transition-all`}>
                                    <span className="text-white">1</span>
                                </div>
                                <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'} transition-all`}></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'} transition-all`}>
                                    <span className="text-white">2</span>
                                </div>
                                <div className={`h-1 flex-1 mx-2 ${step >= 3 ? 'bg-blue-500' : 'bg-white/20'} transition-all`}></div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500' : 'bg-white/20'} transition-all`}>
                                    <span className="text-white">3</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {step === 1 && (
                                <>
                                    {/* Step 1: Personal Information */}
                                    <div className="text-white/80 font-arabicUI2 text-lg mb-4">
                                        <span className="text-blue-300">▪️</span> المعلومات الشخصية
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaUser className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="الاسم بالكامل"
                                            className="pr-10 w-full py-3 bg-white/10 border border-white/20 rounded-xl placeholder-white/50 text-white font-arabicUI3 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaEnvelope className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="البريد الإلكتروني"
                                            className={`pr-10 w-full py-3 bg-white/10 border ${errors.email ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI3 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <BsGenderAmbiguous className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <div className="pr-10 w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-arabicUI3 focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-transparent transition-all">
                                            <div className="flex items-center justify-around">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value="ذكر"
                                                        checked={formData.gender === "ذكر"}
                                                        onChange={handleChange}
                                                        className="mr-2 text-blue-500 focus:ring-blue-400"
                                                        required
                                                    />
                                                    <span>ذكر</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value="انثي"
                                                        checked={formData.gender === "انثي"}
                                                        onChange={handleChange}
                                                        className="mr-2 text-blue-500 focus:ring-blue-400"
                                                    />
                                                    <span>أنثى</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-arabicUI2 font-bold rounded-xl transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                                    >
                                        التالي
                                    </button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    {/* Step 2: Contact Information */}
                                    <div className="text-white/80 font-arabicUI2 text-lg mb-4">
                                        <span className="text-blue-300">▪️</span> معلومات الاتصال والتعليم
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaPhoneAlt className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            dir='rtl'
                                            onChange={handleChange}
                                            placeholder="رقم الهاتف"
                                            className={`pr-10 w-full py-3 bg-white/10 border ${errors.phoneNumber ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI3 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.phoneNumber && (
                                            <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaUsers className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>                                        <input
                                            type="tel"
                                            name="parentPhone"
                                            value={formData.parentPhone}
                                            onChange={handleChange}
                                            dir='rtl'
                                            placeholder="رقم هاتف ولي الأمر"
                                            className={`pr-10 w-full py-3 bg-white/10 border ${errors.parentPhone ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI3 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.parentPhone && (
                                            <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.parentPhone}</p>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaGraduationCap className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <div className="relative">
                                            <select
                                                name="level"
                                                value={formData.level}
                                                onChange={handleChange}
                                                className="pr-10 w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-arabicUI2 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all appearance-none"
                                                required
                                            >
                                                <option value="" disabled className="bg-indigo-900 text-white">اختر المستوى التعليمي</option>
                                                <option value="الصف الثالث الثانوي" className="bg-indigo-900 text-white">الصف الثالث الثانوي</option>
                                                <option value="الصف الثاني الثانوي" className="bg-indigo-900 text-white">الصف الثاني الثانوي</option>
                                                <option value="الصف الأول الثانوي" className="bg-indigo-900 text-white">الصف الأول الثانوي</option>
                                            </select>
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none">
                                                <FaChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>

                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaMapMarkerAlt className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <div className="relative">
                                            <select
                                                name="government"
                                                value={formData.government}
                                                onChange={handleChange}
                                                className="pr-10 w-full py-3 bg-white/10 border border-white/20 rounded-xl text-white font-arabicUI2 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all appearance-none"
                                                required
                                            >
                                                <option value="" disabled className="bg-indigo-900 text-white">اختر المحافظة</option>
                                                {egyptGovernments.map((gov, index) => (
                                                    <option key={index} value={gov} className="bg-indigo-900 text-white">{gov}</option>
                                                ))}
                                            </select>
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none">
                                                <FaChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="w-1/3 py-3 bg-white/10 hover:bg-white/20 text-white font-arabicUI2 font-bold rounded-xl transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                                        >
                                            السابق
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="w-2/3 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-arabicUI2 font-bold rounded-xl transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                                        >
                                            التالي
                                        </button>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    {/* Step 3: Password */}
                                    <div className="text-white/80 font-arabicUI2 text-lg mb-4">
                                        <span className="text-blue-300">▪️</span> إنشاء كلمة المرور
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaLock className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="كلمة المرور"
                                            className={`pr-10 w-full py-3 bg-white/10 border ${errors.password ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI2 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaLock className="text-blue-300 group-focus-within:text-white transition-colors" />
                                        </div>                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="تأكيد كلمة المرور"
                                            className={`pr-10 w-full py-3 bg-white/10 border ${errors.confirmPassword ? 'border-red-400' : 'border-white/20'} rounded-xl placeholder-white/50 text-white font-arabicUI2 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all`}
                                            required
                                        />
                                        {errors.confirmPassword && (
                                            <p className="mt-1 text-red-400 text-sm font-arabicUI2">{errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-400"
                                            required
                                        />
                                        <label htmlFor="terms" className="mr-2 text-sm text-white/70 font-arabicUI2">
                                            أوافق على <span className="text-blue-300 cursor-pointer hover:underline">الشروط والأحكام</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="w-1/3 py-3 bg-white/10 hover:bg-white/20 text-white font-arabicUI2 font-bold rounded-xl transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                                        >
                                            السابق
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-2/3 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-arabicUI2 font-bold rounded-xl transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:outline-none"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></span>
                                                    <span>جاري التسجيل...</span>
                                                </>
                                            ) : "إنشاء حساب"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-white/60 font-arabicUI2">
                                لديك حساب بالفعل؟{" "}
                                <a href="/sign-in" className="text-blue-300 hover:underline font-bold">تسجيل الدخول</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Page;


