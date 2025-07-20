'use client'
import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export default function AddEnrollment({ onEnrollmentAdded, onClose }) {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);

    const [formData, setFormData] = useState({
        studentId: '',
        courseId: '',
        price: '',
        paymentStatus: 'paid'
    });

    const [searchStudent, setSearchStudent] = useState('');
    const [searchCourse, setSearchCourse] = useState('');

    // Fetch courses on component mount (no students initially)
    useEffect(() => {
        fetchCourses();
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course`, {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.studentId || !formData.courseId || !formData.price) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoading(true);

        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/active/admin/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create enrollment');
            }

            const data = await response.json();
            toast.success('تم إضافة الاشتراك بنجاح');
            onEnrollmentAdded?.(data.enrollment);
            onClose?.();
        } catch (error) {
            console.error('Error creating enrollment:', error);
            toast.error(error.message || 'فشل في إضافة الاشتراك');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name?.toLowerCase().includes(searchCourse.toLowerCase())
    );

    const selectedStudent = students.find(s => s._id === formData.studentId);
    const selectedCourse = courses.find(c => c._id === formData.courseId);

    // Auto-fill price when course is selected
    useEffect(() => {
        if (selectedCourse && !formData.price) {
            setFormData(prev => ({
                ...prev,
                price: selectedCourse.price || 0
            }));
        }
    }, [selectedCourse, formData.price]);

    return (
        <div className="fixed inset-0  bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-b border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-600/10"></div>
                    <div className="relative flex items-center justify-between p-4 sm:p-6 lg:p-8 xl:p-10">
                        <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl ring-2 sm:ring-4 ring-green-500/20">
                                <UserPlus className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-arabicUI2 text-white mb-1 sm:mb-2">إضافة اشتراك جديد</h2>
                                <p className="text-white/70 text-sm sm:text-base lg:text-lg xl:text-xl hidden sm:block">إضافة طالب إلى كورس واستلام المدفوعات</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 sm:p-3 lg:p-4 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-105 group"
                        >
                            <X className="text-white group-hover:text-white/80" size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div className="overflow-y-auto max-h-[calc(98vh-80px)] sm:max-h-[calc(95vh-140px)]">
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-6 sm:space-y-8 lg:space-y-12">
                        {/* Student and Course Selection - Responsive Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                            {/* Student Selection */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Search className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl lg:text-2xl font-arabicUI3 text-white">اختيار الطالب</label>
                                </div>

                                {/* Student Search */}
                                <div className="relative group">
                                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-blue-400 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="ابحث عن طالب (اسم، ايميل، تليفون)..."
                                        value={searchStudent}
                                        onChange={(e) => setSearchStudent(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pl-10 sm:pl-14 text-white placeholder-white/50 outline-none focus:border-blue-500 focus:bg-white/15 transition-all duration-200 text-sm sm:text-base"
                                    />
                                    {studentsLoading && searchStudent && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Students List */}
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/20 shadow-inner">
                                    <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {studentsLoading ? (
                                            <div className="p-4 sm:p-6 text-center">
                                                <div className="inline-flex items-center gap-2 sm:gap-3 text-white/70 text-sm sm:text-base">
                                                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                                    جاري البحث...
                                                </div>
                                            </div>
                                        ) : searchStudent.trim().length < 2 ? (
                                            <div className="p-4 sm:p-6 text-center text-white/60">
                                                <Search className="mx-auto mb-2 text-blue-400" size={20} />
                                                <p className="text-sm sm:text-base">ابدأ بكتابة اسم الطالب للبحث</p>
                                                <p className="text-xs sm:text-sm text-white/40 mt-1">على الأقل حرفين</p>
                                            </div>
                                        ) : students.length === 0 ? (
                                            <div className="p-4 sm:p-6 text-center text-white/60">
                                                <AlertCircle className="mx-auto mb-2 text-yellow-400" size={20} />
                                                <p className="text-sm sm:text-base">لا توجد نتائج للبحث</p>
                                            </div>
                                        ) : (
                                            students.map((student, index) => (
                                                <div
                                                    key={student._id}
                                                    onClick={() => setFormData(prev => ({ ...prev, studentId: student._id }))}
                                                    className={`p-3 sm:p-4 lg:p-6 cursor-pointer hover:bg-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0 ${formData.studentId === student._id
                                                            ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/20 border-blue-500/50'
                                                            : 'hover:scale-[1.01]'
                                                        } ${index === 0 ? 'rounded-t-xl sm:rounded-t-2xl' : ''} ${index === students.length - 1 ? 'rounded-b-xl sm:rounded-b-2xl' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                                                                        {student.name?.charAt(0)?.toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-white font-semibold text-sm sm:text-base lg:text-xl truncate">{student.name}</p>
                                                                    <p className="text-white/70 text-xs sm:text-sm lg:text-base truncate" dir="ltr">{student.email}</p>
                                                                    {student.phoneNumber && (
                                                                        <p className="text-white/70 text-xs sm:text-sm lg:text-base" dir="ltr">{student.phoneNumber}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {formData.studentId === student._id && (
                                                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                                <span className="text-blue-400 text-xs sm:text-sm lg:text-base font-medium hidden sm:inline">محدد</span>
                                                                <Check className="text-blue-400" size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Course Selection */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                        <Search className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl lg:text-2xl font-arabicUI3 text-white">اختيار الكورس</label>
                                </div>

                                {/* Course Search */}
                                <div className="relative group">
                                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="البحث عن كورس..."
                                        value={searchCourse}
                                        onChange={(e) => setSearchCourse(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 pl-10 sm:pl-14 text-white placeholder-white/50 outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-200 text-sm sm:text-base"
                                    />
                                </div>

                                {/* Courses List */}
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/20 shadow-inner">
                                    <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {coursesLoading ? (
                                            <div className="p-4 sm:p-6 text-center">
                                                <div className="inline-flex items-center gap-2 sm:gap-3 text-white/70 text-sm sm:text-base">
                                                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-emerald-400 border-t-transparent rounded-full"></div>
                                                    جاري تحميل الكورسات...
                                                </div>
                                            </div>
                                        ) : filteredCourses.length === 0 ? (
                                            <div className="p-4 sm:p-6 text-center text-white/60">
                                                <AlertCircle className="mx-auto mb-2 text-yellow-400" size={20} />
                                                <p className="text-sm sm:text-base">لا توجد نتائج للبحث</p>
                                            </div>
                                        ) : (
                                            filteredCourses.map((course, index) => (
                                                <div
                                                    key={course._id}
                                                    onClick={() => setFormData(prev => ({ ...prev, courseId: course._id }))}
                                                    className={`p-3 sm:p-4 lg:p-6 cursor-pointer hover:bg-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0 ${formData.courseId === course._id
                                                            ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 border-emerald-500/50'
                                                            : 'hover:scale-[1.01]'
                                                        } ${index === 0 ? 'rounded-t-xl sm:rounded-t-2xl' : ''} ${index === filteredCourses.length - 1 ? 'rounded-b-xl sm:rounded-b-2xl' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                                                            <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white font-bold text-sm sm:text-base lg:text-lg">
                                                                    {course.name?.charAt(0)?.toUpperCase() || 'C'}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-white font-semibold text-sm sm:text-base lg:text-xl truncate">{course.name}</p>
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-4 mt-1 sm:mt-2">
                                                                    <span className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 bg-blue-500/20 text-blue-400 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium w-fit">
                                                                        {course.level}
                                                                    </span>
                                                                    <span className="text-emerald-400 font-bold text-sm sm:text-lg lg:text-xl">
                                                                        {course.price} جنيه
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {formData.courseId === course._id && (
                                                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                                <span className="text-emerald-400 text-xs sm:text-sm lg:text-base font-medium hidden sm:inline">محدد</span>
                                                                <Check className="text-emerald-400" size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Price and Payment Status Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            {/* Price Input */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm sm:text-lg lg:text-xl">£</span>
                                    </div>
                                    <label className="text-lg sm:text-xl lg:text-2xl font-arabicUI3 text-white">السعر</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 lg:py-5 text-white placeholder-white/50 outline-none focus:border-yellow-500 focus:bg-white/15 transition-all duration-200 text-base sm:text-lg lg:text-xl font-semibold"
                                        placeholder="أدخل السعر"
                                        min="0"
                                        required
                                    />
                                    <span className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 text-yellow-400 font-medium text-sm sm:text-base lg:text-lg">
                                        جنيه
                                    </span>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                        <Check className="text-white" size={16} />
                                    </div>
                                    <label className="text-lg sm:text-xl lg:text-2xl font-arabicUI3 text-white">حالة الدفع</label>
                                </div>
                                <select
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 lg:py-5 text-white outline-none focus:border-purple-500 focus:bg-white/15 transition-all duration-200 text-sm sm:text-base lg:text-lg"
                                >
                                    <option value="paid" className="bg-gray-800 text-white">✅ مفعل</option>
                                    <option value="pending" className="bg-gray-800 text-white">⏳ قيد المعالجة</option>
                                    <option value="failed" className="bg-gray-800 text-white">❌ غير مفعل</option>
                                </select>
                            </div>
                        </div>

                        {/* Selected Info Card */}
                        {(selectedStudent || selectedCourse) && (
                            <div className="bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
                                <h4 className="text-blue-400 font-semibold text-lg sm:text-xl lg:text-2xl mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 lg:gap-4">
                                    <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <AlertCircle size={16} />
                                    </div>
                                    ملخص الاشتراك
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {selectedStudent && (
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-5 bg-white/10 rounded-xl sm:rounded-2xl border border-white/10">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm sm:text-base lg:text-lg font-bold">
                                                    {selectedStudent.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold text-sm sm:text-base lg:text-lg truncate">{selectedStudent.name}</p>
                                                <p className="text-white/70 text-xs sm:text-sm lg:text-base truncate" dir="ltr">{selectedStudent.email}</p>
                                                {selectedStudent.phoneNumber && (
                                                    <p className="text-white/70 text-xs sm:text-sm" dir="ltr">{selectedStudent.phoneNumber}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedCourse && (
                                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-5 bg-white/10 rounded-xl sm:rounded-2xl border border-white/10">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm sm:text-base lg:text-lg font-bold">
                                                    {selectedCourse.name?.charAt(0)?.toUpperCase() || 'C'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-semibold text-sm sm:text-base lg:text-lg truncate">{selectedCourse.name}</p>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-3 mt-1">
                                                    <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs sm:text-sm w-fit">
                                                        {selectedCourse.level}
                                                    </span>
                                                    <p className="text-emerald-400 font-bold text-sm sm:text-base lg:text-lg">{selectedCourse.price} جنيه</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 pt-4 sm:pt-6 lg:pt-8 border-t border-white/20">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl transition-all duration-200 font-semibold text-base sm:text-lg lg:text-xl hover:scale-105 border border-white/20"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.studentId || !formData.courseId || !formData.price}
                                className="flex-1 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl transition-all duration-200 font-semibold text-base sm:text-lg lg:text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-xl disabled:hover:scale-100 border border-green-500/30"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
                                        <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-2 sm:border-3 border-white border-t-transparent rounded-full"></div>
                                        <span className="hidden sm:inline">جاري الإضافة...</span>
                                        <span className="sm:hidden">جاري...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                                        <UserPlus size={18} />
                                        <span className="hidden sm:inline">إضافة الاشتراك</span>
                                        <span className="sm:hidden">إضافة</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
