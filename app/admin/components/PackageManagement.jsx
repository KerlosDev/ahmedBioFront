'use client'

import { useState, useEffect } from 'react';
import {
    Package, Edit, Trash2, Plus,
    Search, X, Check, Image as ImageIcon,
    Book, Tag, FileText, Users, ArrowRight,
    ArrowLeft, PlusSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function PackageManagement() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        price: '',
        courses: [],
        level: 'الصف الأول الثانوي'
    });

    useEffect(() => {
        fetchPackages();
        fetchCourses();
    }, [currentPage]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token') || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }

            const data = await response.json();
            setPackages(data.packages || []);

            // TODO: Add pagination if needed
            setTotalPages(Math.ceil((data.packages?.length || 0) / 10));
        } catch (error) {
            console.error('Error fetching packages:', error);
            toast.error('فشل في جلب الحزم التعليمية');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = Cookies.get('token') || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }

            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('فشل في جلب الكورسات');
        }
    };

    const handleAddPackage = async () => {
        try {
            // Detailed validation with specific feedback
            if (!formData.name) {
                toast.error('يرجى إدخال اسم الحزمة');
                return;
            }
            if (!formData.description) {
                toast.error('يرجى إدخال وصف الحزمة');
                return;
            }
            if (!formData.imageUrl) {
                toast.error('يرجى إدخال رابط صورة الحزمة');
                return;
            }
            if (!formData.price) {
                toast.error('يرجى إدخال سعر الحزمة');
                return;
            }
            if (formData.courses.length < 2) {
                toast.error('يجب اختيار كورسين على الأقل للحزمة');
                return;
            }

            // Calculate original price (sum of selected course prices)
            const originalPrice = calculateOriginalPrice();
            // Calculate discount percentage
            const discountPercentage = calculateDiscountPercentage();

            console.log('Adding package with data:', {
                ...formData,
                price: Number(formData.price),
                originalPrice,
                discountPercentage
            });

            // Show loading toast
            const loadingToast = toast.loading('جاري إضافة الحزمة...');

            const token = Cookies.get('token') || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    originalPrice,
                    discountPercentage
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server error:', errorData);
                toast.dismiss(loadingToast);
                toast.error(errorData.message || 'فشل في إضافة الحزمة، يرجى المحاولة مرة أخرى');
                return;
            }

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            await fetchPackages();
            toast.success('تم إضافة الحزمة بنجاح');
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error adding package:', error);
            // Make sure to dismiss any pending loading toasts
            toast.dismiss();
            toast.error(`فشل في إضافة الحزمة: ${error.message || 'خطأ غير معروف'}`);
        }
    };

    const handleEditPackage = async () => {
        try {
            // Detailed validation with specific feedback
            if (!formData.name) {
                toast.error('يرجى إدخال اسم الحزمة');
                return;
            }
            if (!formData.description) {
                toast.error('يرجى إدخال وصف الحزمة');
                return;
            }
            if (!formData.imageUrl) {
                toast.error('يرجى إدخال رابط صورة الحزمة');
                return;
            }
            if (!formData.price) {
                toast.error('يرجى إدخال سعر الحزمة');
                return;
            }
            if (formData.courses.length < 2) {
                toast.error('يجب اختيار كورسين على الأقل للحزمة');
                return;
            }

            // Calculate original price (sum of selected course prices)
            const originalPrice = calculateOriginalPrice();
            // Calculate discount percentage
            const discountPercentage = calculateDiscountPercentage();

            console.log('Updating package with data:', {
                ...formData,
                price: Number(formData.price),
                originalPrice,
                discountPercentage
            });

            // Show loading toast
            const loadingToast = toast.loading('جاري تحديث الحزمة...');

            const token = Cookies.get('token') || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages/${selectedPackage._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    originalPrice,
                    discountPercentage
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server error:', errorData);
                toast.dismiss(loadingToast);
                toast.error(errorData.message || 'فشل في تحديث الحزمة، يرجى المحاولة مرة أخرى');
                return;
            }

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            await fetchPackages();
            toast.success('تم تحديث الحزمة بنجاح');
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating package:', error);
            // Make sure to dismiss any pending loading toasts
            toast.dismiss();
            toast.error(`فشل في تحديث الحزمة: ${error.message || 'خطأ غير معروف'}`);
        }
    };

    const handleDeletePackage = async () => {
        try {
            const token = Cookies.get('token') || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages/${selectedPackage._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete package');
            }

            await fetchPackages();
            toast.success('تم حذف الحزمة بنجاح');
            setShowDeleteModal(false);
        } catch (error) {
            console.error('Error deleting package:', error);
            toast.error('فشل في حذف الحزمة');
        }
    };

    const openEditModal = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({
            name: pkg.name,
            description: pkg.description,
            imageUrl: pkg.imageUrl,
            price: pkg.price.toString(),
            courses: pkg.courses.map(course => course._id || course),
            level: pkg.level
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (pkg) => {
        setSelectedPackage(pkg);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            imageUrl: '',
            price: '',
            courses: [],
            level: 'الصف الأول الثانوي'
        });
    };

    const toggleCourseSelection = (courseId) => {
        console.log(`Toggling course selection: ${courseId}`);
        setFormData(prev => {
            if (prev.courses.includes(courseId)) {
                console.log(`Removing course: ${courseId}`);
                return {
                    ...prev,
                    courses: prev.courses.filter(id => id !== courseId)
                };
            } else {
                console.log(`Adding course: ${courseId}`);
                return {
                    ...prev,
                    courses: [...prev.courses, courseId]
                };
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name} = ${value}`);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedPackages = filteredPackages.slice((currentPage - 1) * 10, currentPage * 10);

    // Calculate original price from selected courses
    const calculateOriginalPrice = () => {
        return courses
            .filter(course => formData.courses.includes(course._id))
            .reduce((sum, course) => sum + course.price, 0);
    };

    // Calculate discount percentage
    const calculateDiscountPercentage = () => {
        const originalPrice = calculateOriginalPrice();
        if (!originalPrice || !formData.price) return 0;
        return Math.round(((originalPrice - Number(formData.price)) / originalPrice) * 100);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen font-arabicUI3 p-6 text-white" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold mb-2">إدارة الحزم التعليمية</h1>
                    <p className="text-white/70">إنشاء وتعديل الحزم التي تجمع عدة كورسات معاً بسعر مخفض</p>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="البحث عن حزمة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-xl px-10 py-2 text-white placeholder-white/50 w-full md:w-64"
                        />
                        <Search className="absolute right-3 top-2.5 text-white/50" size={18} />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute left-3 top-2.5 text-white/50 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 hover:shadow-lg"
                    >
                        <Plus size={18} />
                        <span>إضافة حزمة جديدة</span>
                    </button>
                </div>

                {/* Packages List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white/10 rounded-xl p-6 animate-pulse">
                                <div className="w-20 h-20 bg-white/20 rounded-lg mb-4"></div>
                                <div className="h-6 bg-white/20 rounded w-3/4 mb-3"></div>
                                <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
                                <div className="h-4 bg-white/20 rounded w-5/6 mb-4"></div>
                                <div className="flex gap-3 mt-4">
                                    <div className="h-8 w-24 bg-white/20 rounded-lg"></div>
                                    <div className="h-8 w-24 bg-white/20 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginatedPackages.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedPackages.map(pkg => (
                                <div key={pkg._id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:shadow-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Package size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg text-white">{pkg.name}</h3>
                                                <p className="text-white/70 text-sm">{pkg.level}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(pkg)}
                                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(pkg)}
                                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-white/80 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {pkg.courses?.slice(0, 3).map(course => (
                                            <span key={(course._id || course)} className="px-2 py-1 bg-white/10 rounded-lg text-xs">
                                                {typeof course === 'object' ? course.name : 'كورس'}
                                            </span>
                                        ))}
                                        {pkg.courses?.length > 3 && (
                                            <span className="px-2 py-1 bg-white/10 rounded-lg text-xs">
                                                +{pkg.courses.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-auto">
                                        <div>
                                            <div className="text-emerald-400 font-bold text-xl">{pkg.price} جنيه</div>
                                            <div className="text-white/50 text-xs flex items-center gap-1">
                                                <span className="line-through">{pkg.originalPrice} جنيه</span>
                                                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded">خصم {pkg.discountPercentage}%</span>
                                            </div>
                                        </div>
                                        <div className="text-white/50 text-xs">
                                            {formatDate(pkg.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg ${currentPage === 1 ? 'bg-white/10 text-white/40' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                >
                                    <ArrowRight size={18} />
                                </button>

                                <div className="px-4 py-2 bg-white/10 rounded-lg">
                                    {currentPage} / {totalPages}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg ${currentPage === totalPages ? 'bg-white/10 text-white/40' : 'bg-white/20 text-white hover:bg-white/30'}`}
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white/5 rounded-xl p-8 text-center">
                        <Package size={48} className="mx-auto mb-4 text-white/30" />
                        <h3 className="text-xl font-semibold mb-2">لا توجد حزم تعليمية</h3>
                        <p className="text-white/70 mb-6">لم يتم إضافة أي حزم تعليمية بعد. يمكنك إضافة حزمة جديدة الآن.</p>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowAddModal(true);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-all duration-300 hover:shadow-lg"
                        >
                            <Plus size={18} />
                            <span>إضافة حزمة جديدة</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Add Package Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 pt-24 p-4">
                    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">إضافة حزمة تعليمية جديدة</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-white/80">اسم الحزمة</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="اسم الحزمة التعليمية"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-white/80">وصف الحزمة</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="وصف مختصر للحزمة التعليمية"
                                        rows={3}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-white/80">رابط الصورة</label>
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleInputChange}
                                        placeholder="رابط صورة الحزمة"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-white/80">السعر</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="سعر الحزمة"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-white/80">المرحلة</label>
                                        <select
                                            name="level"
                                            value={formData.level}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                                        >
                                            <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                                            <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                                            <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                                            <option value="متعدد المراحل">متعدد المراحل</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Summary */}
                                {formData.courses.length > 0 && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <h3 className="text-lg font-semibold mb-2">ملخص الحزمة</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Book size={16} className="text-blue-400" />
                                                <span>عدد الكورسات: {formData.courses.length}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-emerald-400" />
                                                <span>السعر الأصلي: {calculateOriginalPrice()} جنيه</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-red-400" />
                                                <span>سعر الحزمة: {formData.price || 0} جنيه</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-yellow-400" />
                                                <span>نسبة الخصم: {calculateDiscountPercentage()}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 h-[500px] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">اختر الكورسات المضمنة في الحزمة</h3>
                                    <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-sm">
                                        {formData.courses.length} محدد
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {courses.map(course => (
                                        <div
                                            key={course._id}
                                            onClick={() => toggleCourseSelection(course._id)}
                                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${formData.courses.includes(course._id)
                                                ? 'bg-blue-500/20 border border-blue-500/40'
                                                : 'bg-white/10 border border-white/10 hover:bg-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Book size={18} className="text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">{course.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-white/70">
                                                        <span>{course.level}</span>
                                                        <span className="text-emerald-400 font-semibold">{course.price} جنيه</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${formData.courses.includes(course._id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white/20'
                                                }`}>
                                                {formData.courses.includes(course._id) && <Check size={14} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log('Add Package button clicked');
                                    handleAddPackage();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all"
                            >
                                إضافة الحزمة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Package Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">تعديل الحزمة التعليمية</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-white/80">اسم الحزمة</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="اسم الحزمة التعليمية"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-white/80">وصف الحزمة</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="وصف مختصر للحزمة التعليمية"
                                        rows={3}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-white/80">رابط الصورة</label>
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleInputChange}
                                        placeholder="رابط صورة الحزمة"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-2 text-white/80">السعر</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            placeholder="سعر الحزمة"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-white/80">المرحلة</label>
                                        <select
                                            name="level"
                                            value={formData.level}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                                        >
                                            <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                                            <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                                            <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                                            <option value="متعدد المراحل">متعدد المراحل</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Summary */}
                                {formData.courses.length > 0 && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <h3 className="text-lg font-semibold mb-2">ملخص الحزمة</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Book size={16} className="text-blue-400" />
                                                <span>عدد الكورسات: {formData.courses.length}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-emerald-400" />
                                                <span>السعر الأصلي: {calculateOriginalPrice()} جنيه</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-red-400" />
                                                <span>سعر الحزمة: {formData.price || 0} جنيه</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={16} className="text-yellow-400" />
                                                <span>نسبة الخصم: {calculateDiscountPercentage()}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 h-[500px] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">اختر الكورسات المضمنة في الحزمة</h3>
                                    <div className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-sm">
                                        {formData.courses.length} محدد
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {courses.map(course => (
                                        <div
                                            key={course._id}
                                            onClick={() => toggleCourseSelection(course._id)}
                                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between ${formData.courses.includes(course._id)
                                                ? 'bg-blue-500/20 border border-blue-500/40'
                                                : 'bg-white/10 border border-white/10 hover:bg-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Book size={18} className="text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">{course.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-white/70">
                                                        <span>{course.level}</span>
                                                        <span className="text-emerald-400 font-semibold">{course.price} جنيه</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${formData.courses.includes(course._id)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white/20'
                                                }`}>
                                                {formData.courses.includes(course._id) && <Check size={14} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log('Edit Package button clicked');
                                    handleEditPackage();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all"
                            >
                                تحديث الحزمة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-xl p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">تأكيد حذف الحزمة</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-white/80 mb-4">هل أنت متأكد من حذف الحزمة التعليمية "{selectedPackage?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.</p>

                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <Package size={20} className="text-red-400" />
                                    <h3 className="font-semibold text-white">{selectedPackage?.name}</h3>
                                </div>
                                <p className="text-white/70 text-sm">تحتوي على {selectedPackage?.courses?.length} كورس بسعر {selectedPackage?.price} جنيه</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleDeletePackage}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all"
                            >
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
