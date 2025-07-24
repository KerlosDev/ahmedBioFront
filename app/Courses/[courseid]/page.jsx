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
                // Get token from cookies if available
                const token = Cookies.get('token');

                // Use the new combined endpoint
                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                    setUser({ token });
                }

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/course-data/${courseid}`,
                    { headers }
                );

                const { course, isEnrolled, enrollmentMessage, enrollmentDetails } = response.data;

                // Set basic course info
                setCourseInfo({
                    nameofcourse: course.name,
                    description: course.description,
                    price: course.price,
                    isFree: course.isFree,
                    level: course.level,
                    image: course.imageUrl || '/pi.png',
                    nicknameforcourse: courseid,
                    _id: course._id,
                    isEnrolled: isEnrolled // Add enrollment status to courseInfo
                });

                // Set enrollment status
                setIsEnrolled(isEnrolled);
                setEnrollmentMessage(enrollmentMessage);

                // Update localStorage based on enrollment status
                const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
                if (isEnrolled) {
                    if (!enrolledCourses.includes(courseid)) {
                        enrolledCourses.push(courseid);
                        localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
                        window.dispatchEvent(new Event('enrollmentUpdated'));
                    }
                } else {
                    const updatedCourses = enrolledCourses.filter(id => id !== courseid);
                    localStorage.setItem('enrolledCourses', JSON.stringify(updatedCourses));
                    window.dispatchEvent(new Event('enrollmentUpdated'));
                }

                // Process chapters with the new data structure
                if (course.chapters && course.chapters.length > 0) {
                    setChapterDetails(course.chapters);

                    const formattedChapters = course.chapters.map(chapter => ({
                        id: chapter._id,
                        nameofchapter: chapter.title,
                        lessons: chapter.lessons.length > 0
                            ? chapter.lessons.map(lesson => ({
                                id: lesson._id,
                                name: lesson.title,
                                fileName: lesson.fileName,
                                link: lesson.videoUrl || null,
                                fileUrl: lesson.fileUrl || null,
                                locked: !lesson.videoUrl && !lesson.isFree, // Locked if no video URL and not free
                                isFree: lesson.isFree
                            }))
                            : [{ id: '1', name: 'لا توجد دروس متاحة', locked: true }]
                    }));

                    setCourseVideoChapters(formattedChapters);
                }

                // Set exams (only available if enrolled)
                if (course.exams && course.exams.length > 0) {
                    const examData = course.exams.map(exam => ({
                        id: exam._id,
                        title: exam.title
                    }));
                    setExams(examData);
                } else {
                    setExams([]);
                }

            } catch (error) {
                console.error("Error fetching course data:", error);
                // Handle error appropriately
                if (error.response?.status === 404) {
                    setEnrollmentMessage("الكورس غير موجود أو غير متاح");
                } else {
                    setEnrollmentMessage("حدث خطأ أثناء تحميل بيانات الكورس");
                }
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
            document.title = `${courseInfo.nameofcourse} - منصة حسام ميرة   `;
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

        const selectedLesson = courseVideoChapters[chapterIndex]?.lessons[lessonIndex];

        // Check if user can access this lesson (enrolled OR lesson is free)
        const canAccess = isEnrolled || selectedLesson?.isFree;
        if (!canAccess) return;

        setActiveChapter(chapterIndex);
        setActiveLesson(lessonIndex);
        setActiveIndex2(100); // Reset exam selection

        const selectedChapter = chapterDetails[chapterIndex];

        // Only record watch history if user is logged in and lesson has a video URL
        if (selectedLesson?.link && user?.token && courseid && selectedChapter) {
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


    // Show locked content if no user or not enrolled, unless current lesson is free
    const currentLesson = courseVideoChapters[activeChapter]?.lessons[activeLesson];
    const isCurrentLessonFree = currentLesson?.isFree === true;
    const isContentLocked = (!user || !isEnrolled) && !isCurrentLessonFree;

    // Combine all loading states
    const isPageLoading = loading || !isReady || !isLoaded;

    if (isPageLoading) {
        return (
            <>
                <Head>
                    <title>جاري التحميل... -  احمد السيد </title>
                </Head>
                <div dir='rtl' className="min-h-screen   text-white font-arabicUI3">
                    {/* Animated Background */}
                    <div className="fixed inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute h-full w-full bg-[url('/grid.svg')] opacity-[0.03]" />
                        {/* Floating particles for better loading effect */}
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping"></div>
                        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {/* Loading Status Indicator */}
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-white/80 font-medium">جاري تحميل المحتوى...</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Enhanced Course Header Skeleton */}
                            <div className="mb-8">
                                {/* Compact Hero Section Skeleton */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                    {/* Course Image Skeleton */}
                                    <div className="lg:col-span-1">
                                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-white/5 backdrop-blur-xl border border-white/10">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center animate-pulse">
                                                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                                        </svg>
                                                    </div>
                                                </div>
                                                {/* Floating icon skeleton */}
                                                <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-xl animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Course Info Skeleton */}
                                    <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                                        {/* Badge skeleton */}
                                        <div className="w-32 h-12 bg-white/10 backdrop-blur-md rounded-xl animate-pulse"></div>

                                        {/* Title skeleton */}
                                        <div className="space-y-3">
                                            <div className="w-3/4 h-12 bg-gradient-to-r from-white/10 to-blue-500/10 rounded-xl animate-pulse"></div>
                                            <div className="w-1/2 h-8 bg-white/5 rounded-lg animate-pulse"></div>
                                        </div>

                                        {/* Description skeleton */}
                                        <div className="space-y-2">
                                            <div className="w-full h-4 bg-white/5 rounded animate-pulse"></div>
                                            <div className="w-5/6 h-4 bg-white/5 rounded animate-pulse"></div>
                                            <div className="w-3/4 h-4 bg-white/5 rounded animate-pulse"></div>
                                        </div>

                                        {/* Price and features skeleton */}
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="w-32 h-12 bg-green-500/20 rounded-xl animate-pulse"></div>
                                            <div className="w-28 h-12 bg-emerald-500/20 rounded-xl animate-pulse"></div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-6 bg-white/5 rounded animate-pulse"></div>
                                                <div className="w-20 h-6 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Grid Skeleton */}
                                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                    {/* Main Content Skeleton */}
                                    <div className="xl:col-span-3 space-y-6">
                                        {/* Description Card Skeleton */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-6 h-6 bg-blue-500/20 rounded-lg animate-pulse"></div>
                                                <div className="w-32 h-6 bg-white/10 rounded animate-pulse"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="w-full h-4 bg-white/5 rounded animate-pulse"></div>
                                                <div className="w-11/12 h-4 bg-white/5 rounded animate-pulse"></div>
                                                <div className="w-4/5 h-4 bg-white/5 rounded animate-pulse"></div>
                                                <div className="w-3/4 h-4 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                        </div>

                                        {/* Instructor Card Skeleton */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-indigo-600/20 p-6 border-b border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white/10 rounded-xl animate-pulse"></div>
                                                    <div className="w-24 h-6 bg-white/10 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex items-start gap-6">
                                                    {/* Profile image skeleton */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl animate-pulse"></div>
                                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500/30 rounded-full animate-pulse"></div>
                                                    </div>
                                                    {/* Details skeleton */}
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-32 h-6 bg-white/10 rounded animate-pulse"></div>
                                                            <div className="w-5 h-5 bg-blue-500/30 rounded-full animate-pulse"></div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 bg-purple-400/30 rounded animate-pulse"></div>
                                                                <div className="w-16 h-4 bg-white/5 rounded animate-pulse"></div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="w-20 h-6 bg-purple-500/10 rounded-lg animate-pulse"></div>
                                                                <div className="w-16 h-6 bg-blue-500/10 rounded-lg animate-pulse"></div>
                                                                <div className="w-24 h-6 bg-teal-500/10 rounded-lg animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Skeleton */}
                                    <div className="xl:col-span-1">
                                        <div className="sticky top-8">
                                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                                <div className="space-y-4">
                                                    <div className="w-full h-12 bg-white/10 rounded-xl animate-pulse"></div>
                                                    <div className="w-3/4 h-8 bg-white/5 rounded-lg animate-pulse"></div>
                                                    <div className="w-full h-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Learning Content Skeleton */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* Video Player Skeleton */}
                                <div className="xl:col-span-2 space-y-6">
                                    {/* Enhanced Video Player Skeleton */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
                                        <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10">
                                            <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                                                <div className="text-center space-y-4">
                                                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-2xl flex items-center justify-center animate-pulse">
                                                        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="w-48 h-6 bg-white/10 rounded mx-auto animate-pulse"></div>
                                                        <div className="w-64 h-4 bg-white/5 rounded mx-auto animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Lesson Info Skeleton */}
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                                        <div className="flex items-start gap-6">
                                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl animate-pulse"></div>
                                            <div className="flex-1 space-y-3">
                                                <div className="w-3/4 h-8 bg-white/10 rounded animate-pulse"></div>
                                                <div className="w-1/2 h-6 bg-blue-300/20 rounded animate-pulse"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-4 bg-white/5 rounded animate-pulse"></div>
                                                    <div className="w-20 h-4 bg-white/5 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Course Content Sidebar Skeleton */}
                                <div className="xl:col-span-1">
                                    <div className="sticky top-8 space-y-6">
                                        {/* Course Navigation Skeleton */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                                                    <div className="w-32 h-6 bg-white/10 rounded animate-pulse"></div>
                                                </div>
                                                <div className="w-24 h-4 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                            {/* Content */}
                                            <div className="max-h-[600px] overflow-hidden">
                                                <div className="p-6 space-y-6">
                                                    {[...Array(3)].map((_, chapterIndex) => (
                                                        <div key={chapterIndex} className="space-y-4">
                                                            {/* Chapter header */}
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-xl animate-pulse"></div>
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="w-full h-5 bg-white/10 rounded animate-pulse"></div>
                                                                    <div className="w-16 h-3 bg-white/5 rounded animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                            {/* Lessons */}
                                                            <div className="mr-6 space-y-3">
                                                                {[...Array(3)].map((_, lessonIndex) => (
                                                                    <div key={lessonIndex} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                                                                        <div className="w-10 h-10 bg-gray-600/50 rounded-xl animate-pulse"></div>
                                                                        <div className="flex-1">
                                                                            <div className="w-full h-4 bg-white/5 rounded animate-pulse"></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quiz Section Skeleton */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                            <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 p-6 border-b border-white/10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
                                                    <div className="w-40 h-6 bg-white/10 rounded animate-pulse"></div>
                                                </div>
                                                <div className="w-20 h-4 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                            <div className="p-2">
                                                {[...Array(2)].map((_, i) => (
                                                    <div key={i} className="m-2 p-4 rounded-xl bg-white/5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-600/50 rounded-xl animate-pulse"></div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="w-full h-4 bg-white/5 rounded animate-pulse"></div>
                                                                <div className="w-2/3 h-3 bg-white/5 rounded animate-pulse"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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

                    {/* Course Header - Restructured with Smaller Image */}
                    <div className="mb-8">
                        {/* Compact Hero Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Course Image - Smaller Size */}
                            <div className="lg:col-span-1">
                                <div className="relative rounded-2xl overflow-hidden group shadow-2xl aspect-[4/3]">
                                    <img
                                        src={courseInfo.image || '/pi.png'}
                                        alt={courseInfo.nameofcourse || 'Course Image'}
                                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.src = '/pi.png';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                    {/* Floating Icon */}
                                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl">
                                        <FaChalkboardTeacher className="text-blue-400 text-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Course Info - Takes More Space */}
                            <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                                {/* Course Badge */}
                                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 shadow-lg w-fit">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <FaChalkboardTeacher className="text-blue-400 text-lg" />
                                    <span className="text-blue-300 font-semibold">كورس {courseInfo.level || "تعليمي"}</span>
                                </div>

                                {/* Course Title */}
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                                    <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                                        {courseInfo.nameofcourse}
                                    </span>
                                </h1>

                                {/* Course Description Preview */}
                                <p className="text-gray-300 text-lg leading-relaxed line-clamp-3">
                                    {courseInfo.description}
                                </p>

                                {/* Price and Features Row */}
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="inline-flex items-center gap-3 bg-green-500/20 backdrop-blur-md px-4 py-3 rounded-xl border border-green-400/30 shadow-lg">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-green-300 font-bold text-lg">
                                            {courseInfo.isFree ? 'مجاني تماماً' : `${courseInfo.price} جنيه`}
                                        </span>
                                    </div>

                                    {isEnrolled && (
                                        <div className="inline-flex items-center gap-3 bg-emerald-500/20 backdrop-blur-md px-4 py-3 rounded-xl border border-emerald-400/30 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-emerald-300 font-semibold">مشترك بالفعل</span>
                                        </div>
                                    )}

                                    {/* Course Stats */}
                                    <div className="flex items-center gap-6 text-gray-400">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                            </svg>
                                            {courseVideoChapters.length} فصل
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            {exams.length} اختبار
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            {/* Main Content Area */}
                            <div className="xl:col-span-3 space-y-6">
                                {/* Course Description Card - More Compact */}
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                        <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        تفاصيل الكورس
                                    </h2>
                                    <pre className="text-gray-300 text-base leading-relaxed whitespace-pre-line"
                                        style={{ fontFamily: 'inherit', background: 'none', border: 'none', padding: 0, margin: 0 }}>
                                        {courseInfo.description}
                                    </pre>
                                </div>

                                {/* Enhanced Professional Instructor Card */}
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                    {/* Header with Gradient Background */}
                                    <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-indigo-600/20 p-6 border-b border-white/10">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                </svg>
                                            </div>
                                            <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                                                المُحاضِر
                                            </span>
                                        </h3>
                                    </div>

                                    {/* Main Content */}
                                    <div className="p-6">
                                        <div className="flex items-start gap-6">
                                            {/* Professional Profile Image */}
                                            <div className="relative flex-shrink-0">
                                                <div className="relative">
                                                    {/* Animated Border Ring */}
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 rounded-2xl blur opacity-30 animate-pulse"></div>

                                                    {/* Profile Image */}
                                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                                                        <img
                                                            src="/prof.jpeg"
                                                            alt="د / احمد السيد "
                                                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                                        />
                                                        {/* Professional Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                    </div>

                                                    {/* Status Indicator */}
                                                    <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                                                        <div className="w-7 h-7 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white/30 rounded-full flex items-center justify-center shadow-lg">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Professional Details */}
                                            <div className="flex-1 space-y-4">
                                                {/* Name and Title */}
                                                <div className="space-y-2">
                                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                                        <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                                                            د / احمد السيد                                                         </span>
                                                        {/* Verification Badge */}
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </h4>


                                                </div>



                                                {/* Specializations */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                                        </svg>
                                                        <span className="text-gray-400 text-sm font-medium">التخصصات:</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="px-2 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-lg text-purple-300 text-xs font-medium">
                                                            احياء
                                                        </span>
                                                        <span className="px-2 py-1 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-400/20 rounded-lg text-blue-300 text-xs font-medium">
                                                            جيولوجيا
                                                        </span>
                                                        <span className="px-2 py-1 bg-gradient-to-r from-teal-500/10 to-green-500/10 border border-teal-400/20 rounded-lg text-teal-300 text-xs font-medium">
                                                            اخر
                                                        </span>
                                                    </div>
                                                </div>

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
                                                        <h3 className="text-xl font-bold text-white mb-2">
                                                            {isContentLocked ? "المحتوى محمي" : "اختر درساً للبدء"}
                                                        </h3>
                                                        <p className="text-gray-400 leading-relaxed max-w-md">
                                                            {!user ?
                                                                courseVideoChapters.some(chapter =>
                                                                    chapter.lessons?.some(lesson => lesson.isFree)
                                                                )
                                                                    ? "قم بتسجيل الدخول للوصول إلى المحتوى التعليمي، أو شاهد الدروس المجانية المتاحة"
                                                                    : "قم بتسجيل الدخول للوصول إلى المحتوى التعليمي"
                                                                :
                                                                !isEnrolled ?
                                                                    courseVideoChapters.some(chapter =>
                                                                        chapter.lessons?.some(lesson => lesson.isFree)
                                                                    )
                                                                        ? "يمكنك مشاهدة الدروس المجانية، أو اشترك في الكورس للوصول إلى جميع الدروس والمحتوى"
                                                                        : "اشترك في الكورس للوصول إلى جميع الدروس والمحتوى"
                                                                    :
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
                                        <h3 className="text-lg text-blue-300 mb-4 font-medium flex items-center gap-3">
                                            <span>
                                                {courseVideoChapters.length > 0 && courseVideoChapters[activeChapter]?.lessons.length > 0
                                                    ? courseVideoChapters[activeChapter]?.lessons[activeLesson]?.name
                                                    : "يرجى الاشتراك لعرض محتوى الدروس"}
                                            </span>
                                            {courseVideoChapters[activeChapter]?.lessons[activeLesson]?.isFree && !isEnrolled && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm font-bold">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                    </svg>
                                                    درس مجاني
                                                </span>
                                            )}
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
                                        <div className="text-gray-300 text-sm mt-2">
                                            <p>
                                                {courseVideoChapters.length} فصل • {courseVideoChapters.reduce((total, chapter) => total + (chapter.lessons?.length || 0), 0)} درس
                                            </p>
                                            {!isEnrolled && courseVideoChapters.some(chapter =>
                                                chapter.lessons?.some(lesson => lesson.isFree)
                                            ) && (
                                                    <p className="text-green-300 mt-1">
                                                        <span className="inline-flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                            </svg>
                                                            دروس مجانية متاحة
                                                        </span>
                                                    </p>
                                                )}
                                        </div>
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
                                                                        onClick={() => (isEnrolled || lesson.isFree) && handleLessonClick(chapterIndex, lessonIndex)}
                                                                        className={`w-full p-4 flex items-center gap-4 rounded-xl transition-all duration-300 group
                                                                            ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                                                                                : 'hover:bg-white/5 border border-transparent'}`}
                                                                        disabled={!isEnrolled && !lesson.isFree}
                                                                    >
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                                                            ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
                                                                                : !isEnrolled && !lesson.isFree
                                                                                    ? 'bg-gray-700/50'
                                                                                    : 'bg-gray-600/50 group-hover:bg-blue-500/20'}`}
                                                                        >
                                                                            {!isEnrolled && !lesson.isFree ? (
                                                                                <FaLock className="text-gray-400 text-sm" />
                                                                            ) : (
                                                                                <FaPlay className={`text-sm transition-colors
                                                                                    ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                        ? 'text-white'
                                                                                        : 'text-gray-400 group-hover:text-blue-400'}`} />
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right flex-1">
                                                                            <div className="flex items-center gap-2 justify-start">
                                                                                <p className={`text-sm font-medium transition-colors leading-relaxed
                                                                                    ${activeChapter === chapterIndex && activeLesson === lessonIndex
                                                                                        ? 'text-blue-300'
                                                                                        : !isEnrolled && !lesson.isFree
                                                                                            ? 'text-gray-500'
                                                                                            : 'text-gray-300 group-hover:text-white'}`}>
                                                                                    {lesson.name}
                                                                                </p>
                                                                                {lesson.isFree && !isEnrolled && (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-md text-green-300 text-xs font-bold">
                                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                        مجاني
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </button>

                                                                    {/* File Download */}
                                                                    {lesson && lesson.fileName && (
                                                                        <div className="mr-14">
                                                                            {(isEnrolled || lesson.isFree) && lesson.fileUrl ? (
                                                                                <a
                                                                                    href={lesson.fileUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 transition-all duration-300 text-sm font-medium group"
                                                                                >
                                                                                    <File className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                                                    <span>{lesson.fileName}</span>
                                                                                    {lesson.isFree && !isEnrolled && (
                                                                                        <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-md text-green-300 text-xs font-bold">
                                                                                            مجاني
                                                                                        </span>
                                                                                    )}
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
                                                    {isEnrolled
                                                        ? "لا توجد دروس متاحة حالياً"
                                                        : courseVideoChapters.some(chapter =>
                                                            chapter.lessons?.some(lesson => lesson.isFree)
                                                        )
                                                            ? "يمكنك مشاهدة الدروس المجانية - اشترك للوصول لجميع المحتويات"
                                                            : "محتويات الكورس محمية - يرجى الاشتراك لعرض المحتوى"
                                                    }
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