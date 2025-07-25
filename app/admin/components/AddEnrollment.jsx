'use client'
import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Check, AlertCircle, Layers, Book, Package, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

export default function AddEnrollment({ onEnrollmentAdded, onClose }) {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [enrollmentType, setEnrollmentType] = useState('course'); // 'course' or 'package'

    const [formData, setFormData] = useState({
        studentId: '',
        courseId: '',
        packageId: '',
        price: '',
        paymentStatus: 'paid'
    });

    const [searchStudent, setSearchStudent] = useState('');
    const [searchCourse, setSearchCourse] = useState('');
    const [searchPackage, setSearchPackage] = useState('');

    // Fetch students, courses, and packages on component mount
    useEffect(() => {
        fetchCourses();
        fetchPackages();
        setStudentsLoading(false); // Don't show loading initially
    }, []);

    // Debounced search for students - only search when user types
    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (searchStudent.trim().length >= 2) { // Only search when at least 2 characters
                setStudentsLoading(true);
                fetchStudents(searchStudent.trim());
            } else {
                setStudents([]); // Clear students when search is empty or too short
                setStudentsLoading(false);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(delayedSearch);
    }, [searchStudent]);

    const fetchStudents = async (searchTerm) => {
        try {
            const token = Cookies.get('token');
            // Only search with the provided term, don't load all students
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/students?limit=50&search=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch students');
            const data = await response.json();
            setStudents(data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('فشل في تحميل قائمة الطلاب');
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/allCourses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch courses');
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('فشل في تحميل قائمة الكورسات');
        } finally {
            setCoursesLoading(false);
        }
    };

    const fetchPackages = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch packages');
            const data = await response.json();
            setPackages(data.packages || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
            toast.error('فشل في تحميل قائمة الحزم');
        } finally {
            setPackagesLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted', formData, enrollmentType);

        // Validate form based on enrollment type
        if (enrollmentType === 'course') {
            if (!formData.studentId || !formData.courseId || !formData.price) {
                toast.error('يرجى ملء جميع الحقول المطلوبة');
                return;
            }
        } else { // package
            if (!formData.studentId || !formData.packageId || !formData.price) {
                toast.error('يرجى ملء جميع الحقول المطلوبة');
                return;
            }
        }

        setLoading(true);

        try {
            const token = Cookies.get('token');

            // Choose endpoint based on enrollment type
            const endpoint = enrollmentType === 'course'
                ? `${process.env.NEXT_PUBLIC_API_URL}/active/admin/create`
                : `${process.env.NEXT_PUBLIC_API_URL}/active-package/admin/create`;

            // Prepare the request body based on enrollment type
            const requestBody = enrollmentType === 'course'
                ? {
                    studentId: formData.studentId,
                    courseId: formData.courseId,
                    price: formData.price,
                    paymentStatus: formData.paymentStatus
                }
                : {
                    studentId: formData.studentId,
                    packageId: formData.packageId,
                    price: formData.price,
                    paymentStatus: formData.paymentStatus,
                    isPackage: true
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create enrollment');
            }

            const data = await response.json();

            // Format the enrollment data for the parent component
            let formattedEnrollment;
            if (enrollmentType === 'course') {
                formattedEnrollment = data.enrollment;
            } else {
                // Convert package enrollment to format compatible with PaymentsList
                const packageData = packages.find(p => p._id === formData.packageId);
                formattedEnrollment = {
                    _id: data.enrollment._id,
                    userEmail: students.find(s => s._id === formData.studentId)?.email || '',
                    phoneNumber: students.find(s => s._id === formData.studentId)?.phoneNumber || '',
                    courseName: packageData?.name || 'حزمة',
                    courseId: formData.packageId,
                    price: formData.price,
                    paymentStatus: formData.paymentStatus,
                    createdAt: new Date().toISOString(),
                    isPackage: true
                };
            }

            toast.success(enrollmentType === 'course' ? 'تم إضافة الاشتراك بنجاح' : 'تم إضافة اشتراك الحزمة بنجاح');
            onEnrollmentAdded?.(formattedEnrollment);
            onClose?.();
        } catch (error) {
            console.error('Error creating enrollment:', error);
            toast.error(error.message || 'فشل في إضافة الاشتراك');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        student.phoneNumber?.includes(searchStudent)
    );

    const filteredCourses = courses.filter(course =>
        course.name?.toLowerCase().includes(searchCourse.toLowerCase())
    );

    const filteredPackages = packages.filter(pkg =>
        pkg.name?.toLowerCase().includes(searchPackage.toLowerCase())
    );

    const selectedStudent = students.find(s => s._id === formData.studentId);
    const selectedCourse = courses.find(c => c._id === formData.courseId);
    const selectedPackage = packages.find(p => p._id === formData.packageId);

    // Auto-fill price when course/package is selected
    useEffect(() => {
        if (enrollmentType === 'course' && selectedCourse && !formData.price) {
            setFormData(prev => ({
                ...prev,
                price: selectedCourse.price || 0
            }));
        } else if (enrollmentType === 'package' && selectedPackage && !formData.price) {
            setFormData(prev => ({
                ...prev,
                price: selectedPackage.price || 0
            }));
        }
    }, [selectedCourse, selectedPackage, formData.price, enrollmentType]);

    // Clear irrelevant field when switching enrollment type
    useEffect(() => {
        if (enrollmentType === 'course') {
            setFormData(prev => ({ ...prev, packageId: '' }));
        } else {
            setFormData(prev => ({ ...prev, courseId: '' }));
        }
    }, [enrollmentType]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75  backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br  from-slate-900/95 to-slate-950/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-700/50 shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600/20 to-indigo-700/20 border-b border-slate-700/50">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                    <div className="relative flex items-center justify-between p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center gap-4 sm:gap-5 lg:gap-6">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl ring-2 ring-blue-500/20">
                                <UserPlus className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-arabicUI2 text-white mb-1">إضافة اشتراك جديد</h2>
                                <p className="text-slate-300 text-sm sm:text-base lg:text-lg hidden sm:block">إضافة طالب إلى كورس واستلام المدفوعات</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="p-2 sm:p-3 bg-white/10 rounded-xl transition-colors duration-200 group"
                        >
                            <X className="text-white group-hover:text-white" size={20} />
                        </motion.button>
                    </div>
                </div>

                {/* Enrollment Type Tabs */}
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex gap-2 sm:gap-4 bg-slate-800/70 backdrop-blur-md p-1.5 sm:p-2 rounded-xl">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setEnrollmentType('course')}
                            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                                ${enrollmentType === 'course'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-slate-700/50'}`}
                        >
                            <Book size={18} />
                            <span>اشتراك كورس</span>
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setEnrollmentType('package')}
                            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300
                                ${enrollmentType === 'package'
                                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-700 text-white font-medium shadow-lg shadow-purple-500/20'
                                    : 'text-slate-300 hover:bg-slate-700/50'}`}
                        >
                            <Package size={18} />
                            <span>اشتراك حزمة</span>
                        </motion.button>
                    </div>
                </div>

                {/* Form */}
                <div className="overflow-y-auto max-h-[calc(98vh-170px)] sm:max-h-[calc(95vh-220px)] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                        {/* Student and Course Selection - Responsive Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                            {/* Student Selection */}
                            <div className="space-y-4 sm:space-y-5">
                                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Search className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl font-arabicUI3 text-white">اختيار الطالب</label>
                                </div>

                                {/* Student Search */}
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="ابحث عن طالب (اسم، ايميل، تليفون)..."
                                        value={searchStudent}
                                        onChange={(e) => setSearchStudent(e.target.value)}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 text-sm sm:text-base"
                                    />
                                </div>

                                {/* Students List */}
                                <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-inner">
                                    <div className="max-h-48 sm:max-h-64 lg:max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                                        {studentsLoading ? (
                                            <div className="p-4 sm:p-5 text-center">
                                                <div className="inline-flex items-center gap-2 text-slate-300 text-sm sm:text-base">
                                                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                                    جاري تحميل الطلاب...
                                                </div>
                                            </div>
                                        ) : searchStudent.trim().length < 2 ? (
                                            <div className="p-4 sm:p-6 text-center text-white/60">
                                                <Search className="mx-auto mb-2 text-blue-400" size={20} />
                                                <p className="text-sm sm:text-base">ابدأ بكتابة اسم الطالب للبحث</p>
                                                <p className="text-xs sm:text-sm text-white/40 mt-1">على الأقل حرفين</p>
                                            </div>
                                        ) : filteredStudents.length === 0 ? (
                                            <div className="p-4 sm:p-5 text-center text-slate-400">
                                                <AlertCircle className="mx-auto mb-2 text-amber-400" size={20} />
                                                <p className="text-sm sm:text-base">لا توجد نتائج للبحث</p>
                                            </div>
                                        ) : (
                                            filteredStudents.map((student, index) => (
                                                <motion.div
                                                    key={student._id}
                                                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                    onClick={() => setFormData(prev => ({ ...prev, studentId: student._id }))}
                                                    className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-slate-700/70 last:border-b-0 ${formData.studentId === student._id
                                                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-700/20 border-blue-500/50'
                                                        : ''
                                                        } ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredStudents.length - 1 ? 'rounded-b-xl' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-white font-bold text-sm sm:text-base">
                                                                        {student.name?.charAt(0)?.toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-white font-semibold text-sm sm:text-base truncate">{student.name}</p>
                                                                    <p className="text-slate-300 text-xs sm:text-sm truncate" dir="ltr">{student.email}</p>
                                                                    {student.phoneNumber && (
                                                                        <p className="text-slate-300 text-xs sm:text-sm" dir="ltr">{student.phoneNumber}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {formData.studentId === student._id && (
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="text-blue-400 text-xs sm:text-sm font-medium hidden sm:inline">محدد</span>
                                                                <Check className="text-blue-400" size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Course/Package Selection */}
                            <div className="space-y-4 sm:space-y-5">
                                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg ${enrollmentType === 'course'
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                        : 'bg-gradient-to-br from-purple-600 to-fuchsia-700'
                                        } flex items-center justify-center`}>
                                        <Search className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl font-arabicUI3 text-white">
                                        {enrollmentType === 'course' ? 'اختيار الكورس' : 'اختيار الحزمة'}
                                    </label>
                                </div>

                                {enrollmentType === 'course' ? (
                                    <>
                                        {/* Course Search */}
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                placeholder="البحث عن كورس..."
                                                value={searchCourse}
                                                onChange={(e) => setSearchCourse(e.target.value)}
                                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        {/* Courses List */}
                                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-inner">
                                            <div className="max-h-48 sm:max-h-64 lg:max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                                                {coursesLoading ? (
                                                    <div className="p-4 sm:p-5 text-center">
                                                        <div className="inline-flex items-center gap-2 text-slate-300 text-sm sm:text-base">
                                                            <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-emerald-400 border-t-transparent rounded-full"></div>
                                                            جاري تحميل الكورسات...
                                                        </div>
                                                    </div>
                                                ) : filteredCourses.length === 0 ? (
                                                    <div className="p-4 sm:p-5 text-center text-slate-400">
                                                        <AlertCircle className="mx-auto mb-2 text-amber-400" size={20} />
                                                        <p className="text-sm sm:text-base">لا توجد نتائج للبحث</p>
                                                    </div>
                                                ) : (
                                                    filteredCourses.map((course, index) => (
                                                        <motion.div
                                                            key={course._id}
                                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                            onClick={() => setFormData(prev => ({ ...prev, courseId: course._id }))}
                                                            className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-slate-700/70 last:border-b-0 ${formData.courseId === course._id
                                                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/50'
                                                                : ''
                                                                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredCourses.length - 1 ? 'rounded-b-xl' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                                        {course.imageUrl ? (
                                                                            <img
                                                                                src={course.imageUrl}
                                                                                alt={course.name}
                                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Book className="text-white" size={16} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-white font-semibold text-sm sm:text-base truncate">{course.name}</p>
                                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium w-fit">
                                                                                {course.level}
                                                                            </span>
                                                                            <span className="text-emerald-400 font-bold text-sm sm:text-base">
                                                                                {course.price} جنيه
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {formData.courseId === course._id && (
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className="text-emerald-400 text-xs sm:text-sm font-medium hidden sm:inline">محدد</span>
                                                                        <Check className="text-emerald-400" size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Package Search */}
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                placeholder="البحث عن حزمة..."
                                                value={searchPackage}
                                                onChange={(e) => setSearchPackage(e.target.value)}
                                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 text-sm sm:text-base"
                                            />
                                        </div>

                                        {/* Packages List */}
                                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-inner">
                                            <div className="max-h-48 sm:max-h-64 lg:max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                                                {packagesLoading ? (
                                                    <div className="p-4 sm:p-5 text-center">
                                                        <div className="inline-flex items-center gap-2 text-slate-300 text-sm sm:text-base">
                                                            <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                                                            جاري تحميل الحزم...
                                                        </div>
                                                    </div>
                                                ) : filteredPackages.length === 0 ? (
                                                    <div className="p-4 sm:p-5 text-center text-slate-400">
                                                        <AlertCircle className="mx-auto mb-2 text-amber-400" size={20} />
                                                        <p className="text-sm sm:text-base">لا توجد نتائج للبحث</p>
                                                    </div>
                                                ) : (
                                                    filteredPackages.map((pkg, index) => (
                                                        <motion.div
                                                            key={pkg._id}
                                                            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                            onClick={() => setFormData(prev => ({ ...prev, packageId: pkg._id }))}
                                                            className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 border-b border-slate-700/70 last:border-b-0 ${formData.packageId === pkg._id
                                                                ? 'bg-gradient-to-r from-purple-600/20 to-fuchsia-700/10 border-purple-500/50'
                                                                : ''
                                                                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === filteredPackages.length - 1 ? 'rounded-b-xl' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                                        {pkg.imageUrl ? (
                                                                            <img
                                                                                src={pkg.imageUrl}
                                                                                alt={pkg.name}
                                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Package className="text-white" size={16} />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-white font-semibold text-sm sm:text-base truncate">{pkg.name}</p>
                                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium w-fit">
                                                                                {pkg.level}
                                                                            </span>
                                                                            <span className="text-purple-400 font-bold text-sm sm:text-base">
                                                                                {pkg.price} جنيه
                                                                                <span className="text-purple-400/70 line-through text-xs ml-1">
                                                                                    {pkg.originalPrice}
                                                                                </span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {formData.packageId === pkg._id && (
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className="text-purple-400 text-xs sm:text-sm font-medium hidden sm:inline">محدد</span>
                                                                        <Check className="text-purple-400" size={18} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Price and Payment Status Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Price Input */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <CreditCard className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl font-arabicUI3 text-white">السعر</label>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all duration-200 text-base sm:text-lg font-semibold"
                                        placeholder="أدخل السعر"
                                        min="0"
                                        required
                                    />
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 font-medium text-sm sm:text-base">
                                        جنيه
                                    </span>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center">
                                        <Check className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl font-arabicUI3 text-white">حالة الدفع</label>
                                </div>
                                <select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 text-sm sm:text-base appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                                >
                                    <option value="paid" className="bg-gray-800 text-white">✅ مفعل</option>
                                    <option value="pending" className="bg-gray-800 text-white">⏳ قيد المعالجة</option>
                                    <option value="failed" className="bg-gray-800 text-white">❌ غير مفعل</option>
                                </select>
                            </div>
                        </div>

                        {/* Selected Info Card */}
                        {(selectedStudent || selectedCourse || selectedPackage) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-gradient-to-r from-blue-600/10 to-indigo-700/10 border border-blue-500/20 rounded-2xl p-4 sm:p-6 shadow-lg"
                            >
                                <h4 className="text-blue-400 font-semibold text-lg sm:text-xl mb-4 flex items-center gap-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <AlertCircle size={16} />
                                    </div>
                                    ملخص الاشتراك
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                    {selectedStudent && (
                                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/70">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm sm:text-base font-bold">
                                                    {selectedStudent.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold text-sm sm:text-base truncate">{selectedStudent.name}</p>
                                                <p className="text-slate-300 text-xs sm:text-sm truncate" dir="ltr">{selectedStudent.email}</p>
                                                {selectedStudent.phoneNumber && (
                                                    <p className="text-slate-300 text-xs sm:text-sm" dir="ltr">{selectedStudent.phoneNumber}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {enrollmentType === 'course' && selectedCourse && (
                                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/70">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                {selectedCourse.imageUrl ? (
                                                    <img
                                                        src={selectedCourse.imageUrl}
                                                        alt={selectedCourse.name}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Book className="text-white" size={16} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold text-sm sm:text-base truncate">{selectedCourse.name}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs w-fit">
                                                        {selectedCourse.level}
                                                    </span>
                                                    <p className="text-emerald-400 font-bold text-sm sm:text-base">{selectedCourse.price} جنيه</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {enrollmentType === 'package' && selectedPackage && (
                                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700/70">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                {selectedPackage.imageUrl ? (
                                                    <img
                                                        src={selectedPackage.imageUrl}
                                                        alt={selectedPackage.name}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="text-white" size={16} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold text-sm sm:text-base truncate">{selectedPackage.name}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs w-fit">
                                                        {selectedPackage.level}
                                                    </span>
                                                    <p className="text-purple-400 font-bold text-sm sm:text-base">{selectedPackage.price} جنيه</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-700/50">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={onClose}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 font-medium text-base sm:text-lg border border-slate-700"
                            >
                                إلغاء
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading ||
                                    !formData.studentId ||
                                    (enrollmentType === 'course' ? !formData.courseId : !formData.packageId) ||
                                    !formData.price}
                                className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-500 disabled:hover:to-emerald-600 shadow-lg shadow-green-500/20 border border-green-500/30"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                                        <RefreshCw className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>جاري الإضافة...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                                        <UserPlus size={18} />
                                        <span>إضافة الاشتراك</span>
                                    </div>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
}
