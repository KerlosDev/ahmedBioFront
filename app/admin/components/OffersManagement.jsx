'use client'
import { useState, useEffect, useCallback, memo } from 'react';
import { Trash2, Edit, Plus, Search, Tag, Clock, Circle, Check, X, ArrowRight, ArrowLeft, DollarSign, Star, ListPlus, Flag, Tags, Book, Users, StarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

// Add courses state and fetch function
const useOfferManagement = () => {
    const [courses, setCourses] = useState([]); const fetchCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    return { courses };
};

// Extract OfferModal outside main component
const OfferModal = memo(({ isEdit, onSubmit, onClose, currentStep, steps, formData, onFormChange, onNextStep, onPrevStep, formErrors, handleAddFeature, handleRemoveFeature, handleFeatureChange, courses, onCourseSelect }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]">
        <div className="min-h-screen px-4 text-center">
            {/* This element is to trick the browser into centering the modal contents. */}
            <span
                className="inline-block h-screen align-middle"
                aria-hidden="true"
            >
                &#8203;
            </span>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block w-full max-w-5xl my-8 align-middle"
            >
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700/50">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Header */}
                    <div className="sticky top-0 backdrop-blur-xl bg-gray-900/90 p-6 border-b border-white/10 flex justify-between items-center z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                                {isEdit ? <Edit size={20} /> : <Plus size={20} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-arabicUI3 text-white">
                                    {isEdit ? 'تعديل العرض' : 'إضافة عرض جديد'}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">{steps[currentStep - 1].title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X className="text-gray-400 hover:text-white text-xl" />
                        </button>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <AnimatePresence mode="wait">
                                <div key={currentStep}>                                    {currentStep === 1 && (
                                    // Step 1 content
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">عنوان العرض</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => onFormChange('title', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white/5 border ${formErrors.title ? 'border-red-500' : 'border-white/10'} rounded-xl text-white`}
                                                placeholder="مثال: عرض خاص - مجموعة إتقان الاحياء"
                                            />
                                            {formErrors.title && <p className="text-red-500 text-sm">{formErrors.title}</p>}
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">العنوان الفرعي</label>
                                            <input
                                                type="text"
                                                value={formData.subtitle}
                                                onChange={(e) => onFormChange('subtitle', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white/5 border ${formErrors.subtitle ? 'border-red-500' : 'border-white/10'} rounded-xl text-white`}
                                                placeholder="مثال: احمد السيد  يقدم"
                                            />
                                            {formErrors.subtitle && <p className="text-red-500 text-sm">{formErrors.subtitle}</p>}
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">وصف العرض</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => onFormChange('description', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white/5 border ${formErrors.description ? 'border-red-500' : 'border-white/10'} rounded-xl text-white min-h-[100px]`}
                                                placeholder="وصف تفصيلي للعرض..."
                                            />
                                            {formErrors.description && <p className="text-red-500 text-sm">{formErrors.description}</p>}
                                        </div>                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">المرحلة الدراسية</label>
                                            <select
                                                value={formData.section}
                                                onChange={(e) => onFormChange('section', e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                            >
                                                <option className='text-black' value="FIRST_SEC">الصف الأول الثانوي</option>
                                                <option className='text-black' value="SECOND_SEC">الصف الثاني الثانوي</option>
                                                <option className='text-black' value="THIRD_SEC">الصف الثالث الثانوي</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">حالة العرض</label>
                                            <select
                                                value={formData.stage}
                                                onChange={(e) => onFormChange('stage', e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                            >
                                                <option className='text-black' value="DRAFT">مسودة</option>
                                                <option className='text-black' value="PUBLISHED">نشر</option>
                                                <option className='text-black' value="ARCHIVED">أرشيف</option>
                                            </select>
                                        </div>
                                    </div>
                                )}                                    {currentStep === 2 && (
                                    // Step 2 content
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">اختر الكورسات المتضمنة في العرض</label>
                                            <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
                                                {courses?.map((course) => (
                                                    <div
                                                        key={course._id}
                                                        className={`p-4 rounded-xl border ${formData.courseLinks.includes(course._id)
                                                            ? 'border-blue-500 bg-blue-500/10'
                                                            : 'border-white/10 bg-white/5'
                                                            } cursor-pointer transition-all hover:border-blue-500/50`}
                                                        onClick={() => onCourseSelect(course._id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-white/10">
                                                                <Book className="text-white" size={20} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-white font-medium">{course.name}</h4>
                                                                <p className="text-gray-400 text-sm">{course.description}</p>
                                                                {course.price && (
                                                                    <p className="text-blue-400 text-sm mt-1">
                                                                        السعر: {course.price} جنيه
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className={`p-2 rounded-lg ${formData.courseLinks.includes(course._id)
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-white/10 text-gray-400'
                                                                }`}>
                                                                {formData.courseLinks.includes(course._id) ? (
                                                                    <Check size={16} />
                                                                ) : (
                                                                    <Plus size={16} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {formErrors.courseLinks && (
                                                <p className="text-red-500 text-sm">{formErrors.courseLinks}</p>
                                            )}
                                        </div>

                                        <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                                            <p className="text-white/70 text-sm">الكورسات المحددة:</p>
                                            <p className="text-2xl font-bold text-indigo-400">
                                                {formData.courseLinks.length} كورس
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">السعر قبل الخصم</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={formData.originalPrice}
                                                        onChange={(e) => {
                                                            onFormChange('originalPrice', e.target.value);
                                                            if (formData.discountPrice) {
                                                                const percentage = Math.round(((e.target.value - formData.discountPrice) / e.target.value) * 100);
                                                                onFormChange('discountPercentage', percentage);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pl-16"
                                                        required
                                                    />
                                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">جنيه</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">السعر بعد الخصم</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={formData.discountPrice}
                                                        onChange={(e) => {
                                                            onFormChange('discountPrice', e.target.value);
                                                            if (formData.originalPrice) {
                                                                const percentage = Math.round(((formData.originalPrice - e.target.value) / formData.originalPrice) * 100);
                                                                onFormChange('discountPercentage', percentage);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pl-16"
                                                        required
                                                    />
                                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">جنيه</span>
                                                </div>
                                            </div>
                                        </div>

                                        {formData.originalPrice && formData.discountPrice && (
                                            <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                                                <p className="text-white/70 text-sm">نسبة الخصم:</p>
                                                <p className="text-2xl font-bold text-indigo-400">
                                                    {formData.discountPercentage}%
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">عدد الكورسات</label>
                                                <input
                                                    type="number"
                                                    value={formData.courses}
                                                    onChange={(e) => onFormChange('courses', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                    min="1"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">عدد الطلاب</label>
                                                <input
                                                    type="number"
                                                    value={formData.students}
                                                    onChange={(e) => onFormChange('students', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">التقييم</label>
                                                <input
                                                    type="number"
                                                    value={formData.rating}
                                                    onChange={(e) => onFormChange('rating', Math.min(5, Math.max(0, e.target.value)))}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                    min="0"
                                                    max="5"
                                                    step="0.1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}                                    {currentStep === 3 && (
                                    // Step 3 content
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-white">المميزات</h3>
                                            <button
                                                type="button"
                                                onClick={handleAddFeature}
                                                className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
                                            >
                                                <Plus size={16} />
                                                إضافة ميزة
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {formData.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-4">
                                                    <div className="relative flex-1">
                                                        <Star className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/20" size={20} />
                                                        <input
                                                            type="text"
                                                            placeholder={`أدخل الميزة ${index + 1} هنا...`}
                                                            value={feature}
                                                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-12"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFeature(index)}
                                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}                                    {currentStep === 4 && (
                                    // Step 4 content
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="block text-white/70 text-sm">تاريخ انتهاء العرض</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => onFormChange('endDate', e.target.value)}
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isLimited}
                                                    onChange={(e) => onFormChange('isLimited', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="mr-3 text-sm font-medium text-white">العرض محدود</span>
                                            </label>
                                        </div>

                                        {formData.isLimited && (
                                            <div className="space-y-4">
                                                <label className="block text-white/70 text-sm">عدد المقاعد المتبقية</label>
                                                <input
                                                    type="number"
                                                    value={formData.spotsLeft}
                                                    onChange={(e) => onFormChange('spotsLeft', e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                    min="0"
                                                    placeholder="عدد المقاعد المتاحة..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                </div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 backdrop-blur-xl bg-gray-900/90 p-6 border-t border-white/10">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between">
                                    {/* Step Indicators */}
                                    <div className="hidden md:flex items-center gap-8">
                                        {steps.map((step, index) => (
                                            <React.Fragment key={index}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                                                        ${currentStep > index + 1 ? 'border-green-400 bg-green-400/10' :
                                                            currentStep === index + 1 ? 'border-blue-400 bg-blue-400/10' :
                                                                'border-gray-600 bg-gray-700/50'}`}>
                                                        {currentStep > index + 1 ? (
                                                            <Check className="text-green-400" size={12} />
                                                        ) : (
                                                            <span className={`text-sm ${currentStep === index + 1 ? 'text-blue-400' : 'text-gray-400'}`}>
                                                                {index + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm ${currentStep === index + 1 ? 'text-white' : 'text-gray-400'}`}>
                                                        {step.title}
                                                    </span>
                                                </div>
                                                {index < steps.length - 1 && (
                                                    <div className="w-12 h-0.5 bg-gray-700" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Mobile Step Indicators */}
                                    <div className="flex md:hidden items-center gap-2">
                                        {steps.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 
                                                    ${currentStep === index + 1 ? 'bg-blue-500 w-8' :
                                                        currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-600'}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex gap-3">
                                        {currentStep > 1 && (
                                            <button
                                                type="button"
                                                onClick={onPrevStep}
                                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl 
                                                    transition-all duration-300 flex items-center gap-2"
                                            >
                                                <ArrowRight size={14} />
                                                السابق
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={currentStep === steps.length ? onSubmit : onNextStep}
                                            className={`px-5 py-2.5 rounded-xl transition-all duration-300 
                                                flex items-center gap-2 ${currentStep === steps.length ?
                                                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' :
                                                    'bg-blue-500 hover:bg-blue-600 text-white'
                                                }`}
                                        >
                                            {currentStep === steps.length ? (
                                                <>
                                                    <Check size={14} />
                                                    {isEdit ? 'حفظ التغييرات' : 'إضافة العرض'}
                                                </>
                                            ) : (
                                                <>
                                                    التالي
                                                    <ArrowLeft size={14} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    </div>
));

const OffersManagement = () => {
    const { courses } = useOfferManagement();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); const [filterStage, setFilterStage] = useState('all');
    const [filterSection, setFilterSection] = useState('all');
    const [currentStep, setCurrentStep] = useState(1);
    const [formErrors, setFormErrors] = useState({});

    const router = useRouter(); const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        originalPrice: '',
        discountPrice: '',
        discountPercentage: '',
        courses: '',
        students: '',
        rating: 5,
        features: [],
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isLimited: false,
        spotsLeft: '',
        stage: 'DRAFT',
        section: 'FIRST_SEC',
        courseLinks: [],
    }); const steps = [
        { title: 'معلومات العرض الأساسية', icon: Tag },
        { title: 'اختيار الكورسات', icon: Book },
        { title: 'المميزات', icon: <Star size={20} /> },
        { title: 'إعدادات العرض', icon: <Star size={20} /> }
    ];

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []); const fetchOffers = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.status === 'success') {
                setOffers(data.offers);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    }; const handleAddOffer = async (e) => {
        e.preventDefault();
        const errors = validateForm(currentStep);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.status === 'success') {
                setShowAddModal(false);
                fetchOffers();
                resetForm();
            }
        } catch (error) {
            console.error('Error adding offer:', error);
        }
    }; const handleEditOffer = async (e) => {
        e.preventDefault();
        const errors = validateForm(currentStep);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/${currentOffer._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                setShowEditModal(false);
                fetchOffers();
                resetForm();
            } else {
                setFormErrors({ ...formErrors, submit: data.message });
            }
        } catch (error) {
            console.error('Error editing offer:', error);
            setFormErrors({ ...formErrors, submit: 'حدث خطأ أثناء تحديث العرض. يرجى المحاولة مرة أخرى.' });
        }
    }; const handleDeleteOffer = async (offerId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
            try {
                const token = Cookies.get('token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/${offerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
                if (response.ok) {
                    fetchOffers();
                }
            } catch (error) {
                console.error('Error deleting offer:', error);
            }
        }
    }; const handleAddFeature = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, '']
        }));
    }, []);

    const handleRemoveFeature = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    }, []);

    const handleFeatureChange = useCallback((index, value) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.map((feature, i) => i === index ? value : feature)
        }));
    }, []); const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            originalPrice: '',
            discountPrice: '',
            discountPercentage: '',
            courses: '',
            students: '',
            rating: 5,
            features: [],
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isLimited: false,
            spotsLeft: '',
            stage: 'DRAFT',
            section: 'FIRST_SEC',
            courseLinks: [],
        });
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case 'PUBLISHED':
                return 'bg-green-500';
            case 'DRAFT':
                return 'bg-yellow-500';
            case 'EXPIRED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Add debounced search
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter offers using debounced value
    const filteredOffers = offers.filter(offer => {
        const matchesSearch = (offer.title?.toLowerCase() || '').includes(debouncedSearchQuery.toLowerCase()) ||
            (offer.subtitle?.toLowerCase() || '').includes(debouncedSearchQuery.toLowerCase()) ||
            (offer.description?.toLowerCase() || '').includes(debouncedSearchQuery.toLowerCase());
        const matchesStage = filterStage === 'all' || offer.stage === filterStage;
        const matchesSection = filterSection === 'all' || offer.section === filterSection;
        return matchesSearch && matchesStage && matchesSection;
    });

    // Use useCallback for modal handlers
    const handleCloseAddModal = useCallback(() => {
        setShowAddModal(false);
        resetForm();
        setCurrentStep(1);
    }, []); const handleCloseEditModal = useCallback(() => {
        setShowEditModal(false);
        resetForm();
        setCurrentStep(1);
        setFormErrors({});
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []); const handleNextStep = useCallback(() => {
        const errors = validateForm(currentStep);
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            nextStep();
        }
    }, [currentStep, formData, steps.length]);

    const handlePrevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    }, []); const validateForm = (step) => {
        const errors = {};
        switch (step) {
            case 1:
                if (!formData.title?.trim()) errors.title = 'عنوان العرض مطلوب';
                if (!formData.subtitle?.trim()) errors.subtitle = 'العنوان الفرعي مطلوب';
                if (!formData.description?.trim()) errors.description = 'وصف العرض مطلوب';
                if (!formData.section) errors.section = 'اختيار المرحلة مطلوب';
                break;
            case 2:
                if (!formData.originalPrice) errors.originalPrice = 'السعر الأصلي مطلوب';
                if (!formData.discountPrice) errors.discountPrice = 'سعر الخصم مطلوب';
                if (Number(formData.discountPrice) >= Number(formData.originalPrice)) {
                    errors.discountPrice = 'يجب أن يكون سعر الخصم أقل من السعر الأصلي';
                }
                if (!formData.courses) errors.courses = 'عدد الكورسات مطلوب';
                if (!formData.students && formData.students !== 0) errors.students = 'عدد الطلاب مطلوب';
                if (!formData.rating || formData.rating < 0 || formData.rating > 5) {
                    errors.rating = 'التقييم يجب أن يكون بين 0 و 5';
                }
                if (formData.courseLinks.length === 0) {
                    errors.courseLinks = 'يجب اختيار كورس واحد على الأقل';
                }
                break;
            case 3:
                if (!formData.features || formData.features.length === 0) {
                    errors.features = 'يجب إضافة ميزة واحدة على الأقل';
                } else if (formData.features.some(feature => !feature.trim())) {
                    errors.features = 'جميع الميزات يجب أن تحتوي على نص';
                }
                break;
            case 4:
                if (!formData.endDate) errors.endDate = 'تاريخ انتهاء العرض مطلوب';
                if (formData.isLimited && !formData.spotsLeft) {
                    errors.spotsLeft = 'يجب تحديد عدد المقاعد المتاحة';
                }
                break;
        }
        return errors;
    };

    // Modify the button click handlers to reset step
    const handleOpenEditModal = useCallback((offer) => {
        setCurrentOffer(offer);
        setFormData(offer);
        setCurrentStep(1);
        setFormErrors({});
        setShowEditModal(true);
    }, []);

    const handleCourseSelect = (courseId) => {
        setFormData(prev => {
            const courseLinks = prev.courseLinks.includes(courseId)
                ? prev.courseLinks.filter(id => id !== courseId)
                : [...prev.courseLinks, courseId];

            // Update the courses count
            return {
                ...prev,
                courseLinks,
                courses: courseLinks.length
            };
        });
    };

    return (
        <div className="min-h-screen font-arabicUI3 ">
            {/* Header Section */}
            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                                <Tag size={20} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">إدارة العروض</h1>
                                <p className="text-gray-400 text-sm">قم بإدارة وتنظيم العروض الخاصة بك</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 
                            hover:to-blue-600 text-white rounded-xl transition-all duration-300 flex items-center 
                            gap-2 justify-center md:w-auto w-full"
                        >
                            <Plus size={20} />
                            إضافة عرض جديد
                        </button>
                    </div>

                    {/* Filters Section */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="البحث عن العروض..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-12 py-2 bg-white/5 border border-white/10 rounded-xl text-white 
                                placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>                        <select
                            value={filterStage}
                            onChange={(e) => setFilterStage(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white 
                            focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                            [&>option]:text-gray-900"
                        >
                            <option value="all" className="text-gray-900">جميع الحالات</option>
                            <option value="DRAFT" className="text-gray-900">مسودة</option>
                            <option value="PUBLISHED" className="text-gray-900">منشور</option>
                            <option value="ARCHIVED" className="text-gray-900">مؤرشف</option>
                        </select>
                        <select
                            value={filterSection}
                            onChange={(e) => setFilterSection(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white 
                            focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                            [&>option]:text-gray-900"
                        >
                            <option value="all" className="text-gray-900">جميع المراحل</option>
                            <option value="FIRST_SEC" className="text-gray-900">الصف الأول الثانوي</option>
                            <option value="SECOND_SEC" className="text-gray-900">الصف الثاني الثانوي</option>
                            <option value="THIRD_SEC" className="text-gray-900">الصف الثالث الثانوي</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-white/10 rounded w-1/2 mb-6"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-white/10 rounded w-full"></div>
                                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOffers.map((offer) => (
                            <div
                                key={offer._id}
                                className="group bg-white/5 hover:bg-white/10 rounded-2xl p-6 border border-white/10 
                                transition-all duration-300 hover:border-indigo-500/50"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 
                                        transition-colors">{offer.title}</h3>
                                        <p className="text-gray-400 text-sm mt-1">{offer.subtitle}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setCurrentOffer(offer);
                                                setFormData({
                                                    ...offer,
                                                    endDate: new Date(offer.endDate).toISOString().split('T')[0]
                                                });
                                                setShowEditModal(true);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 
                                            hover:text-blue-300"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOffer(offer._id)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400 
                                            hover:text-red-300"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-gray-300 text-sm line-clamp-2">{offer.description}</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <p className="text-gray-400 text-xs">السعر قبل</p>
                                            <p className="text-white font-bold mt-1">{offer.originalPrice} جنيه</p>
                                        </div>
                                        <div className="bg-indigo-500/10 rounded-xl p-3">
                                            <p className="text-indigo-400 text-xs">السعر بعد</p>
                                            <p className="text-indigo-400 font-bold mt-1">{offer.discountPrice} جنيه</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded-full text-xs ${offer.stage === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' :
                                                offer.stage === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {offer.stage === 'PUBLISHED' ? 'منشور' :
                                                    offer.stage === 'DRAFT' ? 'مسودة' : 'مؤرشف'}
                                            </div>
                                            <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
                                                {offer.section === 'FIRST_SEC' ? 'الأول الثانوي' :
                                                    offer.section === 'SECOND_SEC' ? 'الثاني الثانوي' : 'الثالث الثانوي'}
                                            </div>
                                        </div>
                                        {offer.isLimited && (
                                            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs">
                                                {offer.spotsLeft} مقعد متبقي
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredOffers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 
                        text-indigo-400 mb-4">
                            <Search size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">لا توجد عروض</h3>
                        <p className="text-gray-400">لم يتم العثور على أي عروض تطابق معايير البحث الخاصة بك</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <OfferModal
                    isEdit={showEditModal}
                    onClose={() => {
                        showEditModal ? handleCloseEditModal() : handleCloseAddModal();
                        setCurrentStep(1);
                    }}
                    onSubmit={showEditModal ? handleEditOffer : handleAddOffer}
                    currentStep={currentStep}
                    steps={steps}
                    formData={formData}
                    onFormChange={handleFormChange}
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    formErrors={formErrors}
                    handleAddFeature={handleAddFeature}
                    handleRemoveFeature={handleRemoveFeature}
                    handleFeatureChange={handleFeatureChange}
                    courses={courses}
                    onCourseSelect={(courseId) => {
                        const updatedCourseLinks = formData.courseLinks.includes(courseId)
                            ? formData.courseLinks.filter(id => id !== courseId)
                            : [...formData.courseLinks, courseId];
                        handleFormChange('courseLinks', updatedCourseLinks);
                    }}
                />
            )}
        </div>
    );
};

export default OffersManagement;
