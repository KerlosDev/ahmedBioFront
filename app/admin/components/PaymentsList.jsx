'use client'
import { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, ChevronDown, CheckCircle, XCircle, Clock, Phone, Mail, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import AddEnrollment from './AddEnrollment';

export default function PaymentsList() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddEnrollment, setShowAddEnrollment] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Define fetchEnrollments as a component function
    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Prepare query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('page', currentPage);
            queryParams.append('limit', itemsPerPage);

            if (searchQuery) {
                queryParams.append('search', searchQuery);
            }

            if (filterStatus !== 'all') {
                queryParams.append('status', filterStatus);
            }

            // Add sorting parameters
            if (sortBy) {
                queryParams.append('sortBy', sortBy);
                queryParams.append('sortOrder', sortOrder);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/active/admin/enrollments?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch enrollments');
            const data = await response.json();

            setPayments(data.enrollments);
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.totalItems);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            setError('Failed to load payments');
            toast.error('فشل في تحميل المدفوعات');
        }
    };

    // Use the defined fetchEnrollments in useEffect
    useEffect(() => {
        fetchEnrollments();
    }, [currentPage, itemsPerPage, searchQuery, filterStatus, sortBy, sortOrder]);

    // Server-side sorting is now in place
    // We will handle sorting through API parameters when we update fetchEnrollments
    const handleSortChange = (sortField) => {
        // If clicking on the same field, toggle order, otherwise set the new field with desc order
        if (sortField === sortBy) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(sortField);
            setSortOrder('desc');
        }
        setCurrentPage(1); // Reset to first page when changing sort
    };

    // Pagination logic
    // No longer calculating from client side as we get this from the API
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
    const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Handle pagination
    const goToPage = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get status badge style
    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="flex items-center gap-1 text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-sm">
                        <CheckCircle size={14} />
                        مكتمل
                    </span>
                );
            case 'pending':
                return (
                    <span className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full text-sm">
                        <Clock size={14} />
                        قيد المعالجة
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1 text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-sm">
                        <XCircle size={14} />
                        فشل
                    </span>
                );
            default:
                return null;
        }
    };

    const handlePaymentStatusChange = async (enrollmentId, newStatus) => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/active/payment/${enrollmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentStatus: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update payment status');
            }

            // Update local state and refresh data
            await fetchEnrollments();
            setCurrentPage(1); // Reset to first page after status change

            toast.success(newStatus === 'paid' ? 'تم تفعيل الكورس بنجاح' : 'تم إلغاء تفعيل الكورس بنجاح');
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error(error.message || 'فشل تحديث حالة الدفع');
        }
    };

    const handleEnrollmentAdded = (newEnrollment) => {
        setPayments(prev => [newEnrollment, ...prev]);
        setCurrentPage(1); // Go to first page when adding new enrollment
        setShowAddEnrollment(false);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl">
                            <CheckCircle className="text-lg sm:text-2xl text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white/80 font-arabicUI3 text-xs sm:text-sm">المدفوعات المكتملة</h3>
                            <p className="text-lg sm:text-2xl font-arabicUI3 text-white">
                                {payments?.filter(p => p.paymentStatus === 'paid').length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl">
                            <Clock className="text-lg sm:text-2xl text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-white/80 font-arabicUI3 text-xs sm:text-sm">قيد المعالجة</h3>
                            <p className="text-lg sm:text-2xl font-arabicUI3 text-white">
                                {payments?.filter(p => p.paymentStatus === 'pending').length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl">
                            <XCircle className="text-lg sm:text-2xl text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-white/80 font-arabicUI3 text-xs sm:text-sm">المدفوعات الفاشلة</h3>
                            <p className="text-lg sm:text-2xl font-arabicUI3 text-white">
                                {payments?.filter(p => p.paymentStatus === 'failed').length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>            {/* Payments Table */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <CreditCard className="text-white" size={20} sm-size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-arabicUI2 text-white">المدفوعات</h2>
                            <p className="text-white/60 text-xs sm:text-sm">إدارة وتتبع المدفوعات</p>
                        </div>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <button
                            onClick={() => setShowAddEnrollment(true)}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
                        >
                            <Plus size={14} sm-size={16} />
                            إضافة اشتراك
                        </button>

                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 sm:flex-none bg-white/5 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors text-sm sm:text-base"
                            >
                                <option className='text-black' value="date">تاريخ الدفع</option>
                                <option className='text-black' value="amount">المبلغ</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-2 text-white hover:bg-white/10 transition-colors"
                            >
                                <ChevronDown
                                    size={16} sm-size={20}
                                    className={`transform transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-4 border-t border-white/10 gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الإيميل أو الكورس..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/40 focus:border-blue-500 outline-none transition-colors"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                                className="appearance-none font-arabicUI3 bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                            >
                                <option className='text-black' value="all">جميع الحالات</option>
                                <option className='text-black' value="paid">مفعل</option>
                                <option className='text-black' value="pending">قيد المعالجة</option>
                                <option className='text-black' value="failed">غير مفعل</option>
                            </select>
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="py-4 px-6 text-white/60">الطالب</th>
                                <th className="py-4 px-6 text-white/60">الكورس</th>
                                <th className="py-4 px-6 text-white/60">المبلغ</th>
                                <th className="py-4 px-6 text-white/60">تاريخ الدفع</th>
                                <th className="py-4 px-6 text-white/60">الحالة</th>
                                <th className="py-4 px-6 text-white/60">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment._id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:from-blue-500/15 hover:to-purple-500/15 transition-all group">
                                                <Mail size={14} className="text-blue-400 mr-2" />
                                                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 group-hover:from-blue-300 group-hover:to-purple-300" dir="ltr">
                                                    {payment.userEmail}
                                                </span>
                                            </div>
                                            {payment.phoneNumber ? (
                                                <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all group">
                                                    <Phone size={12} className="text-emerald-400 mr-1.5" />
                                                    <span className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:from-emerald-300 group-hover:to-teal-300 font-mono tracking-wider" dir="ltr">
                                                        {payment.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                                                    <Phone size={12} className="text-white/30 mr-1.5" />
                                                    <span className="text-xs text-white/40">لا يوجد رقم هاتف</span>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg">
                                            {payment.courseName}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-white">{payment.price} جنيه</td>
                                    <td className="py-4 px-6 text-white/80">
                                        {formatDate(payment.createdAt)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <PaymentStatus status={payment.paymentStatus} />
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex gap-2">
                                            {payment.paymentStatus === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handlePaymentStatusChange(payment._id, 'paid')}
                                                        className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                                                    >
                                                        تفعيل
                                                    </button>
                                                    <button
                                                        onClick={() => handlePaymentStatusChange(payment._id, 'failed')}
                                                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                                                    >
                                                        رفض
                                                    </button>
                                                </>
                                            ) : payment.paymentStatus === 'paid' ? (
                                                <button
                                                    onClick={() => handlePaymentStatusChange(payment._id, 'failed')}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                                                >
                                                    إلغاء التفعيل
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePaymentStatusChange(payment._id, 'paid')}
                                                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                                                >
                                                    تفعيل
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {payments.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="p-4 rounded-full bg-white/5 mb-4">
                                <CreditCard className="text-white/40" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">لا توجد مدفوعات</h3>
                            <p className="text-white/60 max-w-md mb-6">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'لا توجد نتائج تطابق معايير البحث أو التصفية الحالية'
                                    : 'لا توجد مدفوعات في النظام حتى الآن. يمكنك إضافة مدفوعات جديدة بالنقر على زر إضافة اشتراك.'}
                            </p>
                            {(searchQuery || filterStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterStatus('all');
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    مسح عوامل التصفية
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-white/10">
                    <div className="text-white/60 text-sm">
                        {/* Display total items and current page info */}
                        {`عرض ${indexOfFirstItem} - ${indexOfLastItem} من ${totalItems} عنصر`}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Enrollment Modal */}
            {showAddEnrollment && (
                <AddEnrollment
                    onEnrollmentAdded={handleEnrollmentAdded}
                    onClose={() => setShowAddEnrollment(false)}
                />
            )}

            <ToastContainer position="bottom-right" dir="rtl" />
        </div>
    );
}

// Add this new component for payment status
const PaymentStatus = ({ status }) => {
    const statusConfig = {
        paid: {
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            icon: CheckCircle,
            text: 'مفعل'
        },
        pending: {
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20',
            icon: Clock,
            text: 'قيد المعالجة'
        },
        failed: {
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            icon: XCircle,
            text: 'غير مفعل'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span className={`flex items-center gap-2 px-3 py-1.5 ${config.bgColor} ${config.color} rounded-lg text-sm`}>
            <Icon size={14} />
            {config.text}
        </span>
    );
};