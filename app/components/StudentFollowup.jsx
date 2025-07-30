'use client';
import { useEffect, useRef, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { jsPDF } from 'jspdf';
import { Bar, Line } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { FaUser, FaEye, FaClock, FaList, FaTimes, FaWhatsapp, FaDownload, FaFilePdf, FaImage, FaGraduationCap, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaRegCircle, FaChartBar, FaUsers, FaPlayCircle, FaTrophy, FaSearch, FaChartLine, FaUserCheck, FaClipboardCheck, FaStar, FaChevronDown, FaChevronUp, FaBookmark, FaPlay, FaHistory, FaBookOpen, FaBookReader, FaCircle, FaFileAlt, FaCalendar, FaQuestionCircle } from "react-icons/fa";
import Cookies from 'js-cookie';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Cookies.get('token')}`
});

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const StudentFollowup = () => {
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueStudents: 0,
        mostViewedLesson: '',
        mostActiveStudent: ''
    });
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [studentList, setStudentList] = useState([]);
    const [sortBy, setSortBy] = useState('views'); // 'views', 'recent' or 'inactive'
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showLessonsModal, setShowLessonsModal] = useState(false);
    const [whatsappNumbers, setWhatsappNumbers] = useState({});
    const [studentChartData, setStudentChartData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'details'
    const [quizResults, setQuizResults] = useState([]);
    const reportRef = useRef(null);
    const [allCourses, setAllCourses] = useState([]);
    const [allChapters, setAllChapters] = useState([]);
    const [allExams, setAllExams] = useState([]);
    const [studentProgress, setStudentProgress] = useState(null);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [lessonFilter, setLessonFilter] = useState({}); // 'watched', 'unwatched' or null
    const [examFilter, setExamFilter] = useState('all'); // 'all', 'completed', 'pending'
    const [filteredExams, setFilteredExams] = useState([]);
    const [inactivityThreshold] = useState(7); // Days to consider a student inactive
    const [watchHistory, setWatchHistory] = useState([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [studentsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentRatings, setStudentRatings] = useState([]);
    const [ratingStars, setRatingStars] = useState(3);
    const [ratingStatus, setRatingStatus] = useState('good');
    const [ratingComment, setRatingComment] = useState('');
    const [ratingLoading, setRatingLoading] = useState(false);
    const [editingRatingId, setEditingRatingId] = useState(null); // null = not editing

    // ✅ Define first
    const getCurrentWeek = () => {
        const now = new Date();
        const year = now.getFullYear();
        const week = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    // ✅ Then use it here
    const [ratingWeek, setRatingWeek] = useState(getCurrentWeek());


    useEffect(() => {
        fetchLessonData();
        fetchAllCoursesAndChapters();
    }, [currentPage, sortBy, searchTerm]);

    const fetchLessonData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: studentsPerPage.toString(),
                sortBy: sortBy,
                ...(searchTerm && { search: searchTerm })
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/all-students-status?${queryParams}`, {
                headers: getAuthHeaders()
            });

            const studentsData = await response.json();

            if (studentsData.success) {
                // Update pagination info
                setTotalPages(studentsData.totalPages);
                setTotalStudents(studentsData.totalStudents);

                // Process student data with detailed enrollment information
                const whatsappObject = studentsData.data.reduce((acc, student) => {
                    acc[student.studentInfo.email] = {
                        studentId: student.studentInfo.id,
                        studentWhatsApp: student.studentInfo.phoneNumber,
                        parentWhatsApp: student.studentInfo.parentPhoneNumber,
                        name: student.studentInfo.name,
                        lastActive: student.studentInfo.lastActivity,
                        status: student.activityStatus.status,
                        totalWatchedLessons: student.activityStatus.totalWatchedLessons,
                        isEnrolled: student.enrollmentStatus.isEnrolled,
                        enrolledCourses: student.enrollmentStatus.enrolledCourses.map(course => ({
                            courseName: course.courseName,
                            enrollmentDate: course.enrollmentDate,
                            paymentStatus: course.paymentStatus,
                            chapters: course.chapters.map(chapter => ({
                                chapterTitle: chapter.chapterTitle,
                                lessons: chapter.lessons.map(lesson => ({
                                    lessonTitle: lesson.lessonTitle,
                                    isWatched: lesson.isWatched,
                                    watchCount: lesson.watchCount
                                }))
                            }))
                        })),
                        totalEnrollments: student.enrollmentStatus.totalEnrollments
                    };
                    return acc;
                }, {});
                setWhatsappNumbers(whatsappObject);

                // Process activity data for the student list with enrollment details
                const processedStudents = studentsData.data.map(student => {
                    const totalWatchedLessons = student.activityStatus.totalWatchedLessons || 0;
                    const enrolledCoursesCount = student.enrollmentStatus.enrolledCourses.length;
                    const totalLessonsAvailable = student.enrollmentStatus.enrolledCourses.reduce((total, course) => {
                        return total + course.chapters.reduce((chapterTotal, chapter) => {
                            return chapterTotal + chapter.lessons.length;
                        }, 0);
                    }, 0);

                    return {
                        email: student.studentInfo.email,
                        userName: student.studentInfo.name,
                        totalViews: totalWatchedLessons,
                        lastViewed: student.studentInfo.lastActivity,
                        status: getStudentStatus(student.activityStatus),
                        uniqueLessons: totalWatchedLessons,
                        enrolledCourses: enrolledCoursesCount,
                        totalLessonsAvailable,
                        isEnrolled: student.enrollmentStatus.isEnrolled,
                        enrollmentDetails: student.enrollmentStatus.enrolledCourses,
                        lessons: [], // Will be populated by watch history if available
                        lessonViews: {},
                        hasWatchHistory: totalWatchedLessons > 0
                    };
                });

                setStudentList(processedStudents);

                // Update stats
                const totalViews = processedStudents.reduce((sum, student) => sum + student.totalViews, 0);
                const mostActiveStudent = processedStudents.reduce((prev, current) =>
                    (current.totalViews > (prev?.totalViews || 0)) ? current : prev, null);

                setStats({
                    totalViews,
                    uniqueStudents: studentsData.totalStudents, // Use total from server
                    mostViewedLesson: 'لم يتم تحديده', // This info is not available in the new API
                    mostActiveStudent: mostActiveStudent?.email || 'لا يوجد'
                });

                // Set basic chart data
                setChartData({
                    labels: processedStudents.map(student => student.userName),
                    datasets: [{
                        label: 'عدد الدروس المشاهدة',
                        data: processedStudents.map(student => student.totalViews),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        borderRadius: 4,
                    }]
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStudentStatus = (activityStatus) => {
        const status = activityStatus.status;
        const lastActivity = activityStatus.lastActivity;
        const totalWatchedLessons = activityStatus.totalWatchedLessons;

        if (status === 'not enrolled') {
            return { status: 'never_active', label: 'لم يتم التسجيل', color: 'text-red-400' };
        }

        if (totalWatchedLessons === 0) {
            return { status: 'never_active', label: 'لم يبدأ الدراسة', color: 'text-red-400' };
        }

        if (!lastActivity) {
            return { status: 'inactive', label: 'غير نشط', color: 'text-yellow-400' };
        }

        const daysSinceActive = Math.floor((new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24));

        if (daysSinceActive > inactivityThreshold) {
            return { status: 'inactive', label: 'غير نشط', color: 'text-yellow-400' };
        }

        return { status: 'active', label: 'نشط', color: 'text-green-400' };
    };

    const fetchAllCoursesAndChapters = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/allCourses`, {
                headers: getAuthHeaders()
            });
            const coursesData = await response.json();

            if (Array.isArray(coursesData)) {
                // Process courses
                const processedCourses = coursesData.map(course => ({
                    id: course._id,
                    nameofcourse: course.name,
                    nicknameforcourse: course._id,
                    level: course.level,
                    isPublished: course.isPublished
                }));

                // Process chapters
                const processedChapters = coursesData.flatMap(course =>
                    course.chapters.map(chapter => ({
                        id: chapter._id,
                        title: chapter.title,
                        courseNickname: course._id,
                        lessons: chapter.lessons.map(lesson => ({
                            id: lesson._id,
                            title: lesson.title,
                            videoUrl: lesson.videoUrl
                        }))
                    }))
                );                // Process exams
                const processedExams = coursesData.flatMap(course => {
                    if (!course.exams || !Array.isArray(course.exams)) {
                        return [];
                    }
                    return course.exams.map(exam => ({
                        id: exam._id,
                        title: exam.title,
                        duration: exam.duration,
                        courseId: course._id,
                        courseName: course.name,
                        questions: exam.questions
                    }));
                });

                setAllCourses(processedCourses);
                setAllChapters(processedChapters);
                setAllExams(processedExams);
            }
        } catch (error) {
            console.error('Error fetching course data:', error);
        }
    };

    const exportAsImage = async () => {
        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                backgroundColor: '#0A1121',
                scale: 2
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `تقرير-${selectedStudent ? selectedStudent.email : 'الطلاب'}.png`;
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
        }
    };

    const exportAsPDF = async () => {
        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                backgroundColor: '#0A1121',
                scale: 2
            });

            // Convert canvas to PDF using jspdf
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Get canvas dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Convert canvas to base64 image
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Add image to PDF, creating new pages if necessary
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            pdf.save(`تقرير-${selectedStudent ? selectedStudent.email : 'الطلاب'}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Update getWhatsAppLink function to handle local numbers
    const getWhatsAppLink = (number) => {
        if (!number) return '#';
        // Remove any non-digit characters
        const cleanNumber = number.replace(/\D/g, '');
        // Add country code if it's a local number (assuming Egypt)
        const fullNumber = cleanNumber.startsWith('0') ?
            '20' + cleanNumber.substring(1) :
            cleanNumber;
        return `https://wa.me/${fullNumber}`;
    }; const prepareStudentChartData = () => {
        // Initialize with all enrolled courses
        const courseStats = {};

        // First, add all enrolled courses with zero stats
        if (selectedStudent && selectedStudent.enrollmentDetails) {
            selectedStudent.enrollmentDetails.forEach(course => {
                courseStats[course.courseName] = {
                    totalViews: 0,
                    uniqueLessons: new Set(),
                    enrollmentDate: course.enrollmentDate,
                    totalLessons: course.chapters.reduce((total, chapter) =>
                        total + chapter.lessons.length, 0)
                };
            });
        }

        // Then add watch history data if available
        if (watchHistory && watchHistory.length > 0) {
            watchHistory.forEach(entry => {
                const courseName = entry.courseId.name;
                if (!courseStats[courseName]) {
                    courseStats[courseName] = {
                        totalViews: 0,
                        uniqueLessons: new Set(),
                        enrollmentDate: null,
                        totalLessons: 0
                    };
                }
                courseStats[courseName].totalViews += entry.watchedCount;
                courseStats[courseName].uniqueLessons.add(entry.lessonId);
            });
        }

        // Prepare chart data
        return {
            labels: Object.keys(courseStats),
            datasets: [{
                label: 'عدد المشاهدات',
                data: Object.values(courseStats).map(stats => stats.totalViews),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }, {
                label: 'عدد الدروس المشاهدة',
                data: Object.values(courseStats).map(stats => stats.uniqueLessons.size),
                backgroundColor: 'rgba(147, 51, 234, 0.5)',
                borderColor: 'rgb(147, 51, 234)',
                borderWidth: 1
            }, {
                label: 'إجمالي الدروس المتاحة',
                data: Object.values(courseStats).map(stats => stats.totalLessons),
                backgroundColor: 'rgba(234, 179, 8, 0.5)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1,
                borderDash: [5, 5]
            }]
        };
    };

    const fetchQuizResults = async (studentId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examResult/result/${studentId}`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // If no results found, set empty array instead of throwing error
                    setQuizResults([]);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            } const data = await response.json();
            // Remove console.log in production
            // 
            // (data);

            // The results array is directly in the data object, not in a nested 'results' property
            if (data && Array.isArray(data.results)) {
                const processedResults = data.results.map(result => ({
                    nameofquiz: result.examTitle,
                    numofqus: result.totalQuestions,
                    quizGrade: result.correctAnswers,
                    submittedAt: result.examDate,
                    attemptNumber: result.attemptNumber
                }));
                setQuizResults(processedResults);
            } else {
                // If data format is unexpected, set empty array
                setQuizResults([]);
            }
        } catch (error) {
            console.error('Error fetching quiz results:', error);
            // In case of any error, set empty array
            setQuizResults([]);
        }
    };

    const getWatchedLessonsByCourse = (student, course, chapters) => {
        const courseChapters = chapters.filter(ch => ch.courseNickname === course.nicknameforcourse);
        const watchedLessons = student.lessons.filter(lesson => {
            const [chapterTitle] = lesson.split(' - ');
            return courseChapters.some(ch => ch.title === chapterTitle);
        });
        return watchedLessons;
    };

    const calculateStudentProgress = (student) => {
        // Get the enrolled courses from the student's data
        const enrolledCourses = student.enrollmentDetails || [];

        // Create a map of enrolled course names for quick lookup
        const enrolledCoursesMap = new Map(
            enrolledCourses.map(course => [course.courseName, course])
        );

        const progress = allCourses
            // First filter to only include enrolled courses
            .filter(course => enrolledCoursesMap.has(course.nameofcourse))
            .map(course => {
                const courseChapters = allChapters.filter(ch =>
                    ch.courseNickname === course.nicknameforcourse
                );

                const courseLessons = courseChapters.flatMap(ch => ch.lessons || []);
                const totalLessons = courseLessons.length;

                // Filter watch history for this course
                const courseWatchHistory = watchHistory.filter(entry =>
                    entry.courseId._id === course.id
                );

                // Get unique watched lessons
                const watchedLessonsSet = new Set(courseWatchHistory.map(entry => entry.lessonId));
                const watchedLessonsCount = watchedLessonsSet.size;

                // Calculate total views for this course
                const totalViews = courseWatchHistory.reduce((sum, entry) => sum + entry.watchedCount, 0);

                // Find unwatched lessons
                const unwatchedLessons = courseChapters.flatMap(chapter => {
                    const chapterHistory = courseWatchHistory.filter(entry =>
                        entry.chapterId._id === chapter.id
                    );

                    const watchedIds = new Set(chapterHistory.map(entry => entry.lessonId));

                    return (chapter.lessons || [])
                        .filter(lesson => !watchedIds.has(lesson.id))
                        .map(lesson => ({
                            chapterTitle: chapter.title,
                            lessonTitle: lesson.title
                        }));
                });

                return {
                    courseId: course.id,
                    courseName: course.nameofcourse,
                    courseNickname: course.nicknameforcourse,
                    totalLessons,
                    watchedLessons: courseWatchHistory,
                    watchedLessonsCount,
                    totalViews, completion: totalLessons > 0 ? (watchedLessonsCount / totalLessons) * 100 : 0,
                    examsTotal: course.exams?.length || 0,
                    // Count only exams completed for this course
                    examsCompleted: quizResults.filter(result =>
                        allExams.some(exam => exam.title === result.nameofquiz && exam.courseId === course.id)
                    ).length,
                    unwatchedLessons,
                    courseChapters
                };
            });

        // Get enrollment dates and other details from enrolledCoursesMap
        const progressWithEnrollmentDetails = progress.map(course => {
            const enrollmentDetails = enrolledCoursesMap.get(course.courseName);
            return {
                ...course,
                enrollmentDate: enrollmentDetails?.enrollmentDate,
                paymentStatus: enrollmentDetails?.paymentStatus,
                // Include chapters from enrollment details to show what's available to the student
                enrolledChapters: enrollmentDetails?.chapters || []
            };
        });

        setStudentProgress(progressWithEnrollmentDetails);
    }; const filterExams = (allExams, quizResults) => {
        // Group quiz results by exam title to get the latest attempt
        const latestAttempts = (quizResults || []).reduce((acc, result) => {
            if (!acc[result.nameofquiz] ||
                acc[result.nameofquiz].attemptNumber < result.attemptNumber) {
                acc[result.nameofquiz] = result;
            }
            return acc;
        }, {});

        const completedExamIds = new Set(Object.keys(latestAttempts));

        // If we have no exams data but have quiz results, create synthetic exam objects from quiz results
        if (allExams.length === 0 && quizResults.length > 0) {
            console.log("Creating synthetic exam objects from quiz results");
            const syntheticExams = [...new Set(quizResults.map(q => q.nameofquiz))].map(title => ({
                id: title, // Using title as ID since we don't have actual IDs
                title: title,
                courseId: "unknown", // We don't know the course ID
                courseName: "Unknown Course",
                isSynthetic: true // Mark as synthetic so we know it wasn't from API
            }));

            // For filter functionality
            switch (examFilter) {
                case 'completed':
                    return syntheticExams; // All are completed since they're from quiz results
                case 'pending':
                    return []; // None are pending since all are from quiz results
                default:
                    return syntheticExams;
            }
        }

        // Normal filtering if we have exam data
        switch (examFilter) {
            case 'completed':
                return allExams.filter(exam => completedExamIds.has(exam.title));
            case 'pending':
                return allExams.filter(exam => !completedExamIds.has(exam.title));
            default:
                return allExams;
        }
    }; useEffect(() => {
        // Always update filteredExams, even if quizResults is empty
        // This ensures pending exams will show when no quiz results exist
        if (allExams.length > 0) {
            setFilteredExams(filterExams(allExams, quizResults));
        } else {
            setFilteredExams(filterExams([], quizResults)); // Pass empty array but still call filterExams for synthetic creation
        }
    }, [examFilter, allExams, quizResults]);

    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        setActiveTab('details');
        const studentData = whatsappNumbers[student.email];
        if (studentData && studentData.studentId) {
            fetchQuizResults(studentData.studentId);
            fetchWatchHistory(studentData.studentId);
            fetchStudentRatings(studentData.studentId); // 👈 Add this line

        }
        calculateStudentProgress(student);
    };

    const fetchStudentRatings = async (studentId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-ratings/student/${studentId}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setStudentRatings(data); // ✅ Correct handling for raw array
            } else {
                console.warn("Unexpected response format", data);
            }
        } catch (error) {
            console.error("Error fetching student ratings", error);
        }
    };


    const submitRating = async () => {
        setRatingLoading(true);
        try {
            const method = editingRatingId ? 'PUT' : 'POST';
            const url = editingRatingId
                ? `${process.env.NEXT_PUBLIC_API_URL}/student-ratings/rate/${editingRatingId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/student-ratings/rate`;

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    studentId: whatsappNumbers[selectedStudent.email]?.studentId,
                    week: ratingWeek,
                    stars: ratingStars,
                    status: ratingStatus,
                    comment: ratingComment
                })
            });

            const data = await response.json();

            if (data.success) {
                await fetchStudentRatings(whatsappNumbers[selectedStudent.email]?.studentId);
                alert("تم حفظ التقييم بنجاح ✅");
                resetRatingForm(); // Clear edit mode after saving
            } else {
                alert("حدث خطأ أثناء الحفظ ❌");
            }
        } catch (error) {
            console.error("Error submitting rating", error);
            alert("فشل في إرسال التقييم");
        } finally {
            setRatingLoading(false);
        }
    };

   


    const resetRatingForm = () => {
        setRatingStars(1);
        setRatingStatus("good");
        setRatingComment('');
        setRatingWeek(getCurrentWeek());
        setEditingRatingId(null);
    };

    const fetchWatchHistory = async (studentId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchHistory/student/${studentId}`, {
                headers: getAuthHeaders()
            });

            const data = await response.json();
            if (data.success) {
                const sortedHistory = data.data.sort((a, b) =>
                    new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt)
                );
                setWatchHistory(sortedHistory);

                // Update student's total views and unique lessons in the student list
                if (selectedStudent) {
                    const totalViews = sortedHistory.reduce((sum, entry) => sum + entry.watchedCount, 0);
                    const uniqueLessons = new Set(sortedHistory.map(entry => entry.lessonId)).size;

                    setStudentList(prevList =>
                        prevList.map(student =>
                            student.email === selectedStudent.email
                                ? {
                                    ...student,
                                    totalViews,
                                    uniqueLessons,
                                    hasWatchHistory: true,
                                    lastViewed: sortedHistory[0]?.lastWatchedAt
                                }
                                : student
                        )
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching watch history:', error);
            setWatchHistory([]);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'white',
                    font: {
                        family: 'arabicUI3'
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1a1a1a',
                titleColor: 'white',
                bodyColor: 'white',
                bodyFont: {
                    family: 'arabicUI3'
                },
                titleFont: {
                    family: 'arabicUI3'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: 'white',
                    font: {
                        family: 'arabicUI3'
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y: {
                ticks: {
                    color: 'white',
                    font: {
                        family: 'arabicUI3'
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        }
    }; const ExamSection = () => {
        console.log("ExamSection rendering with:", {
            filteredExamsCount: filteredExams.length,
            quizResultsCount: quizResults.length,
            currentFilter: examFilter,
            allExamsCount: allExams.length
        });

        return (
            <div className="bg-white/10   backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">الاختبارات</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setExamFilter('all')}
                            className={`px-4 py-2 rounded-lg transition-colors ${examFilter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                        >
                            جميع الاختبارات
                        </button>
                        <button
                            onClick={() => setExamFilter('completed')}
                            className={`px-4 py-2 rounded-lg transition-colors ${examFilter === 'completed'
                                ? 'bg-green-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaCheckCircle />
                                <span>تم الإجتياز</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setExamFilter('pending')}
                            className={`px-4 py-2 rounded-lg transition-colors ${examFilter === 'pending'
                                ? 'bg-red-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaTimesCircle />
                                <span>لم يتم الإجتياز</span>
                            </div>
                        </button>
                    </div>
                </div>

                {filteredExams.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                        لا توجد اختبارات متاحة {examFilter === 'completed' ? 'تم إجتيازها' : examFilter === 'pending' ? 'قيد الانتظار' : ''}
                    </div>
                )}                {filteredExams.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                        لا توجد اختبارات متاحة {examFilter === 'completed' ? 'تم إجتيازها' : examFilter === 'pending' ? 'قيد الانتظار' : ''}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExams.map((exam, index) => {
                        // Group attempts for this exam
                        const examAttempts = quizResults
                            .filter(r => r.nameofquiz === exam.title)
                            .sort((a, b) => b.attemptNumber - a.attemptNumber);

                        const latestAttempt = examAttempts[0];
                        const isCompleted = !!latestAttempt;
                        const attemptsCount = examAttempts.length;
                        const bestScore = Math.max(...examAttempts.map(a => a.quizGrade) || [0]);

                        return (
                            <div key={index}
                                className={`p-4 rounded-xl border ${isCompleted
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-bold text-white">
                                            {exam.title}
                                        </h4>
                                        <div className="flex flex-col gap-1">
                                            {isCompleted && (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <FaClock className="text-purple-400" />
                                                        <p className="text-sm text-white/60">
                                                            آخر محاولة: {new Date(latestAttempt.submittedAt).toLocaleDateString('ar-EG')}
                                                        </p>
                                                    </div>
                                                    <div className="text-sm text-white/60">
                                                        عدد المحاولات: {attemptsCount}
                                                    </div>
                                                    <div className="text-sm text-white/60">
                                                        أفضل نتيجة: {bestScore}/{latestAttempt.numofqus}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isCompleted && (
                                        <div className="px-3 py-1 bg-green-500/20 rounded-lg text-green-400 text-sm">
                                            {latestAttempt.quizGrade} / {latestAttempt.numofqus}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const loadRatingForEdit = (rating) => {
        setRatingStars(rating.stars);
        setRatingStatus(rating.status);
        setRatingComment(rating.comment || '');
        setRatingWeek(rating.week);
        setEditingRatingId(rating._id); // We'll use this to know it's an edit
    };


    const WatchHistorySection = () => {
        // Get all enrolled courses from the selected student
        const enrolledCourses = selectedStudent?.enrollmentDetails || [];

        // Create a map of watched lessons by courseId for quick lookup
        const watchedLessonsMap = new Map();
        watchHistory.forEach(entry => {
            if (!watchedLessonsMap.has(entry.courseId.name)) {
                watchedLessonsMap.set(entry.courseId.name, new Set());
            }
            watchedLessonsMap.get(entry.courseId.name).add(entry.lessonId);
        });

        return (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">سجل المشاهدة</h3>
                        <p className="text-white/60 text-sm">تفاصيل مشاهدات الطالب للدروس المختلفة</p>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <FaHistory className="text-blue-400 text-xl" />
                    </div>
                </div>
                <div className="space-y-6">
                    {/* Summary statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/20 group hover:border-blue-400/40 transition-all duration-300">
                            <div className="flex items-start justify-between mb-2">
                                <div className="text-sm text-white/70">إجمالي المشاهدات</div>
                                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaEye className="text-blue-400 text-xl" />
                                </div>
                            </div>
                            <div className="text-3xl text-white font-bold">
                                {watchHistory.reduce((sum, entry) => sum + entry.watchedCount, 0)}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/20 group hover:border-purple-400/40 transition-all duration-300">
                            <div className="flex items-start justify-between mb-2">
                                <div className="text-sm text-white/70">الدروس المشاهدة</div>
                                <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaBookOpen className="text-purple-400" />
                                </div>
                            </div>
                            <div className="text-3xl text-white font-bold">
                                {new Set(watchHistory.map(entry => entry.lessonId)).size}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/20 group hover:border-green-400/40 transition-all duration-300">
                            <div className="text-2xl font-bold text-green-400">
                                {enrolledCourses.length}
                            </div>
                            <div className="text-sm text-white/60">الكورسات المسجل فيها</div>
                        </div>
                    </div>

                    {/* Course List with Watch Status */}
                    <div className="space-y-4">
                        {enrolledCourses.map((course, courseIndex) => {
                            const totalLessons = course.chapters.reduce((total, chapter) =>
                                total + chapter.lessons.length, 0);
                            const watchedLessons = watchedLessonsMap.get(course.courseName)?.size || 0;
                            const progress = totalLessons > 0 ? (watchedLessons / totalLessons) * 100 : 0;

                            return (
                                <div key={courseIndex} className="bg-gradient-to-r from-slate-900/30 to-slate-800/30 rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/20 rounded-xl">
                                                    <FaGraduationCap className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg text-white font-medium mb-1">{course.courseName}</h4>
                                                    <span className="text-sm text-white/60">
                                                        تاريخ التسجيل: {new Date(course.enrollmentDate).toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2
                                                ${progress >= 80
                                                    ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/20'
                                                    : progress >= 50
                                                        ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/20'
                                                        : 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/20'
                                                }`}>
                                                <FaBookReader />
                                                <span>{watchedLessons} / {totalLessons} درس</span>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${progress >= 80
                                                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                                                    : progress >= 50
                                                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                                                        : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Chapter List */}
                                    <div className="space-y-4 mt-6">
                                        {course.chapters.map((chapter, chapterIndex) => (
                                            <div key={chapterIndex} className="bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-purple-500/20 rounded-xl">
                                                        <FaBookmark className="text-purple-400" />
                                                    </div>
                                                    <h5 className="text-lg text-white font-medium">{chapter.chapterTitle}</h5>
                                                </div>
                                                <div className="space-y-3">
                                                    {chapter.lessons.map((lesson, lessonIndex) => {
                                                        const watchEntry = watchHistory.find(entry =>
                                                            entry.lessonTitle === lesson.lessonTitle && entry.courseId.name === course.courseName
                                                        );

                                                        return (
                                                            <div
                                                                key={lessonIndex}
                                                                className="flex items-center justify-between bg-gradient-to-r from-slate-900/30 to-slate-800/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-xl ${watchEntry ? 'bg-green-500/20' : 'bg-white/10'}`}>
                                                                        {lesson.isWatched || watchEntry ? (
                                                                            <FaPlay className="text-green-400" />
                                                                        ) : (
                                                                            <FaCircle className="text-white/40" />
                                                                        )}
                                                                    </div>
                                                                    <span className="text-white font-medium">{lesson.lessonTitle}</span>
                                                                </div>
                                                                {watchEntry && (
                                                                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-xl">
                                                                        <FaEye className="text-green-400" />
                                                                        <span className="text-green-400 font-medium">
                                                                            {watchEntry.watchedCount} مشاهدة
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {enrolledCourses.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                        الطالب غير مسجل في أي كورس
                    </div>
                )}
            </div>
        );
    };

    return (
        <div ref={reportRef} className="p-6 space-y-6">
            {/* Tabs Navigation */}
            <div className="flex justify-between items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 rounded-xl font-arabicUI3 transition-all duration-200 transform hover:scale-105 ${activeTab === 'overview'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FaChartBar className={activeTab === 'overview' ? 'text-white' : 'text-white/70'} />
                            <span>نظرة عامة</span>
                        </div>
                    </button>

                    {selectedStudent && (
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 rounded-xl font-arabicUI3 transition-all duration-200 transform hover:scale-105 ${activeTab === 'details'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FaUser className={activeTab === 'details' ? 'text-white' : 'text-white/70'} />
                                <span>تفاصيل الطالب</span>
                            </div>
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={exportAsPDF}
                        className="flex font-arabicUI3 items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                    >
                        <FaFilePdf />
                        تصدير PDF
                    </button>
                    <button
                        onClick={exportAsImage}
                        className="flex font-arabicUI3 items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                    >
                        <FaImage />
                        تصدير كصورة
                    </button>

                </div>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-white/80 font-arabicUI3 text-lg">إجمالي المشاهدات</h3>
                                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaEye className="text-blue-400 text-xl" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-white">{stats.totalViews}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-white/80 font-arabicUI3 text-lg">عدد الطلاب</h3>
                                <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaUsers className="text-purple-400 text-xl" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-white">{stats.uniqueStudents}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20 hover:border-green-400/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-white/80 font-arabicUI3 text-lg">الدرس الأكثر مشاهدة</h3>
                                <div className="p-2 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaPlayCircle className="text-green-400 text-xl" />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-white">{stats.mostViewedLesson}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/20 hover:border-amber-400/30 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-white/80 font-arabicUI3 text-lg">الطالب الأكثر نشاطاً</h3>
                                <div className="p-2 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaTrophy className="text-amber-400 text-xl" />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-white">{stats.mostActiveStudent}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">مشاهدات الدروس</h3>
                                <p className="text-white/60 text-sm">إحصائيات تفصيلية لمشاهدات الطلاب للدروس</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-white/70 text-sm">المشاهدات</span>
                                </div>
                                <div className="bg-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-white/70 text-sm">التفاعل</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <Bar
                                data={chartData}
                                options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        legend: {
                                            display: false
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Student List Section */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">قائمة الطلاب</h3>
                                <p className="text-white/60 text-sm">قائمة شاملة لجميع الطلاب مع تفاصيل نشاطهم</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => {
                                        setSortBy('views');
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl font-arabicUI3 transition-all duration-200 transform hover:scale-105 flex items-center gap-2
                                        ${sortBy === 'views'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                                >
                                    <FaEye className={sortBy === 'views' ? 'text-white' : 'text-white/70'} />
                                    <span>المشاهدات</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('recent');
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl font-arabicUI3 transition-all duration-200 transform hover:scale-105 flex items-center gap-2
                                        ${sortBy === 'recent'
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                                >
                                    <FaClock className={sortBy === 'recent' ? 'text-white' : 'text-white/70'} />
                                    <span>آخر نشاط</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('inactive');
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl font-arabicUI3 transition-all duration-200 transform hover:scale-105 flex items-center gap-2
                                        ${sortBy === 'inactive'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                                >
                                    <FaExclamationTriangle className={sortBy === 'inactive' ? 'text-white' : 'text-white/70'} />
                                    <span>غير نشط</span>
                                </button>
                            </div>
                        </div>

                        {/* Search and Pagination Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <FaSearch className="text-white/40" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="البحث عن طالب..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full md:w-80 px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                                    />
                                </div>
                                {loading && (
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                                        <span className="text-white/60 text-sm">جاري البحث...</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
                                <FaUsers className="text-white/40" />
                                <span className="text-white/70 text-sm">
                                    عرض {((currentPage - 1) * studentsPerPage) + 1} - {Math.min(currentPage * studentsPerPage, totalStudents)} من {totalStudents} طالب
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    <span className="ml-4 text-white/70">جاري تحميل البيانات...</span>
                                </div>
                            ) : studentList.length === 0 ? (
                                <div className="text-center py-12 text-white/60">
                                    {searchTerm ? 'لم يتم العثور على طلاب مطابقين للبحث' : 'لا توجد بيانات طلاب'}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="border-b border-white/10">
                                        <tr className="text-white/70">
                                            <th className="py-3 px-4 text-right">الطالب</th>
                                            <th className="py-3 px-4 text-center">رقم الطالب</th>
                                            <th className="py-3 px-4 text-center">رقم ولي الأمر</th>
                                            <th className="py-3 px-4 text-center">الدروس المشاهدة</th>
                                            <th className="py-3 px-4 text-center">آخر نشاط</th>
                                            <th className="py-3 px-4 text-center">تفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {studentList.map((student, index) => (
                                            <tr key={student.email} className={`text-white/90 hover:bg-white/5 ${student.status.status !== 'active' ? 'bg-red-500/5' : ''
                                                }`}>
                                                {/* Email cell */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center`}>
                                                            <FaUser className={student.status.color} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{whatsappNumbers[student.email]?.name || student.email}</div>
                                                            <div className={`text-sm ${student.status.color}`}>
                                                                {student.status.label}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Student WhatsApp cell */}
                                                <td className="py-4 px-4 text-center">
                                                    {whatsappNumbers[student.email]?.studentWhatsApp ? (
                                                        <a
                                                            href={getWhatsAppLink(whatsappNumbers[student.email].studentWhatsApp)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors group"
                                                        >
                                                            <FaWhatsapp className="text-green-400 text-xl group-hover:text-green-300" />
                                                            <span className="text-sm text-white/70">{whatsappNumbers[student.email].studentWhatsApp}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-white/30">لا يوجد</span>
                                                    )}
                                                </td>

                                                {/* Parent WhatsApp cell */}
                                                <td className="py-4 px-4 text-center">
                                                    {whatsappNumbers[student.email]?.parentWhatsApp ? (
                                                        <a
                                                            href={getWhatsAppLink(whatsappNumbers[student.email].parentWhatsApp)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors group"
                                                        >
                                                            <FaWhatsapp className="text-green-400 text-xl group-hover:text-green-300" />
                                                            <span className="text-sm text-white/70">{whatsappNumbers[student.email].parentWhatsApp}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-white/30">لا يوجد</span>
                                                    )}
                                                </td>

                                                {/* ...rest of existing cells... */}

                                                <td dir='rtl' className="py-4 px-4 text-center">
                                                    {student.uniqueLessons}       درس
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <FaClock className="text-blue-400" />
                                                        <span>{formatDate(student.lastViewed)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleStudentSelect(student)}
                                                        className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                                                    >
                                                        <FaList className="text-blue-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-white/5 disabled:opacity-50 rounded-lg transition-colors text-white"
                                >
                                    السابق
                                </button>

                                <div className="flex gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNumber;
                                        if (totalPages <= 5) {
                                            pageNumber = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNumber = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNumber = totalPages - 4 + i;
                                        } else {
                                            pageNumber = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`px-3 py-2 rounded-lg transition-colors ${currentPage === pageNumber
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                                                    }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-white/5 disabled:opacity-50 rounded-lg transition-colors text-white"
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                selectedStudent && (
                    <div className="space-y-6">
                        {/* Student Info Cards */}


                        {/* Course Progress Section */}


                        {/* Redesigned Student Profile Section */}
                        {activeTab === 'details' && selectedStudent && (
                            <div className="space-y-6">
                                {/* Student Profile Header */}
                                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center transform hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/25">
                                            <span className="text-4xl text-white font-bold">
                                                {selectedStudent.userName[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-bold text-white mb-3">{selectedStudent.userName}</h2>
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl px-4 py-2 border border-blue-500/20">
                                                    <FaEye className="text-blue-400" />
                                                    <span className="text-white font-medium">
                                                        {watchHistory.reduce((total, entry) => total + entry.watchedCount, 0)} مشاهدة
                                                    </span>
                                                </div>
                                                {watchHistory.length > 0 && (
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl px-4 py-2 border border-green-500/20">
                                                        <FaClock className="text-green-400" />
                                                        <span className="text-white font-medium">
                                                            آخر نشاط: {new Date(watchHistory[0].lastWatchedAt).toLocaleDateString('ar-EG')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Contact Information */}
                                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {whatsappNumbers[selectedStudent.email]?.studentWhatsApp && (
                                                    <a href={`https://wa.me/2${whatsappNumbers[selectedStudent.email].studentWhatsApp}`}
                                                        target="_blank"
                                                        className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-green-600/20 px-5 py-3 rounded-xl border border-green-500/20 hover:border-green-400/40 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/10 group">
                                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                                            <FaWhatsapp className="text-green-400 text-xl" />
                                                        </div>
                                                        <span className="text-white font-medium">رقم الطالب: {whatsappNumbers[selectedStudent.email].studentWhatsApp}</span>
                                                    </a>
                                                )}
                                                {whatsappNumbers[selectedStudent.email]?.parentWhatsApp && (
                                                    <a href={`https://wa.me/2${whatsappNumbers[selectedStudent.email].parentWhatsApp}`}
                                                        target="_blank"
                                                        className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-green-600/20 px-5 py-3 rounded-xl border border-green-500/20 hover:border-green-400/40 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/10 group">
                                                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                                            <FaWhatsapp className="text-green-400 text-xl" />
                                                        </div>
                                                        <span className="text-white font-medium">رقم ولي الأمر: {whatsappNumbers[selectedStudent.email].parentWhatsApp}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enrollment Status */}
                                {selectedStudent.enrollmentStatus?.enrolledCourses?.length > 0 && (
                                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-2">الكورسات المشترك بها</h3>
                                                <p className="text-white/60 text-sm">قائمة الكورسات المسجل بها الطالب وحالة كل كورس</p>
                                            </div>
                                            <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                                <FaGraduationCap className="text-blue-400 text-xl" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedStudent.enrollmentStatus.enrolledCourses.map((course, idx) => (
                                                <div key={idx} className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 group">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div>
                                                            <h4 className="text-lg font-medium text-white">{course.courseName}</h4>
                                                            {course.fromPackage && course.packageName && (
                                                                <div className="text-xs text-blue-400 mt-1">من باقة: {course.packageName}</div>
                                                            )}
                                                        </div>
                                                        <span className={`px-4 py-1.5 rounded-xl text-sm font-medium ${course.paymentStatus === 'paid'
                                                            ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/20'
                                                            : 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/20'
                                                            }`}>
                                                            {course.paymentStatus === 'paid' ? 'مفعل' : 'قيد الانتظار'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-white/60 text-sm">
                                                        <FaCalendar className="text-blue-400" />
                                                        تاريخ التسجيل: {new Date(course.enrollmentDate).toLocaleDateString('ar-EG')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activity Status */}
                                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">حالة النشاط</h3>
                                            <p className="text-white/60 text-sm">إحصائيات وتفاصيل نشاط الطالب</p>
                                        </div>
                                        <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <FaChartLine className="text-purple-400 text-xl" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/20 group hover:border-blue-400/40 transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-sm text-white/70">إجمالي المشاهدات</div>
                                                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                                    <FaEye className="text-blue-400" />
                                                </div>
                                            </div>
                                            <div className="text-3xl text-white font-bold">
                                                {watchHistory.reduce((total, entry) => total + entry.watchedCount, 0)}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/20 group hover:border-purple-400/40 transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-sm text-white/70">الحالة</div>
                                                <div className="p-2 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                                    <FaUserCheck className="text-purple-400" />
                                                </div>
                                            </div>
                                            <div className={`text-3xl font-bold ${selectedStudent.status?.color}`}>
                                                {selectedStudent.status?.label}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/20 group hover:border-green-400/40 transition-all duration-300">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="text-sm text-white/70">آخر نشاط</div>
                                                <div className="p-2 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                                    <FaClock className="text-green-400" />
                                                </div>
                                            </div>
                                            <div className="text-2xl text-white font-bold">
                                                {watchHistory.length > 0
                                                    ? new Date(watchHistory[0].lastWatchedAt).toLocaleDateString('ar-EG')
                                                    : 'لم يبدأ بعد'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Watch History Section */}

                                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">تقييم الطالب الأسبوعي</h3>
                                            <p className="text-white/60 text-sm">قم بتقييم أداء الطالب هذا الأسبوع</p>
                                        </div>
                                        <div className="p-2 bg-yellow-500/20 rounded-xl">
                                            <FaStar className="text-yellow-400 text-xl" />
                                        </div>
                                    </div>

                                    {/* Rating Form */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <label className="text-white/70 block mb-1">التقييم (نجوم)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={5}
                                                value={ratingStars}
                                                onChange={(e) => setRatingStars(Number(e.target.value))}
                                                className="w-full p-3 rounded-xl bg-white/5 text-white focus:outline-none border border-white/10"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white/70 block mb-1">الحالة</label>
                                            <select
                                                value={ratingStatus}
                                                onChange={(e) => setRatingStatus(e.target.value)}
                                                className="w-full font-arabicUI3 p-3 rounded-xl bg-white/5 text-white focus:outline-none border border-white/10"
                                            >
                                                <option className='text-black' value="good">جيد</option>
                                                <option className='text-black' value="bad">ضعيف</option>
                                                <option className='text-black' value="average">متوسط</option>
                                                <option className='text-black' value="excellent">ممتاز</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-white/70 block mb-1">ملاحظة</label>
                                            <input
                                                type="text"
                                                value={ratingComment}
                                                onChange={(e) => setRatingComment(e.target.value)}
                                                className="w-full p-3 rounded-xl bg-white/5 text-white focus:outline-none border border-white/10"
                                            />
                                        </div>

                                    </div>
                                    <button
                                        onClick={submitRating}
                                        disabled={ratingLoading}
                                        className="px-6 py-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold transition"
                                    >
                                        {ratingLoading ? 'جارٍ الإرسال...' : 'حفظ التقييم'}
                                    </button>

                                    {editingRatingId && (
                                        <button
                                            onClick={resetRatingForm}
                                            className="ml-4 px-6 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold transition"
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}


                                    {/* Past Ratings */}
                                    <div className="mt-8">
                                        <h4 className="text-white text-lg font-semibold mb-4">التقييمات السابقة</h4>
                                        {studentRatings.map((rating, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5 text-white">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-bold text-yellow-400">
                                                        {rating.stars} ⭐ - {
                                                            rating.status === 'good' ? 'جيد' :
                                                                rating.status === 'bad' ? 'ضعيف' :
                                                                    rating.status === 'average' ? 'متوسط' :
                                                                        rating.status === 'excellent' ? 'ممتاز' : rating.status
                                                        }
                                                    </div>
                                                    <span className="text-sm text-white/60">{rating.week}</span>
                                                </div>
                                                {rating.comment && (
                                                    <div className="mt-1 text-sm text-white/80">{rating.comment}</div>
                                                )}
                                                <button
                                                    onClick={() => loadRatingForEdit(rating)}
                                                    className="mt-2 text-sm text-blue-400 underline hover:text-blue-300"
                                                >
                                                    تعديل
                                                </button>
                                            </div>
                                        ))}

                                    </div>
                                </div>


                                <WatchHistorySection />


                            </div>
                        )}                        {/* Course Progress Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Group watchHistory by courseId */}
                            {Object.values(watchHistory.reduce((acc, entry) => {
                                const courseId = entry.courseId._id;
                                if (!acc[courseId]) {
                                    acc[courseId] = {
                                        courseId: courseId,
                                        courseName: entry.courseId.name,
                                        chapters: {},
                                        totalViews: 0,
                                        uniqueLessons: new Set(),
                                        watchedLessons: []
                                    };
                                }

                                // Add lesson to unique lessons set
                                acc[courseId].uniqueLessons.add(entry.lessonId);

                                // Add to total views
                                acc[courseId].totalViews += entry.watchedCount;

                                // Add to watched lessons array
                                acc[courseId].watchedLessons.push({
                                    lessonId: entry.lessonId,
                                    lessonTitle: entry.lessonTitle,
                                    chapterTitle: entry.chapterId.title,
                                    watchedCount: entry.watchedCount,
                                    lastWatchedAt: entry.lastWatchedAt
                                });

                                // Group by chapters
                                if (!acc[courseId].chapters[entry.chapterId._id]) {
                                    acc[courseId].chapters[entry.chapterId._id] = {
                                        title: entry.chapterId.title,
                                        lessons: []
                                    };
                                }
                                acc[courseId].chapters[entry.chapterId._id].lessons.push({
                                    lessonId: entry.lessonId,
                                    lessonTitle: entry.lessonTitle,
                                    watchedCount: entry.watchedCount,
                                    lastWatchedAt: entry.lastWatchedAt
                                });

                                return acc;
                            }, {})).map((course, index) => (
                                <div key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl group">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">{course.courseName}</h3>
                                            <p className="text-white/60 text-sm">سجل مشاهدة الطالب في هذا الكورس</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                                <FaPlayCircle className="text-blue-400 text-xl" />
                                            </div>
                                            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                                {course.totalViews} مشاهدة
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <div className="text-sm text-white/70 mb-1">الدروس المشاهدة</div>
                                                <div className="text-xl text-white font-bold">
                                                    {course.uniqueLessons.size} درس
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <div className="text-sm text-white/70 mb-1">الفصول</div>
                                                <div className="text-xl text-white font-bold">
                                                    {Object.keys(course.chapters).length} فصل
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lesson List Controls */}
                                        <div className="flex justify-between items-center">
                                            <button
                                                onClick={() => setExpandedCourses(prev => ({
                                                    ...prev,
                                                    [course.courseId]: !prev[course.courseId]
                                                }))}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-all duration-200 group"
                                            >
                                                {expandedCourses[course.courseId] ? (
                                                    <FaChevronUp className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <FaChevronDown className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                )}
                                                <span className="text-white font-medium">
                                                    {expandedCourses[course.courseId] ? 'إخفاء الدروس' : 'عرض الدروس'}
                                                </span>
                                            </button>
                                            {expandedCourses[course.courseId] && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setLessonFilter(prev => ({
                                                            ...prev,
                                                            [course.courseId]: prev[course.courseId] === 'watched' ? null : 'watched'
                                                        }))}
                                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${lessonFilter[course.courseId] === 'watched'
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-white/5 text-white/70'
                                                            }`}
                                                    >
                                                        تم المشاهدة
                                                    </button>
                                                    <button
                                                        onClick={() => setLessonFilter(prev => ({
                                                            ...prev,
                                                            [course.courseId]: prev[course.courseId] === 'unwatched' ? null : 'unwatched'
                                                        }))}
                                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${lessonFilter[course.courseId] === 'unwatched'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-white/5 text-white/70'
                                                            }`}
                                                    >
                                                        لم تتم المشاهدة
                                                    </button>
                                                </div>
                                            )}
                                        </div>                                        {/* Chapters and Lessons List */}
                                        {expandedCourses[course.courseId] && (
                                            <div className="mt-4 space-y-4">
                                                {Object.values(course.chapters).map((chapter, chapterIdx) => (
                                                    <div key={chapterIdx} className="space-y-3 bg-gradient-to-r from-slate-900/30 to-slate-800/30 rounded-xl p-6 border border-white/5">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-2 bg-purple-500/20 rounded-xl">
                                                                <FaBookmark className="text-purple-400" />
                                                            </div>
                                                            <h4 className="text-lg text-white font-medium">{chapter.title}</h4>
                                                        </div>
                                                        {chapter.lessons.map((lesson, lessonIdx) => (
                                                            <div key={lessonIdx}
                                                                className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/10 p-4 rounded-xl border border-green-500/10 hover:border-green-500/20 transition-all duration-300"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-green-500/20 rounded-xl">
                                                                        <FaPlay className="text-green-400" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-medium">{lesson.lessonTitle}</span>
                                                                        <span className="text-sm text-white/50 flex items-center gap-2">
                                                                            <FaClock className="text-blue-400" />
                                                                            آخر مشاهدة: {new Date(lesson.lastWatchedAt).toLocaleDateString('ar-EG')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-xl">
                                                                    <FaEye className="text-green-400" />
                                                                    <span className="text-green-400 font-medium">
                                                                        {lesson.watchedCount} مشاهدة
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Exam Section */}
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">الاختبارات والتقييمات</h3>
                                    <p className="text-white/60 text-sm">نتائج الطالب في الاختبارات والتقييمات المختلفة</p>
                                </div>
                                <div className="p-2 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaClipboardCheck className="text-amber-400 text-xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-xl p-6 border border-amber-500/20 group hover:border-amber-400/40 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-sm text-white/70">معدل النجاح</div>
                                        <div className="p-2 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <FaTrophy className="text-amber-400" />
                                        </div>
                                    </div>
                                    <div className="text-3xl text-white font-bold">
                                        {quizResults.length > 0
                                            ? Math.round((quizResults.reduce((acc, quiz) => acc + (quiz.quizGrade / quiz.numofqus * 100), 0) / quizResults.length)) + '%'
                                            : '0%'}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/20 group hover:border-green-400/40 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-sm text-white/70">الاختبارات المكتملة</div>
                                        <div className="p-2 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <FaCheckCircle className="text-green-400" />
                                        </div>
                                    </div>
                                    <div className="text-3xl text-white font-bold">{quizResults.length}</div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/20 group hover:border-blue-400/40 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-sm text-white/70">أعلى درجة</div>
                                        <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                            <FaStar className="text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="text-3xl text-white font-bold">
                                        {quizResults.length > 0
                                            ? Math.round(Math.max(...quizResults.map(quiz => (quiz.quizGrade / quiz.numofqus * 100)))) + '%'
                                            : '0%'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {quizResults.length === 0 ? (
                                    <div className="text-center py-8 text-white/60">
                                        لم يقم الطالب بإجراء أي اختبارات بعد
                                    </div>
                                ) : (
                                    quizResults.map((quiz, index) => {
                                        const score = Math.round((quiz.quizGrade / quiz.numofqus) * 100);
                                        return (
                                            <div key={index} className="bg-gradient-to-r from-slate-900/30 to-slate-800/30 rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-purple-500/20 rounded-xl">
                                                            <FaFileAlt className="text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-medium text-white mb-1">{quiz.nameofquiz}</h4>
                                                            <p className="text-sm text-white/60">محاولة {quiz.attemptNumber}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2
                                                        ${score >= 80
                                                            ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/20'
                                                            : score >= 60
                                                                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/20'
                                                                : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/20'
                                                        }`}>
                                                        {score >= 80 ? <FaCheckCircle /> : score >= 60 ? <FaExclamationCircle /> : <FaTimesCircle />}
                                                        <span>{quiz.quizGrade}/{quiz.numofqus} ({score}%)</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-white/60">
                                                    <div className="flex items-center gap-2">
                                                        <FaCalendar className="text-blue-400" />
                                                        <span>{new Date(quiz.submittedAt).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FaQuestionCircle className="text-purple-400" />
                                                        <span>{quiz.numofqus} سؤال</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Chart */}
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">نشاط المشاهدة</h3>
                                    <p className="text-white/60 text-sm">رسم بياني يوضح نشاط مشاهدة الطالب للدروس</p>
                                </div>
                                <div className="p-2 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                                    <FaChartBar className="text-blue-400 text-xl" />
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-slate-900/30 to-slate-800/30 rounded-xl p-6 border border-white/5">
                                <div className="h-[400px]">
                                    <Bar
                                        data={prepareStudentChartData(selectedStudent)}
                                        options={{
                                            ...chartOptions,
                                            indexAxis: 'y',
                                            maintainAspectRatio: false,
                                            plugins: {
                                                ...chartOptions.plugins,
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                ...chartOptions.scales,
                                                x: {
                                                    ...chartOptions.scales?.x,
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.05)'
                                                    }
                                                },
                                                y: {
                                                    ...chartOptions.scales?.y,
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.05)'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default StudentFollowup;
