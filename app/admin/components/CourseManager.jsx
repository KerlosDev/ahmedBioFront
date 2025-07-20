'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaBook, FaVideo,
    FaQuestionCircle, FaSearch, FaFilter, FaBookmark, FaCopy, FaUpload,
    FaGraduationCap, FaListUl, FaArchive, FaClock, FaCheck, FaArrowLeft
} from 'react-icons/fa';
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineChartBar } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

import Cookies from 'js-cookie';

const CourseManager = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, draft, scheduled
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [newCourse, setNewCourse] = useState({
        name: '',
        description: '',
        price: 0,
        isFree: false,
        level: '',
        imageUrl: '',
        imageFile: null,
        isDraft: false,
        isScheduled: false,
        scheduledPublishDate: '',
        publishStatus: 'draft'
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseChapters, setCourseChapters] = useState([]);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [newChapter, setNewChapter] = useState({
        title: '',
        lessons: []
    });
    const [newLesson, setNewLesson] = useState({
        title: '',
        videoUrl: '',
        fileName: '',
        fileUrl: '',
    });
    const [chapterLoading, setChapterLoading] = useState(false);
    const [lessonLoading, setLessonLoading] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonInputs, setLessonInputs] = useState({});
    const [processingStatus, setProcessingStatus] = useState({
        show: false,
        step: 0,
        message: '',
        progress: 0
    }); const [availableExams, setAvailableExams] = useState([]);
    const [selectedExams, setSelectedExams] = useState([]);
    const [examSearchTerm, setExamSearchTerm] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const [examPagination, setExamPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalExams: 0
    });
    const [examPageSize] = useState(10);

    const totalSteps = 3;

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewCourse(prev => ({
                ...prev,
                imageFile: file,
                imageUrl: URL.createObjectURL(file)
            }));
            setUploadProgress(0);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []); const fetchCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course/allCourses`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCourses(response.data.courses || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('حدث خطأ في تحميل الكورسات');
            setLoading(false);
        }
    }; useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = Cookies.get('token');
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/exam`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        page: examPagination.currentPage,
                        limit: examPageSize,
                        search: examSearchTerm
                    }
                });

                setAvailableExams(response.data.exams);
                setExamPagination({
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages,
                    totalExams: response.data.totalExams
                });
            } catch (error) {
                console.error('Error fetching exams:', error);
                toast.error('حدث خطأ في تحميل الامتحانات');
            }
        };
        fetchExams();
    }, [examSearchTerm, examPagination.currentPage]);

    const updateProcessingStatus = (step, message, progress) => {
        setProcessingStatus({
            show: true,
            step,
            message,
            progress: Math.min(100, progress)
        });
    }; const handleSubmit = async (e) => {
        e.preventDefault();
        // Only process if we're on the last step
        if (currentStep !== totalSteps) {
            setCurrentStep(prev => prev + 1);
            return;
        }

        // Validation for scheduled courses
        if (newCourse.isScheduled) {
            if (!newCourse.scheduledPublishDate) {
                toast.error('يرجى تحديد تاريخ ووقت النشر المجدول');
                return;
            }
            const scheduledDate = new Date(newCourse.scheduledPublishDate);
            const now = new Date();
            if (scheduledDate <= now) {
                toast.error('يجب أن يكون تاريخ النشر المجدول في المستقبل');
                return;
            }
        }

        setUploadProgress(0);
        updateProcessingStatus(1, 'جاري تجهيز البيانات...', 10);

        try {
            const token = Cookies.get('token');
            const formData = new FormData();

            formData.append('name', newCourse.name);
            formData.append('description', newCourse.description);
            formData.append('price', newCourse.price);
            formData.append('isFree', newCourse.isFree);
            formData.append('level', newCourse.level);
            formData.append('isDraft', newCourse.isDraft);
            formData.append('isScheduled', newCourse.isScheduled);
            formData.append('scheduledPublishDate', newCourse.scheduledPublishDate);
            formData.append('publishStatus', newCourse.publishStatus);
            formData.append("exams", JSON.stringify(selectedExams.map(exam => exam._id)));

            if (newCourse.imageFile) {
                updateProcessingStatus(2, 'جاري رفع الصورة...', 30);
                formData.append('image', newCourse.imageFile);
            } else if (newCourse.imageUrl) {
                formData.append('imageUrl', newCourse.imageUrl);
            } const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                    updateProcessingStatus(2, 'جاري رفع الصورة...', 30 + (progress * 0.3));
                }
            };

            updateProcessingStatus(3, 'جاري حفظ البيانات...', 70);

            if (editingCourse) {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/course/${editingCourse._id}`, formData, config);
                updateProcessingStatus(4, 'تم تحديث الكورس بنجاح!', 100);
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/course/create`, formData, config);
                updateProcessingStatus(4, 'تم إضافة الكورس بنجاح!', 100);
            }

            // Auto close after success
            setTimeout(() => {
                setProcessingStatus(prev => ({ ...prev, show: false }));
                setShowForm(false);
                setEditingCourse(null);
                setNewCourse({
                    name: '',
                    description: '',
                    price: 0,
                    isFree: false,
                    level: '',
                    imageUrl: '',
                    imageFile: null,
                    isDraft: false,
                    isScheduled: false,
                    scheduledPublishDate: '',
                    publishStatus: 'draft'
                });
                setUploadProgress(0);
                fetchCourses();
            }, 1500);

        } catch (error) {
            console.error('Error saving course:', error);
            updateProcessingStatus(4, error.response?.data?.message || 'حدث خطأ في حفظ الكورس', 100);
            toast.error(error.response?.data?.message || 'حدث خطأ في حفظ الكورس');
            setTimeout(() => {
                setProcessingStatus(prev => ({ ...prev, show: false }));
            }, 2000);
        }
    }; const handleDelete = async (courseId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
            try {
                const token = Cookies.get('token');
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/course/${courseId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                toast.success('تم حذف الكورس بنجاح');
                fetchCourses();
            } catch (error) {
                console.error('Error deleting course:', error);
                toast.error('حدث خطأ في حذف الكورس');
            }
        }
    }; const handleCourseSelect = async (course) => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course/admin/${course._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = response.data;
            setSelectedCourse(data);
            setCourseChapters(data.chapters || []);
            setEditingCourse(data);
            setNewCourse({
                name: data.name || '',
                description: data.description || '',
                price: data.price || 0,
                isFree: data.isFree || false,
                level: data.level || '',
                imageUrl: data.imageUrl || '',
                imageFile: null,
                isDraft: data.isDraft ?? false,
                isScheduled: data.isScheduled ?? false,
                scheduledPublishDate: data.scheduledPublishDate || '',
                publishStatus: data.publishStatus || 'draft'
            });
            setSelectedExams(data.exams || []);
            setCurrentStep(1); // Reset to first step when opening a course
            setShowForm(true);
            setLessonInputs({});
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('حدث خطأ في تحميل تفاصيل الكورس');
        }
    };

    const handleEditCourse = async (course) => {
        await handleCourseSelect(course);
    };


    // Add filteredCourses logic
    const filteredCourses = courses.filter(course => {
        // Filter by search term
        const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase());
        // Filter by status
        let matchesFilter = true;
        if (filter === "active") matchesFilter = !course.isDraft && course.publishStatus !== 'scheduled';
        if (filter === "draft") matchesFilter = !!course.isDraft;
        if (filter === "scheduled") matchesFilter = course.publishStatus === 'scheduled';
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return <div className="p-6">Loading...</div>;
    } const handleAddChapter = async () => {
        if (!newChapter.title) {
            toast.error('يرجى إدخال عنوان الفصل');
            return;
        }

        setChapterLoading(true);
        try {
            const token = Cookies.get('token');
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/chapter`, {
                title: newChapter.title,
                lessons: [],
                courseId: selectedCourse._id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setCourseChapters(prev => [...prev, response.data.chapter]);
            setNewChapter({ title: '', lessons: [] });
            setShowChapterModal(false);
            toast.success('تم إضافة الفصل بنجاح');
        } catch (error) {
            console.error('Error adding chapter:', error);
            toast.error('حدث خطأ في إضافة الفصل');
        } finally {
            setChapterLoading(false);
        }
    }; const handleDeleteChapter = async (chapterId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
            try {
                const token = Cookies.get('token');
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/chapter/${chapterId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    data: { courseId: selectedCourse._id }
                });

                setCourseChapters(prev => prev.filter(chapter => chapter._id !== chapterId));
                toast.success('تم حذف الفصل بنجاح');
            } catch (error) {
                console.error('Error deleting chapter:', error);
                toast.error('حدث خطأ في حذف الفصل');
            }
        }
    }; const handleUpdateChapter = async (chapterId, updatedData) => {
        try {
            const token = Cookies.get('token');
            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/chapter/${chapterId}`, {
                title: updatedData.title,
                lessons: updatedData.lessons,
                courseId: selectedCourse._id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setCourseChapters(prev => prev.map(chapter =>
                chapter._id === chapterId ? response.data.chapter : chapter
            ));

            // Update the selected course chapters
            setSelectedCourse(prev => ({
                ...prev,
                chapters: courseChapters
            }));

            toast.success('تم تحديث الفصل بنجاح');
        } catch (error) {
            console.error('Error updating chapter:', error);
            toast.error(error.response?.data?.message || 'حدث خطأ في تحديث الفصل');
        }
    };

    const handleAddLesson = async (chapterId) => {
        const lessonInput = lessonInputs[chapterId];
        if (!lessonInput?.title || !lessonInput?.videoUrl) {
            toast.error('يرجى إدخال عنوان الدرس ورابط الفيديو');
            return;
        }

        const updatedChapter = courseChapters.find(c => c._id === chapterId);
        if (!updatedChapter) return;

        const newLessonObj = {
            title: lessonInput.title,
            videoUrl: lessonInput.videoUrl,
            fileName: lessonInput.fileName || '',
            fileUrl: lessonInput.fileUrl || '',
        };

        try {
            await handleUpdateChapter(chapterId, {
                ...updatedChapter,
                lessons: [...(updatedChapter.lessons || []), newLessonObj]
            });

            setLessonInputs(prev => ({
                ...prev,
                [chapterId]: { title: '', videoUrl: '', fileName: '', fileUrl: '' }
            }));
        } catch (error) {
            console.error('Error adding lesson:', error);
            toast.error('حدث خطأ في إضافة الدرس');
        }
    };

    const handleDeleteLesson = async (chapterId, lessonId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
            const updatedChapter = courseChapters.find(c => c._id === chapterId);
            if (!updatedChapter) return;

            try {
                await handleUpdateChapter(chapterId, {
                    ...updatedChapter,
                    lessons: updatedChapter.lessons.filter(lesson => lesson._id !== lessonId)
                });
            } catch (error) {
                console.error('Error deleting lesson:', error);
                toast.error('حدث خطأ في حذف الدرس');
            }
        }
    };

    const handleEditLesson = async (chapterId, lessonId, updatedLesson) => {
        const updatedChapter = courseChapters.find(c => c._id === chapterId);
        if (!updatedChapter) return;

        try {
            await handleUpdateChapter(chapterId, {
                ...updatedChapter,
                lessons: updatedChapter.lessons.map(lesson =>
                    lesson._id === lessonId ? { ...lesson, ...updatedLesson } : lesson
                )
            });
        } catch (error) {
            console.error('Error updating lesson:', error);
            toast.error('حدث خطأ في تحديث الدرس');
        }
    };

    const handleEditChapterSubmit = async () => {
        if (!editingChapter) return;

        try {
            await handleUpdateChapter(editingChapter._id, editingChapter);
            setEditingChapter(null);
        } catch (error) {
            console.error('Error updating chapter:', error);
            toast.error('حدث خطأ في تحديث الفصل');
        }
    };

    const handleEditLessonSubmit = async () => {
        if (!editingLesson || !editingLesson.chapterId) return;

        const updatedChapter = courseChapters.find(c => c._id === editingLesson.chapterId);
        if (!updatedChapter) return;

        try {
            const updatedLessons = updatedChapter.lessons.map(lesson =>
                lesson._id === editingLesson._id ? editingLesson : lesson
            );

            await handleUpdateChapter(editingLesson.chapterId, {
                ...updatedChapter,
                lessons: updatedLessons
            });

            setEditingLesson(null);
        } catch (error) {
            console.error('Error updating lesson:', error);
            toast.error('حدث خطأ في تحديث الدرس');
        }
    };

    const handleToggleLessonFree = async (chapterId, lessonId, isFree) => {
        try {
            const token = Cookies.get('token');
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/course/chapter/${chapterId}/lesson/${lessonId}/toggle-free`,
                { isFree },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update local state
            setCourseChapters(prevChapters =>
                prevChapters.map(chapter => {
                    if (chapter._id === chapterId) {
                        return {
                            ...chapter,
                            lessons: chapter.lessons.map(lesson =>
                                lesson._id === lessonId ? { ...lesson, isFree } : lesson
                            )
                        };
                    }
                    return chapter;
                })
            );

            toast.success(`تم ${isFree ? 'جعل' : 'إلغاء'} الدرس مجاني بنجاح`);
        } catch (error) {
            console.error('Error toggling lesson free status:', error);
            toast.error('حدث خطأ في تحديث حالة الدرس');
        }
    };

    const handleExamSelection = (examId) => {
        const exam = availableExams.find(e => e._id === examId);
        if (exam) {
            setSelectedExams(prev => {
                const isAlreadySelected = prev.some(e => e._id === examId);
                if (isAlreadySelected) {
                    return prev.filter(e => e._id !== examId);
                } else {
                    return [...prev, exam];
                }
            });
        }
    };

    const filteredAvailableExams = availableExams
        .filter(exam => !selectedExams.some(selected => selected._id === exam._id))
        .filter(exam => exam.title.toLowerCase().includes(examSearchTerm.toLowerCase()));

    const ProcessingModal = () => {
        if (!processingStatus.show) return null;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md 
                             border border-white/10 shadow-2xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 h-1 bg-gray-700 w-full">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${processingStatus.progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            {processingStatus.step < 4 ? (
                                <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                >
                                    {processingStatus.progress === 100 ? (
                                        <FaCheck className="text-green-500 text-lg" />
                                    ) : (
                                        <FaTimes className="text-red-500 text-lg" />
                                    )}
                                </motion.div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-arabicUI3 text-white">
                                {processingStatus.step === 4 ? 'اكتمل' : 'جاري المعالجة'}
                            </h3>
                            <p className="text-gray-400 text-sm">{processingStatus.message}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">التقدم</span>
                            <span className="text-white">{processingStatus.progress}%</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    // Add this new component for step indicators
    const StepIndicator = ({ step, label, isActive, isCompleted }) => (
        <div className={`flex items-center ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isActive ? 'border-blue-400 bg-blue-400/10' :
                        isCompleted ? 'border-green-400 bg-green-400/10' : 'border-gray-600 bg-gray-700/50'}`}>
                    {isCompleted ? (
                        <FaCheck className="text-green-400" size={12} />
                    ) : (
                        <span className={isActive ? 'text-blue-400' : 'text-gray-400'}>{step}</span>
                    )}
                </div>
            </div>
            <div className="ml-3">
                <p className={`text-sm font-arabicUI3 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {label}
                </p>
            </div>
        </div>
    );

    // Replace the footer section in the form modal with this:
    const FormFooter = () => (
        <div className="sticky bottom-0 backdrop-blur-xl bg-gray-900/90 p-6 border-t border-white/10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    {/* Step Indicators */}
                    <div className="hidden md:flex items-center gap-8">
                        <StepIndicator
                            step={1}
                            label="المعلومات الأساسية"
                            isActive={currentStep === 1}
                            isCompleted={currentStep > 1}
                        />
                        <div className="w-12 h-0.5 bg-gray-700" />
                        <StepIndicator
                            step={2}
                            label="المحتوى والفصول"
                            isActive={currentStep === 2}
                            isCompleted={currentStep > 2}
                        />
                        <div className="w-12 h-0.5 bg-gray-700" />
                        <StepIndicator
                            step={3}
                            label="الامتحانات والنشر"
                            isActive={currentStep === 3}
                            isCompleted={currentStep > 3}
                        />

                    </div>

                    {/* Mobile Step Indicators */}
                    <div className="flex md:hidden items-center gap-2">
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 
                                    ${currentStep === step ? 'bg-blue-500 w-8' :
                                        currentStep > step ? 'bg-green-500' : 'bg-gray-600'}`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl 
                                         transition-all duration-300 flex items-center gap-2"
                            >
                                <FaArrowLeft className="rotate-180" size={14} />
                                السابق
                            </button>
                        )}
                        <button
                            type={currentStep === totalSteps ? 'submit' : 'button'}
                            onClick={currentStep < totalSteps ?
                                () => setCurrentStep(prev => prev + 1) : undefined}
                            className={`px-5 py-2.5 rounded-xl transition-all duration-300 
                                flex items-center gap-2 ${currentStep === totalSteps ?
                                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' :
                                    'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                        >
                            {currentStep === totalSteps ? (
                                <>
                                    <FaSave size={14} />
                                    {editingCourse ? 'حفظ التغييرات' : 'إضافة الكورس'}
                                </>
                            ) : (
                                <>
                                    التالي
                                    <FaArrowLeft size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6   font-arabicUI3   rounded-lg shadow-lg min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-gray-800/80 to-gray-900/90 p-4 rounded-xl border border-white/10">
                <h2 className="text-2xl font-arabicUI3 text-white  ">إدارة الكورسات</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300"
                >
                    <FaPlus /> إضافة كورس جديد
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-8">
                {[
                    {
                        label: 'إجمالي الكورسات',
                        value: courses.length,
                        icon: FaBook,
                        color: 'from-blue-600/20 to-blue-400/20',
                        iconColor: 'text-blue-400',
                        borderColor: 'border-blue-500/20'
                    },
                    {
                        label: 'الكورسات المنشورة',
                        value: courses.filter(c => !c.isDraft && c.publishStatus !== 'scheduled').length,
                        icon: FaVideo,
                        color: 'from-green-600/20 to-green-400/20',
                        iconColor: 'text-green-400',
                        borderColor: 'border-green-500/20'
                    },
                    {
                        label: 'المجدولة للنشر',
                        value: courses.filter(c => c.publishStatus === 'scheduled').length,
                        icon: FaClock,
                        color: 'from-purple-600/20 to-purple-400/20',
                        iconColor: 'text-purple-400',
                        borderColor: 'border-purple-500/20'
                    },
                    {
                        label: 'المسودات',
                        value: courses.filter(c => c.isDraft).length,
                        icon: FaEdit,
                        color: 'from-yellow-600/20 to-yellow-400/20',
                        iconColor: 'text-yellow-400',
                        borderColor: 'border-yellow-500/20'
                    },
                    {
                        label: 'الكورسات المجانية',
                        value: courses.filter(c => c.isFree).length,
                        icon: FaBookmark,
                        color: 'from-purple-600/20 to-purple-400/20',
                        iconColor: 'text-purple-400',
                        borderColor: 'border-purple-500/20'
                    }
                ].map((stat, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={index}
                        className={`relative overflow-hidden bg-gradient-to-br ${stat.color} 
                            backdrop-blur-xl rounded-xl p-6 border ${stat.borderColor}
                            hover:shadow-lg hover:shadow-white/5 transition-all duration-300`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-white/5 ${stat.iconColor}`}>
                                <stat.icon className="text-2xl" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-arabicUI3">{stat.label}</p>
                                <h3 className="text-3xl font-arabicUI3 text-white mt-1">
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2">
                            <stat.icon className={`text-8xl opacity-10 ${stat.iconColor}`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search and Filter Section */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث عن كورس..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all [&>option]:text-black"
                >
                    <option className=' text-black'  value="all">جميع الكورسات</option>
                    <option  className=' text-black' value="active">الكورسات النشطة</option>
                    <option   className=' text-black'value="draft">المسودات</option>
                    <option   className=' text-black' value="scheduled">المجدولة للنشر</option>
                </select>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <motion.div
                        key={course._id || `temp-${course.name}-${Date.now()}`}
                        onClick={() => setTimeout(() => handleCourseSelect(course), 0)}
                        className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/90 backdrop-blur-xl 
                                 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2
                                 hover:shadow-blue-500/30 border border-white/10 hover:border-blue-500/50 cursor-pointer"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 z-10 
                                          group-hover:from-black/50 group-hover:to-black/80 transition-all duration-500" />
                            <div className="absolute inset-0 bg-grid-white/[0.02] z-10" />
                            <img
                                src={course.imageUrl || "/chbg.p"}
                                alt={course.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 transform-gpu"
                            />

                            {/* Status Badge */}
                            <div className="absolute top-4 left-4 z-20 transform group-hover:-translate-x-1 transition-transform duration-300">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-arabicUI3 flex items-center gap-2
                                    backdrop-blur-md shadow-lg border transition-colors duration-300
                                    ${course.publishStatus === 'scheduled' ?
                                        'bg-purple-500/20 text-purple-300 border-purple-400/30 group-hover:bg-purple-500/30' :
                                        course.isDraft ?
                                            'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 group-hover:bg-yellow-500/30' :
                                            'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 group-hover:bg-emerald-500/30'}`}>
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${course.publishStatus === 'scheduled' ? 'bg-purple-400' :
                                            course.isDraft ? 'bg-yellow-400' : 'bg-emerald-400'
                                        }`}></span>
                                    {course.publishStatus === 'scheduled' ? 'مجدول' :
                                        course.isDraft ? 'مسودة' : 'منشور'}
                                </div>

                                {/* Scheduled Date Badge */}
                                {course.publishStatus === 'scheduled' && course.scheduledPublishDate && (
                                    <div className="mt-2 px-2 py-1 rounded-md text-xs bg-purple-500/10 text-purple-300 border border-purple-400/20">
                                        <FaClock className="inline mr-1" size={10} />
                                        {new Date(course.scheduledPublishDate).toLocaleDateString('ar-EG', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Price Badge */}
                            {!course.isFree && (
                                <div className="absolute top-4 right-4 z-20 transform group-hover:translate-x-1 transition-transform duration-300">
                                    <div className="px-3 py-1.5 rounded-full text-xs font-arabicUI3 bg-gradient-to-r 
                                                  from-amber-500/90 to-amber-600/90 text-white shadow-lg backdrop-blur-sm border border-amber-400/30
                                                  group-hover:from-amber-600/90 group-hover:to-amber-700/90 transition-all duration-300
                                                  flex items-center gap-2">
                                        <FaBookmark className="text-amber-200" size={12} />
                                        <span className="font-arabicUI3">{course.price} جنيه</span>
                                    </div>
                                </div>
                            )}

                            {/* Course Stats */}
                            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between transform translate-y-0 
                                          group-hover:translate-y-1 transition-transform duration-300">
                                <div className="flex gap-2">
                                    <div className="px-3 py-1.5 rounded-full text-xs font-arabicUI3 bg-white/10 backdrop-blur-md
                                                 text-white border border-white/20 group-hover:bg-white/20 transition-colors duration-300
                                                 flex items-center gap-2">
                                        <FaVideo className="text-blue-400" size={12} />
                                        <span>{course.chapters?.length || 0} فصول</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-full text-xs font-arabicUI3 bg-white/10 backdrop-blur-md
                                                 text-white border border-white/20 group-hover:bg-white/20 transition-colors duration-300
                                                 flex items-center gap-2">
                                        <FaQuestionCircle className="text-purple-400" size={12} />
                                        <span>{course.exams?.length || 0} امتحانات</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 
                                          opacity-0 group-hover:opacity-10 transition-opacity duration-500" />

                            <h3 className="text-xl font-arabicUI3 text-white mb-2 group-hover:text-blue-400 transition-colors 
                                         duration-300 line-clamp-1">
                                {course.name}
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-light group-hover:text-gray-300 
                                      transition-colors duration-300">
                                {course.description || 'No description available'}
                            </p>

                            <div className="flex gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        // Use callback to avoid setState during render
                                        setTimeout(() => handleEditCourse(course), 0);
                                    }}
                                    className="flex-1 py-2 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                                             rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                                             hover:shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-0.5"
                                >
                                    <FaEdit size={14} />
                                    <span>تعديل</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        // Use callback to avoid setState during render
                                        setTimeout(() => handleDelete(course._id), 0);
                                    }}
                                    className="flex-1 py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 
                                             rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                                             hover:shadow-lg hover:shadow-red-500/10 transform hover:-translate-y-0.5"
                                >
                                    <FaTrash size={14} />
                                    <span>حذف</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add/Edit Course Modal */}

            {showForm && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center  m-6 z-50  pt-24">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-5xl 
                     border border-white/10 shadow-2xl my-8 relative overflow-hidden"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700/50">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                initial={{ width: "0%" }}
                                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Header */}
                        <div className="sticky top-0 backdrop-blur-xl bg-gray-900/90 p-6 border-b border-white/10 flex justify-between items-center z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                                    {editingCourse ? <FaEdit size={20} /> : <FaPlus size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-arabicUI3 text-white">
                                        {editingCourse ? 'تعديل الكورس' : 'إضافة كورس جديد'}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {currentStep === 1 ? 'المعلومات الأساسية' :
                                            currentStep === 2 ? 'المحتوى والفصول' : 'الامتحانات والاعدادات'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingCourse(null);
                                    setCurrentStep(1);
                                }}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-gray-400 hover:text-white text-xl" />
                            </button>
                        </div>

                        {/* Form Content */}
                        <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Step 1: Basic Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Course Title */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-arabicUI3 text-gray-400">عنوان الكورس</label>
                                                <input
                                                    type="text"
                                                    value={newCourse.name}
                                                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white 
                                                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    placeholder="أدخل عنوان الكورس"
                                                    required
                                                />
                                            </div>

                                            {/* Course Level */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-arabicUI3 text-gray-400">المستوى الدراسي</label>
                                                <select
                                                    value={newCourse.level}
                                                    onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white 
                                                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    required
                                                >
                                                    <option   className=' text-black' value="">اختر المستوى</option>
                                                    <option className=' text-black' value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                                                    <option  className=' text-black' value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                                                    <option  className=' text-black' value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                                                </select>
                                            </div>

                                            {/* Course Description */}
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-sm font-arabicUI3 text-gray-400">وصف الكورس</label>
                                                <textarea
                                                    value={newCourse.description}
                                                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white 
                                                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    placeholder="اكتب وصفاً مختصراً للكورس"
                                                    rows="4"
                                                    required
                                                />
                                            </div>

                                            {/* Course Image */}
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-sm font-arabicUI3 text-gray-400">صورة الكورس</label>
                                                <div className="flex gap-6 items-start">
                                                    {newCourse.imageUrl && (
                                                        <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                                                            <img
                                                                src={newCourse.imageUrl}
                                                                alt="Course preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {uploadProgress > 0 && uploadProgress < 100 && (
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                    <div className="w-16 h-16 relative">
                                                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                                                            <path
                                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                                fill="none"
                                                                                stroke="#3B82F6"
                                                                                strokeWidth="3"
                                                                                strokeDasharray={`${uploadProgress}, 100`}
                                                                            />
                                                                        </svg>
                                                                        <span className="absolute inset-0 flex items-center justify-center text-white text-sm">
                                                                            {uploadProgress}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <label className="flex flex-col items-center px-4 py-6 bg-white/5 border border-white/10 
                                                                        rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                                            <FaUpload className="text-blue-400 text-xl mb-2" />
                                                            <span className="text-sm text-gray-400">اختر صورة للكورس</span>
                                                            <input
                                                                type="file"
                                                                onChange={handleImageChange}
                                                                accept="image/*"
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            * يفضل أن تكون الصورة بأبعاد 16:9 وبحجم لا يتجاوز 2MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        {!editingCourse ? (
                                            // Show message when adding new course
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FaBook className="text-blue-400 text-2xl" />
                                                </div>
                                                <h4 className="text-white text-lg font-arabicUI3 mb-2">
                                                    يجب حفظ الكورس أولاً
                                                </h4>
                                                <p className="text-gray-400">
                                                    قم بإكمال المعلومات الأساسية وحفظ الكورس قبل إضافة الفصول
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Existing chapter management UI */}
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-lg font-arabicUI3 text-white flex items-center gap-2">
                                                        <FaBook className="text-blue-400" />
                                                        فصول الكورس
                                                    </h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowChapterModal(true)}
                                                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                                 rounded-xl transition-all duration-300 flex items-center gap-2"
                                                    >
                                                        <FaPlus size={14} />
                                                        إضافة فصل جديد
                                                    </button>
                                                </div>


                                                {/* Chapters grid */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {/* Existing chapters mapping */}
                                                    {courseChapters.map((chapter, index) => (
                                                        <div key={chapter._id || `temp-chapter-${index}`} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h5 className="text-white font-arabicUI3 flex items-center gap-2">
                                                                    <span className="text-blue-400">#{index + 1}</span>
                                                                    {chapter.title}
                                                                </h5>
                                                                <div className="flex items-center gap-2">
                                                                    <button type="button" onClick={() => setEditingChapter(chapter)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                                        <FaEdit size={14} />
                                                                    </button>
                                                                    <button type="button" onClick={() => handleDeleteChapter(chapter._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                        <FaTrash size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Lessons List */}
                                                            <div className="pl-6 border-r border-white/10 space-y-3">
                                                                {chapter.lessons?.map((lesson, lessonIndex) => (
                                                                    <div key={lesson._id || `temp-lesson-${chapter._id}-${lessonIndex}`} className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <FaVideo size={12} />
                                                                            <span className="text-gray-400">{lesson.title}</span>
                                                                            {lesson.isFree && (
                                                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                                                                    مجاني
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleToggleLessonFree(chapter._id, lesson._id, !lesson.isFree)}
                                                                                className={`p-1.5 rounded-lg transition-colors ${
                                                                                    lesson.isFree 
                                                                                        ? 'text-green-400 hover:bg-green-500/10' 
                                                                                        : 'text-gray-400 hover:bg-gray-500/10'
                                                                                }`}
                                                                                title={lesson.isFree ? 'إلغاء المجاني' : 'جعل مجاني'}
                                                                            >
                                                                                <FaBookmark size={12} />
                                                                            </button>
                                                                            <button type="button" onClick={() => setEditingLesson({ ...lesson, chapterId: chapter._id })} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                                                <FaEdit size={12} />
                                                                            </button>
                                                                            <button type="button" onClick={() => handleDeleteLesson(chapter._id, lesson._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                                <FaTrash size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* Add Lesson Form */}
                                                                <div className=" grid grid-rows-1 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={lessonInputs[chapter._id]?.title || ''}
                                                                        onChange={(e) => setLessonInputs(prev => ({ ...prev, [chapter._id]: { ...prev[chapter._id], title: e.target.value } }))}
                                                                        placeholder="عنوان الدرس"
                                                                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={lessonInputs[chapter._id]?.videoUrl || ''}
                                                                        onChange={(e) => setLessonInputs(prev => ({ ...prev, [chapter._id]: { ...prev[chapter._id], videoUrl: e.target.value } }))}
                                                                        placeholder="رابط الفيديو"
                                                                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={lessonInputs[chapter._id]?.fileName || ''}
                                                                        onChange={(e) => setLessonInputs(prev => ({ ...prev, [chapter._id]: { ...prev[chapter._id], fileName: e.target.value } }))}
                                                                        placeholder="اسم الملف (اختياري)"
                                                                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={lessonInputs[chapter._id]?.fileUrl || ''}
                                                                        onChange={(e) => setLessonInputs(prev => ({ ...prev, [chapter._id]: { ...prev[chapter._id], fileUrl: e.target.value } }))}
                                                                        placeholder="رابط الملف (اختياري)"
                                                                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAddLesson(chapter._id)}
                                                                        className="p-2 flex place-items-center w-fit bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                                    >
                                                                        <FaPlus size={14} />اضافة
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Exams and Settings */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        {/* Course Settings */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Price Settings */}
                                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-500/20">
                                                            <FaBookmark className="text-blue-400 text-lg" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-arabicUI3">كورس مجاني</h4>
                                                            <p className="text-gray-400 text-sm">يمكن للطلاب الوصول مجاناً</p>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={newCourse.isFree}
                                                            onChange={(e) => setNewCourse({ ...newCourse, isFree: e.target.checked })}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 relative 
                                                                      after:content-[''] after:absolute after:top-0.5 after:left-[4px] 
                                                                      after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all 
                                                                      peer-checked:after:translate-x-full" />
                                                    </label>
                                                </div>
                                                {!newCourse.isFree && (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={newCourse.price}
                                                            onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) || 0 })}
                                                            className="w-full p-3 pl-16 bg-white/5 border border-white/10 rounded-xl text-white"
                                                            placeholder="السعر"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">جنيه</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Draft Settings */}
                                            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/20 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-yellow-500/20">
                                                            <FaArchive className="text-yellow-400 text-lg" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-arabicUI3">وضع المسودة</h4>
                                                            <p className="text-gray-400 text-sm">الكورس غير مرئي للطلاب</p>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={newCourse.isDraft}
                                                            onChange={(e) => setNewCourse({ ...newCourse, isDraft: e.target.checked })}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-checked:bg-yellow-500 relative 
                                                                      after:content-[''] after:absolute after:top-0.5 after:left-[4px] 
                                                                      after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all 
                                                                      peer-checked:after:translate-x-full" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scheduling Section */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                                        <FaClock className="text-purple-400 text-lg" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-arabicUI3">جدولة النشر</h4>
                                                        <p className="text-gray-400 text-sm">نشر الكورس في وقت محدد</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newCourse.isScheduled}
                                                        onChange={(e) => {
                                                            const isScheduled = e.target.checked;
                                                            setNewCourse({
                                                                ...newCourse,
                                                                isScheduled,
                                                                publishStatus: isScheduled ? 'scheduled' : (newCourse.isDraft ? 'draft' : 'published')
                                                            });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-checked:bg-purple-500 relative 
                                                                  after:content-[''] after:absolute after:top-0.5 after:left-[4px] 
                                                                  after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all 
                                                                  peer-checked:after:translate-x-full" />
                                                </label>
                                            </div>
                                            {newCourse.isScheduled && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                تاريخ النشر
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={newCourse.scheduledPublishDate ? newCourse.scheduledPublishDate.split('T')[0] : ''}
                                                                onChange={(e) => {
                                                                    const date = e.target.value;
                                                                    const time = newCourse.scheduledPublishDate ?
                                                                        newCourse.scheduledPublishDate.split('T')[1] || '00:00' : '00:00';
                                                                    setNewCourse({
                                                                        ...newCourse,
                                                                        scheduledPublishDate: `${date}T${time}`
                                                                    });
                                                                }}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                وقت النشر
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={newCourse.scheduledPublishDate ?
                                                                    newCourse.scheduledPublishDate.split('T')[1] || '00:00' : '00:00'}
                                                                onChange={(e) => {
                                                                    const time = e.target.value;
                                                                    const date = newCourse.scheduledPublishDate ?
                                                                        newCourse.scheduledPublishDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                                                    setNewCourse({
                                                                        ...newCourse,
                                                                        scheduledPublishDate: `${date}T${time}`
                                                                    });
                                                                }}
                                                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    {newCourse.scheduledPublishDate && (
                                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                                            <p className="text-purple-300 text-sm">
                                                                سيتم نشر الكورس في: {new Date(newCourse.scheduledPublishDate).toLocaleString('ar-EG')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Exams Section */}
                                        <div className="space-y-4 mt-6">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-lg font-arabicUI3 text-white flex items-center gap-2">
                                                    <FaQuestionCircle className="text-blue-400" />
                                                    الامتحانات المرتبطة
                                                </h4>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                                {/* Selected Exams */}
                                                {selectedExams.map((exam) => (
                                                    <div
                                                        key={exam._id}
                                                        className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-blue-500/20">
                                                                <FaQuestionCircle className="text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-white font-arabicUI3">{exam.title}</h5>
                                                                <p className="text-sm text-gray-400">
                                                                    {exam.questions?.length || 0} سؤال • {exam.duration} دقيقة
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleExamSelection(exam._id)}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Available Exams */}                                                <div className="mt-4">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="relative flex-1">
                                                            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={examSearchTerm}
                                                                onChange={(e) => setExamSearchTerm(e.target.value)}
                                                                placeholder="بحث في الامتحانات..."
                                                                className="w-full pr-10 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {availableExams.filter(exam =>
                                                            !selectedExams.some(selected => selected._id === exam._id)
                                                        ).map(exam => (
                                                            <div
                                                                key={exam._id}
                                                                onClick={() => handleExamSelection(exam._id)}
                                                                className="p-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/10 transition-colors flex justify-between items-center"
                                                            >
                                                                <div>
                                                                    <h6 className="font-medium">{exam.title}</h6>
                                                                    <p className="text-sm text-gray-400">
                                                                        {exam.questions?.length || 0} سؤال • {exam.duration} دقيقة
                                                                    </p>
                                                                </div>
                                                                <FaPlus className="text-blue-400" size={14} />
                                                            </div>
                                                        ))}                                                        <div className="flex justify-center items-center gap-2 mt-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => setExamPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                                                                disabled={examPagination.currentPage === 1}
                                                                className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
                                                            >
                                                                السابق
                                                            </button>
                                                            <span className="text-white">
                                                                صفحة {examPagination.currentPage} من {examPagination.totalPages}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExamPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                                                                disabled={examPagination.currentPage >= examPagination.totalPages}
                                                                className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-50"
                                                            >
                                                                التالي
                                                            </button>
                                                        </div>
                                                        {filteredAvailableExams.length === 0 && (
                                                            <div className="text-center py-4 text-gray-400">
                                                                لا توجد امتحانات متطابقة مع البحث
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <FormFooter />
                        </form>
                    </motion.div>
                </div>
            )}



            {showChapterModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md 
                                  border border-white/10 shadow-2xl p-6">
                        <h3 className="text-xl font-arabicUI3 text-white mb-4">إضافة فصل جديد</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newChapter.title}
                                onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="عنوان الفصل"
                                disabled={chapterLoading}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowChapterModal(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                                    disabled={chapterLoading}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleAddChapter}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl 
                                             flex items-center gap-2"
                                    disabled={chapterLoading}
                                >
                                    {chapterLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white/100 rounded-full animate-spin" />
                                            جاري الإضافة...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus size={12} />
                                            إضافة
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingChapter && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6">
                        <h3 className="text-xl font-arabicUI3 text-white mb-4">تعديل الفصل</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editingChapter.title}
                                onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="عنوان الفصل"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingChapter(null)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleEditChapterSubmit}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                                >
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingLesson && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6">
                        <h3 className="text-xl font-arabicUI3 text-white mb-4">تعديل الدرس</h3>
                        <div className="space-y-4  ">
                            <input
                                type="text"
                                value={editingLesson.title || ""}
                                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="عنوان الدرس"
                            />
                            <input
                                type="text"
                                value={editingLesson.videoUrl || ""}
                                onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="رابط الفيديو"
                            />
                            <input
                                type="text"
                                value={editingLesson.fileName || ""}
                                onChange={(e) => setEditingLesson({ ...editingLesson, fileName: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="اسم الملف (اختياري)"
                            />
                            <input
                                type="text"
                                value={editingLesson.fileUrl || ""}
                                onChange={(e) => setEditingLesson({ ...editingLesson, fileUrl: e.target.value })}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white"
                                placeholder="رابط الملف (اختياري)"
                            />
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="lessonFree"
                                    checked={editingLesson.isFree || false}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, isFree: e.target.checked })}
                                    className="w-5 h-5 rounded border border-white/10 bg-white/5 checked:bg-green-500 checked:border-green-500"
                                />
                                <label htmlFor="lessonFree" className="text-white font-arabicUI3">
                                    درس مجاني (متاح للجميع)
                                </label>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingLesson(null)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleEditLessonSubmit}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                                >
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ProcessingModal />
        </div>
    );
};

export default CourseManager;