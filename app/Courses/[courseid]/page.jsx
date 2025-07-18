'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FaLock, FaPlay } from "react-icons/fa";
import Link from 'next/link';
import { FaChalkboardTeacher } from "react-icons/fa";
import { BiSolidPencil } from "react-icons/bi";
import Head from 'next/head';
import axios from 'axios';
import Cookies from 'js-cookie';
import VideoPlayer from '../../components/player';
import { File } from 'lucide-react';

// Dynamically import Plyr with no SSR to avoid hydration issues
const Plyr = dynamic(() => import('plyr-react'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-900 flex items-center justify-center">جاري تحميل...</div>
});

const CoursePageSkeleton = dynamic(() => import('../../admin/components/CoursePageSkeleton'));

// Dynamic import for EnrollmentSection with loading fallback
const EnrollmentSection = dynamic(
    () => import('../../components/EnrollmentSection'),
    {
        loading: () => <div className="w-full md:w-96 h-48 bg-white/5 animate-pulse rounded-xl"></div>,
        ssr: false
    }
);



const CoursePage = () => {
    const params = useParams();
    const { courseid } = params;

    const [courseInfo, setCourseInfo] = useState({});
    const [courseVideoChapters, setCourseVideoChapters] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndex2, setActiveIndex2] = useState(100);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [activeChapter, setActiveChapter] = useState(0);
    const [activeLesson, setActiveLesson] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [chapterDetails, setChapterDetails] = useState([]);
    const [enrollmentMessage, setEnrollmentMessage] = useState("");

    // Fetch course data and check enrollment status
    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            try {
                // Get basic course data first
                const courseResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/course/${courseid}`);
                let courseData = courseResponse.data;

                // Set basic course info
                setCourseInfo({
                    nameofcourse: courseData.name,
                    description: courseData.description,
                    price: courseData.price,
                    isFree: courseData.isFree,
                    level: courseData.level,
                    image: courseData.imageUrl || '/pi.png', // Default to pi.png if no course image
                    nicknameforcourse: courseid
                });

                // Check if user is logged in by getting token from cookies
                const token = Cookies.get('token');
                let chaptersData = courseData.chapters || [];
                let enrollmentStatus = false;

                if (token) {
                    setUser({ token });
                    try {
                        // Check enrollment status
                        const enrollmentResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/active/${courseid}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (enrollmentResponse.data) {
                            enrollmentStatus = enrollmentResponse.data.isHeEnrolled;
                            setIsEnrolled(enrollmentStatus);
                            setEnrollmentMessage(enrollmentResponse.data.message);

                            // If enrolled, use the detailed chapter data from enrollment response
                            if (enrollmentStatus && enrollmentResponse.data.enrollment?.courseId?.chapters) {
                                chaptersData = enrollmentResponse.data.enrollment.courseId.chapters;
                            }
                        }
                    } catch (error) {
                        console.error("Error checking enrollment:", error);
                        setIsEnrolled(false);
                    }
                }

                // Process chapters
                if (chaptersData.length > 0) {
                    setChapterDetails(chaptersData);
                    const formattedChapters = chaptersData.map(chapter => {
                        // Check if the chapter has lessons
                        const hasLessons = chapter.lessons && chapter.lessons.length > 0;

                        return {
                            id: chapter._id,
                            nameofchapter: chapter.title,
                            lessons: hasLessons
                                ? chapter.lessons.map(lesson => ({
                                    id: lesson._id,
                                    name: lesson.title,
                                    // Always include fileName from API
                                    fileName: lesson.fileName,
                                    // Only include link and fileUrl if enrolled
                                    link: enrollmentStatus ? lesson.videoUrl : null,
                                    fileUrl: enrollmentStatus ? lesson.fileUrl : null,
                                    // Lock lessons for non-enrolled users
                                    locked: !enrollmentStatus
                                }))
                                : enrollmentStatus
                                    ? [] // Empty array if enrolled but no lessons
                                    : [{ id: '1', name: 'لا توجد دروس متاحة', locked: true }] // Placeholder if not enrolled and no lessons
                        };
                    });
                    setCourseVideoChapters(formattedChapters);
                }

                // Set exams
                if (courseData.exams && courseData.exams.length > 0) {
                    const examData = courseData.exams.map(exam => ({
                        id: exam._id,
                        title: exam.title
                    }));
                    setExams(examData);
                }

            } catch (error) {
                console.error("Error fetching course data:", error);
            } finally {
                setLoading(false);
                setIsLoaded(true);
            }
        };

        if (courseid) {
            fetchCourseData();
        }
    }, [courseid]);

    useEffect(() => {
        // Update the document title when courseInfo changes
        if (courseInfo.nameofcourse) {
            document.title = `${courseInfo.nameofcourse} - منصة احمد السيد  `;
        }
    }, [courseInfo]);

    useEffect(() => {
        // Set isReady after hydration
        setIsReady(true);
    }, []);

    const handlechapterClick = (index) => {
        setActiveIndex(index);
        setActiveIndex2(100);
    };

    const handlechapterClick2 = (index) => {
        setActiveIndex2(index);
        setActiveIndex(1000);
    };
    const handleLessonClick = async (chapterIndex, lessonIndex) => {
        // ✅ لو نفس الدرس اللي شغال، بلاش تبعت تاني
        if (activeChapter === chapterIndex && activeLesson === lessonIndex) return;

        setActiveChapter(chapterIndex);
        setActiveLesson(lessonIndex);
        setActiveIndex2(100); // Reset exam selection

        const selectedLesson = courseVideoChapters[chapterIndex]?.lessons[lessonIndex];
        const selectedChapter = chapterDetails[chapterIndex];

        if (!selectedLesson || !selectedChapter || !courseid || !user?.token) return;

        // Only record watch history if the lesson has a video URL
        if (selectedLesson.link) {
            try {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/watchHistory`,
                    {
                        courseId: courseid,
                        chapterId: selectedChapter._id,
                        lessonId: selectedLesson.id,
                        lessonTitle: selectedLesson.name
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        }
                    }
                );


            } catch (error) {
                console.error('❌ خطأ في تسجيل المشاهدة:', error);
            }
        }
    };


    // Show locked content if no user or not enrolled
    const isContentLocked = !user || !isEnrolled;

    // Combine all loading states
    const isPageLoading = loading || !isReady || !isLoaded;

    if (isPageLoading) {
        return (
            <>
                <Head>
                    <title>جاري التحميل... -  احمد السيد </title>
                </Head>
                <div dir='rtl' className="min-h-screen bg-gradient-to-br from-[#0A1121] via-[#0F1629] to-[#1A202C] text-white font-arabicUI3">
                    <div className="fixed inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-cyan-900/25" />
                        <div className="absolute h-full w-full bg-[url('/grid.svg')] opacity-[0.03]" />
                    </div>
                    <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Enhanced Loading Skeleton */}
                        <div className="space-y-8">
                            {/* Hero Skeleton */}
                            <div className="relative rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
                                <div className="aspect-[16/7] bg-gradient-to-r from-blue-900/50 to-purple-900/50 animate-pulse">
                                    <div className="absolute inset-0 flex items-end p-8">
                                        <div className="space-y-4 w-full max-w-4xl">
                                            <div className="w-48 h-8 bg-white/10 rounded-2xl animate-pulse"></div>
                                            <div className="w-96 h-16 bg-white/20 rounded-xl animate-pulse"></div>
                                            <div className="w-32 h-8 bg-green-500/20 rounded-2xl animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Grid Skeleton */}
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                <div className="xl:col-span-3 space-y-8">
                                    {/* Description Card Skeleton */}
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 animate-pulse">
                                        <div className="w-48 h-8 bg-white/10 rounded-lg mb-6"></div>
                                        <div className="space-y-3">
                                            <div className="w-full h-4 bg-white/10 rounded"></div>
                                            <div className="w-5/6 h-4 bg-white/10 rounded"></div>
                                            <div className="w-4/5 h-4 bg-white/10 rounded"></div>
                                        </div>
                                    </div>

                                    {/* Cards Grid Skeleton */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 animate-pulse">
                                            <div className="w-32 h-6 bg-white/10 rounded mb-6"></div>
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 bg-white/10 rounded-2xl"></div>
                                                <div className="space-y-3 flex-1">
                                                    <div className="w-32 h-5 bg-white/10 rounded"></div>
                                                    <div className="w-24 h-4 bg-blue-500/20 rounded"></div>
                                                    <div className="w-48 h-3 bg-white/10 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 animate-pulse">
                                            <div className="w-40 h-6 bg-white/10 rounded mb-6"></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="text-center p-4 bg-white/5 rounded-xl">
                                                        <div className="w-8 h-8 bg-white/20 rounded mx-auto mb-2"></div>
                                                        <div className="w-16 h-3 bg-white/10 rounded mx-auto"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Skeleton */}
                                <div className="xl:col-span-1">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 animate-pulse">
                                        <div className="p-6 border-b border-white/10">
                                            <div className="w-32 h-6 bg-white/10 rounded"></div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="w-full h-16 bg-white/5 rounded-xl"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Get current video URL
    const currentVideoUrl = courseVideoChapters.length > 0 &&
        courseVideoChapters[activeChapter]?.lessons &&
        courseVideoChapters[activeChapter]?.lessons[activeLesson]?.link;

    return (
        <>
            <Head>
                <title>{courseInfo.nameofcourse ? `${courseInfo.nameofcourse} - منصة احمد السيد    ` : 'منصة احمد السيد  '}</title>
                {/* Add Plyr CSS */}
                <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
                {/* Add custom styling for Plyr */}
                <style jsx global>{`
                    .plyr-container {
                        --plyr-color-main: #3b82f6;
                        --plyr-video-control-color: white;
                        --plyr-menu-background: rgba(30, 41, 59, 0.9);
                        --plyr-menu-color: white;
                        height: 100%;
                        width: 100%;
                    }
                    .plyr {
                        height: 100%; 
                        width: 100%;
                    }
                    
                    /* Bunny.net iframe styling */
                    #bunny-player {
                        border: none;
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100%;
                        width: 100%;
                        border-radius: inherit;
                    }
                    
                    /* Mobile fullscreen optimizations */
                    @media (max-width: 768px) {
                        .plyr--fullscreen-active,
                        .plyr--fullscreen-active #bunny-player {
                            transform: translateZ(0);
                            backface-visibility: hidden;
                            -webkit-backface-visibility: hidden;
                            will-change: transform;
                        }
                        
                        .plyr--fullscreen-active .plyr__video-wrapper {
                            transform: translateZ(0);
                            backface-visibility: hidden;
                            -webkit-backface-visibility: hidden;
                        }
                        
                        .plyr--fullscreen-active iframe {
                            transform: translateZ(0);
                            backface-visibility: hidden;
                            -webkit-backface-visibility: hidden;
                            will-change: transform;
                        }
                    }
                    
                    /* Prevent layout shifts during fullscreen transitions */
                    .plyr--fullscreen-enabled {
                        transition: none !important;
                    }
                    
                    .plyr__video-wrapper {
                        background: #000;
                    }
                `}</style>
            </Head>
            <div dir='rtl' className="min-h-screen bg-gradient-to-br from-[#0A1121] via-[#0F1629] to-[#1A202C] text-white font-arabicUI3">
                {/* Enhanced Animated Background */}


                <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                    {/* Course Header - Completely Redesigned */}
                    <div className="mb-12">
                        {/* Hero Section with Glassmorphism */}
                        <div className="relative mb-10 rounded-3xl overflow-hidden group shadow-2xl">
                            {/* Background Image Container */}
                            <div className="relative min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-gradient-to-r from-indigo-900/90 via-blue-800/80 to-purple-900/90">
                                <img
                                    src={courseInfo.image || '/pi.png'}
                                    alt={courseInfo.nameofcourse || 'Course Image'}
                                    className="w-full h-auto min-h-[300px] sm:min-h-[400px] md:min-h-[500px] object-cover opacity-40 transition-all duration-1000 group-hover:opacity-60 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.src = '/pi.png';
                                    }}
                                />

                                {/* Multiple Gradient Overlays for Depth */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Floating Elements */}
                                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 w-12 h-12 sm:w-20 sm:h-20 bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                                    <FaChalkboardTeacher className="text-blue-400 text-xl sm:text-3xl" />
                                </div>

                                {/* Content Container */}
                                <div className="absolute inset-0 flex items-end">
                                    <div className="w-full p-4 sm:p-8 md:p-12">
                                        <div className="max-w-4xl space-y-3 sm:space-y-6">
                                            {/* Course Badge */}
                                            <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                                <FaChalkboardTeacher className="text-blue-400 text-sm sm:text-lg" />
                                                <span className="text-blue-300 font-semibold text-sm sm:text-lg">كورس {courseInfo.level || "تعليمي"}</span>
                                            </div>

                                            {/* Course Title */}
                                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">
                                                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                                                    {courseInfo.nameofcourse}
                                                </span>
                                            </h1>

                                            {/* Price and Features Row */}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                                <div className="inline-flex items-center gap-2 sm:gap-3 bg-green-500/20 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-green-400/30 shadow-lg">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                    <span className="text-green-300 font-bold text-sm sm:text-xl">
                                                        {courseInfo.isFree ? 'مجاني تماماً' : `${courseInfo.price} جنيه`}
                                                    </span>
                                                </div>

                                                {isEnrolled && (
                                                    <div className="inline-flex items-center gap-2 sm:gap-3 bg-emerald-500/20 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-400/30 shadow-lg">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-emerald-300 font-semibold text-sm sm:text-base">مشترك بالفعل</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* Main Content Area */}
                            <div className="xl:col-span-3 space-y-8">
                                {/* Course Description Card */}
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        نبذة عن الكورس
                                    </h2>
                                    <pre className="text-gray-300 text-lg leading-relaxed whitespace-pre-line"
                                        style={{ fontFamily: 'inherit', background: 'none', border: 'none', padding: 0, margin: 0 }}>
                                        {courseInfo.description}
                                    </pre>
                                </div>

                                {/* Instructor & Stats Grid */}
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Enhanced Instructor Card */}
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                </svg>
                                            </div>
                                            المدرس
                                        </h3>
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <img src="/prof.jpeg" className="w-20 h-20 rounded-2xl border-4 border-blue-500/50 shadow-xl" />
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white/20 rounded-full"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-semibold text-lg mb-1">د/ احمد السيد  </h4>
                                                <p className="text-blue-400 font-medium mb-2">مدرس الاحياء</p>
                                                <p className="text-gray-400 text-sm leading-relaxed"> مدرس الاحياء والجيولوجيا بخبرة +3 سنوات</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Enrollment Card */}
                            <div className="xl:col-span-1">
                                <div className="sticky top-8">
                                    <EnrollmentSection courseInfo={courseInfo} isCourseFound={isEnrolled} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Learning Content */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Video Player & Lesson Info */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Enhanced Video Player */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                    <div className="aspect-video">
                                        {currentVideoUrl && !isContentLocked && isReady ? (
                                            <VideoPlayer videoUrl={currentVideoUrl} />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                                                <div className="text-center space-y-6 p-8">
                                                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                                        <FaLock className="text-4xl text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-2">المحتوى محمي</h3>
                                                        <p className="text-gray-400 leading-relaxed max-w-md">
                                                            {!user ? "قم بتسجيل الدخول للوصول إلى المحتوى التعليمي" :
                                                                !isEnrolled ? "اشترك في الكورس للوصول إلى جميع الدروس والمحتوى" :
                                                                    !currentVideoUrl && courseVideoChapters.length > 0 ? "لا يوجد فيديو متاح لهذا الدرس حالياً" :
                                                                        courseVideoChapters.length === 0 ? "لا توجد دروس متاحة في الوقت الحالي" :
                                                                            "اختر درساً من القائمة الجانبية لبدء المشاهدة"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Current Lesson Info Card */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FaPlay className="text-blue-400 text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-3">
                                            {courseVideoChapters.length > 0 ? courseVideoChapters[activeChapter]?.nameofchapter : "المحتوى غير متاح"}
                                        </h2>
                                        <h3 className="text-lg text-blue-300 mb-4 font-medium">
                                            {courseVideoChapters.length > 0 && courseVideoChapters[activeChapter]?.lessons.length > 0
                                                ? courseVideoChapters[activeChapter]?.lessons[activeLesson]?.name
                                                : "يرجى الاشتراك لعرض محتوى الدروس"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                الدرس {activeLesson + 1} من {courseVideoChapters[activeChapter]?.lessons.length || 0}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                الفصل {activeChapter + 1} من {courseVideoChapters.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Course Content Sidebar */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-8 space-y-6">
                                {/* Course Navigation */}
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                </svg>
                                            </div>
                                            محتويات الكورس
                                        </h3>
                                        <p className="text-gray-300 text-sm mt-2">
                                            {courseVideoChapters.length} فصل • {courseVideoChapters.reduce((total, chapter) => total + (chapter.lessons?.length || 0), 0)} درس
                                        </p>
                                    </div>

                                    {/* Content */}
                                    <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
                                        {courseVideoChapters.length > 0 ? (
                                            <div className="divide-y divide-white/5">
                                                {courseVideoChapters.map((chapter, chapterIndex) => (
                                                    <div key={chapter.id} className="p-6 hover:bg-white/5 transition-all duration-300">
                                                        {/* Chapter Header */}
                                                        <div className="mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                                                                    {chapterIndex + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-white font-semibold text-lg leading-tight">{chapter.nameofchapter}</h4>
                                                                    <p className="text-gray-400 text-sm mt-1">{chapter.lessons.length} دروس</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Lessons */}
                                                        <div className="space-y-3 mr-6">
                                                            {chapter.lessons.map((lesson, lessonIndex) => (
                                                                <div key={lesson.id} className="space-y-3">
                                                                    {/* Lesson Button */}
                                                                    <button
                                                                        onClick={() => isEnrolled && handleLessonClick(chapterIndex, lessonIndex)}
                                                                        className={`w-full p-4 flex items-center gap-4 rounded-xl transition-all duration-300 group
                                                                            ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                                                                                : 'hover:bg-white/5 border border-transparent'}`}
                                                                        disabled={!isEnrolled || lesson.locked}
                                                                    >
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                                                            ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
                                                                                : !isEnrolled || lesson.locked
                                                                                    ? 'bg-gray-700/50'
                                                                                    : 'bg-gray-600/50 group-hover:bg-blue-500/20'}`}
                                                                        >
                                                                            {!isEnrolled || lesson.locked ? (
                                                                                <FaLock className="text-gray-400 text-sm" />
                                                                            ) : (
                                                                                <FaPlay className={`text-sm transition-colors
                                                                                    ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                        ? 'text-white'
                                                                                        : 'text-gray-400 group-hover:text-blue-400'}`} />
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right flex-1">
                                                                            <p className={`text-sm font-medium transition-colors leading-relaxed
                                                                                ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                    ? 'text-blue-300'
                                                                                    : lesson.locked
                                                                                        ? 'text-gray-500'
                                                                                        : 'text-gray-300 group-hover:text-white'}`}>
                                                                                {lesson.name}
                                                                            </p>
                                                                        </div>
                                                                    </button>

                                                                    {/* File Download */}
                                                                    {lesson && lesson.fileName && (
                                                                        <div className="mr-14">
                                                                            {isEnrolled && lesson.fileUrl ? (
                                                                                <a
                                                                                    href={lesson.fileUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 transition-all duration-300 text-sm font-medium group"
                                                                                >
                                                                                    <File className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                                                    <span>{lesson.fileName}</span>
                                                                                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                                                    </svg>
                                                                                </a>
                                                                            ) : (
                                                                                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-700/30 border border-gray-600/30 text-gray-500 text-sm font-medium">
                                                                                    <FaLock className="w-4 h-4" />
                                                                                    <span>{lesson.fileName}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="w-16 h-16 mx-auto bg-gray-700/30 rounded-2xl flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                                    </svg>
                                                </div>
                                                <p className="text-gray-400 font-medium">
                                                    {isEnrolled ? "لا توجد دروس متاحة حالياً" : "محتويات الكورس محمية - يرجى الاشتراك لعرض المحتوى"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Enhanced Quiz Section */}
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 border-b border-white/10">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                                <BiSolidPencil className="text-white text-lg" />
                                            </div>
                                            الاختبارات التفاعلية
                                        </h3>
                                        <p className="text-gray-300 text-sm mt-2">{exams.length} اختبار متاح</p>
                                    </div>
                                    <div className="p-2">
                                        {exams?.length > 0 ? (
                                            exams.map((quiz, index) => (
                                                <Link
                                                    href={isEnrolled ? `/quiz/${quiz.id}` : '#'}
                                                    key={index}
                                                    className={`block m-2 p-4 rounded-xl transition-all duration-300 group
                                                        ${activeIndex2 === index ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30' : 'hover:bg-white/5'}
                                                        ${!isEnrolled ? 'pointer-events-none opacity-50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                                            ${activeIndex2 === index
                                                                ? 'bg-gradient-to-br from-orange-500 to-red-600 shadow-lg'
                                                                : isEnrolled
                                                                    ? 'bg-gray-600/50 group-hover:bg-orange-500/20'
                                                                    : 'bg-gray-700/50'}`}>
                                                            {isEnrolled ?
                                                                <BiSolidPencil className="text-white text-lg" /> :
                                                                <FaLock className="text-gray-400" />
                                                            }
                                                        </div>
                                                        <div className="text-right flex-1">
                                                            <p className="text-white font-semibold mb-1">{quiz.title}</p>
                                                            <p className="text-sm text-gray-400">اختبار تفاعلي شامل</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center">
                                                <div className="w-12 h-12 mx-auto bg-gray-700/30 rounded-xl flex items-center justify-center mb-3">
                                                    <BiSolidPencil className="text-gray-500 text-lg" />
                                                </div>
                                                <p className="text-gray-400 text-sm">لا توجد اختبارات متاحة حالياً</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced User Action Prompts */}
                {!user && !loading && (
                    <div className="fixed bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 sm:px-0 sm:w-auto">
                        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl max-w-sm sm:max-w-md w-full">
                            <div className="text-center space-y-4 sm:space-y-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">ابدأ رحلتك التعليمية</h2>
                                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed px-2">قم بتسجيل الدخول للوصول إلى المحتوى التعليمي الحصري ومتابعة تقدمك</p>
                                </div>
                                <Link href="/sign-in">
                                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-red-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base">
                                        تسجيل الدخول
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {user && !isEnrolled && !loading && !courseInfo.isFree && (
                    <div className="fixed bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 sm:px-0 sm:w-auto">
                        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl max-w-sm sm:max-w-md w-full">
                            <div className="text-center space-y-4 sm:space-y-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-orange-500/20 rounded-2xl flex items-center justify-center">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3">افتح جميع المميزات</h2>
                                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed px-2">اشترك الآن للحصول على وصول كامل لجميع الدروس والاختبارات والمواد التعليمية</p>
                                </div>
                                <Link href={`/payment/${courseInfo.nicknameforcourse || courseid}`}>
                                    <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base">
                                        اشترك الآن
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </>
    );
};

export default CoursePage;