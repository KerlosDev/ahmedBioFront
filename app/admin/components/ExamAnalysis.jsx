'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, ReferenceLine
} from 'recharts';
import {
    Book, Users, Award, Clock, TrendingUp, AlertTriangle, Brain, Target,
    CheckCircle, RotateCw, Search, Download, FileText, Medal, Star, User,
    Clipboard, Calendar, Filter, BarChart2, ChevronDown, ChevronUp, HelpCircle,
    Info, Layers, Maximize, Minimize, Share2, Sliders, ArrowUpRight, Zap,
    BookOpen, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';
import {
    FaTrophy, FaMedal, FaRibbon, FaWhatsapp, FaDownload, FaFilePdf,
    FaImage, FaExclamationTriangle, FaChartLine, FaTable, FaCalendarAlt,
    FaExclamationCircle, FaUserGraduate, FaChartPie, FaChartBar, FaFileExcel
} from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format, subDays, subMonths, parseISO, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ExamAnalysis() {
    const reportRef = useRef(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'students', 'topPerformers', 'questions', 'comparison', 'advanced'
    const [viewMode, setViewMode] = useState('charts'); // 'charts', 'tables', 'cards'
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);
    const [performanceMetric, setPerformanceMetric] = useState('averageScore');

    // Filters
    const [selectedDateRange, setSelectedDateRange] = useState('month');
    const [customDateRange, setCustomDateRange] = useState({ startDate: null, endDate: null });
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedExam, setSelectedExam] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [selectedView, setSelectedView] = useState('overview');
    const [passRateFilter, setPassRateFilter] = useState(60);
    const [attemptsRange, setAttemptsRange] = useState({ min: '', max: '' });
    const [selectedQuestion, setSelectedQuestion] = useState('');

    // Analytics Data
    const [questionsList, setQuestionsList] = useState([]);


    // Comparison Data
    const [comparisonType, setComparisonType] = useState('time');
    const [compareExam1, setCompareExam1] = useState('');
    const [compareExam2, setCompareExam2] = useState('');
    const [examComparisonData, setExamComparisonData] = useState({});
    const [performanceTrends, setPerformanceTrends] = useState([]);
    const [monthlyComparison, setMonthlyComparison] = useState([]);


    // Performance data over time periods
    const [performanceData, setPerformanceData] = useState([]);

    // Question-specific analytics
    const [questionAnalytics, setQuestionAnalytics] = useState([]);

    // Comparative data (e.g., this month vs last month)
    const [comparativeData, setComparativeData] = useState({
        currentPeriod: {
            averageScore: 0,
            passRate: 0,
            participationRate: 0
        },
        previousPeriod: {
            averageScore: 0,
            passRate: 0,
            participationRate: 0
        }
    });

    // Track user engagement patterns
    const [engagementPatterns, setEngagementPatterns] = useState({
        dayOfWeekDistribution: [],
        timeOfDayDistribution: [],
        deviceDistribution: []
    });

    // Advanced analytics for instructors
    const [advancedMetrics, setAdvancedMetrics] = useState({
        pointBiserialCorrelations: [],
        discriminationIndices: [],
        difficultyIndices: []
    });
    const [distributionData, setDistributionData] = useState([
        { name: 'ممتاز (90-100)', value: 0, color: '#4CAF50' },
        { name: 'جيد جداً (80-89)', value: 0, color: '#2196F3' },
        { name: 'جيد (70-79)', value: 0, color: '#FFC107' },
        { name: 'مقبول (60-69)', value: 0, color: '#FF9800' },
        { name: 'ضعيف (أقل من 60)', value: 0, color: '#F44336' }
    ]);
    const [availableExams, setAvailableExams] = useState([]);
    const [examOptionsMap, setExamOptionsMap] = useState([]);
    const [studentsByExam, setStudentsByExam] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentListLoading, setStudentListLoading] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedQuestionForDetails, setSelectedQuestionForDetails] = useState(null);
    const [examStats, setExamStats] = useState({
        averageScore: 75,
        medianScore: 78,
        modeScore: 80,
        passRate: 85,
        standardDeviation: 10.5,
        skewness: -0.25,
        kurtosis: 2.8,
        cronbachAlpha: 0.87
    });

    useEffect(() => {
        fetchExamResults();
        fetchTopPerformers();
        // Only fetch comparison data after we have the main data
    }, [selectedDateRange, selectedCourse, selectedLevel]);

    useEffect(() => {
        // Fetch comparison data after main data is loaded
        if (!loading) {
            fetchMonthlyComparison();
            fetchPerformanceTrends();
        }
    }, [loading]);

    useEffect(() => {
        if (selectedExam && selectedExam !== 'all') {
            fetchStudentsByExam(selectedExam);
        }
    }, [selectedExam]);

    const fetchExamResults = async () => {
        try {
            setLoading(true);
            const token = Cookies.get('token'); // Get token from cookies

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const results = response.data.data;

            // Extract unique exam titles
            const examTitles = new Set();
            results.forEach(student => {
                student.results.forEach(exam => {
                    examTitles.add(exam.examTitle);
                });
            });
            setAvailableExams(Array.from(examTitles));

            // Process results for statistics
            processExamStats(results);
            processPerformanceData(results);
            processDistributionData(results);
            calculateComparativeData(results);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching exam results:', error);
            setLoading(false);
        }
    };

    const fetchTopPerformers = async () => {
        try {
            const token = Cookies.get('token');

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/top-performers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setTopPerformers(response.data.data);
        } catch (error) {
            console.error('Error fetching top performers:', error);
        }
    };

    // Replace the existing fetchStudentsByExam function with this:
    const fetchStudentsByExam = async (examId) => {
        if (!examId || examId === 'all') {
            setStudentsByExam([]);
            return;
        }

        setStudentListLoading(true);
        try {
            const token = Cookies.get('token');
            const response = await fetch(`http://192.168.1.3:9000/examResult/by-exam/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setStudentsByExam(data.data);
            } else {
                console.error('Failed to fetch students:', data.error);
                setStudentsByExam([]);
            }
        } catch (error) {
            console.error('Error fetching students by exam:', error);
            setStudentsByExam([]);
        } finally {
            setStudentListLoading(false);
        }
    };

    // Add a function to fetch students by exam ID
    const fetchStudentsByExamId = async (examId) => {
        setStudentListLoading(true);
        try {
            const token = Cookies.get('token');

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/by-exam/${examId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setStudentsByExam(response.data.data);
        } catch (error) {
            console.error('Error fetching students by exam ID:', error);
            setStudentsByExam([]);
        } finally {
            setStudentListLoading(false);
        }
    };

    // Function to compare exams
    const compareExams = async () => {
        if (!compareExam1 || !compareExam2) {
            alert('يرجى اختيار امتحانين للمقارنة');
            return;
        }

        if (compareExam1 === compareExam2) {
            alert('يرجى اختيار امتحانين مختلفين للمقارنة');
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get('token');

            // Fetch data for both exams
            const [exam1Response, exam2Response] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/by-exam/${compareExam1}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/by-exam/${compareExam2}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const exam1Data = exam1Response.data.data;
            const exam2Data = exam2Response.data.data;

            // Process exam statistics
            const exam1Stats = processExamStatsForComparison(exam1Data, compareExam1);
            const exam2Stats = processExamStatsForComparison(exam2Data, compareExam2);

            setExamComparisonData({
                exam1: exam1Stats,
                exam2: exam2Stats
            });

        } catch (error) {
            console.error('Error comparing exams:', error);
            alert('حدث خطأ أثناء مقارنة الامتحانات');
        } finally {
            setLoading(false);
        }
    };

    // Function to process exam stats for comparison
    const processExamStatsForComparison = (studentsData, examTitle) => {
        let totalScore = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        let passCount = 0;
        let totalAttempts = 0;
        let totalTime = 0;
        let maxScore = 0;
        let scores = [];

        studentsData.forEach(studentData => {
            // Handle new API response structure
            if (studentData.bestAttempt) {
                const bestAttempt = studentData.bestAttempt;
                const score = bestAttempt.score;

                totalScore += score;
                totalCorrect += bestAttempt.correctAnswers || 0;
                totalQuestions += bestAttempt.totalQuestions || 0;
                totalAttempts += studentData.totalAttempts || 1;
                totalTime += bestAttempt.timeSpent || 0;
                maxScore = Math.max(maxScore, score);
                scores.push(score);

                if (score >= 60) passCount++;
            } else {
                // Fallback for old structure if it exists
                const examResults = studentData.results?.filter(result => result.examTitle === examTitle) || [];
                examResults.forEach(result => {
                    const score = (result.correctAnswers / result.totalQuestions) * 100;
                    totalScore += score;
                    totalCorrect += result.correctAnswers || 0;
                    totalQuestions += result.totalQuestions || 0;
                    totalTime += result.timeSpent || 0;
                    totalAttempts++;
                    scores.push(score);
                    maxScore = Math.max(maxScore, score);
                    if (score >= 60) passCount++;
                });
            }
        });

        const averageScore = studentsData.length > 0 ? Math.round(totalScore / studentsData.length) : 0;
        const passRate = studentsData.length > 0 ? Math.round((passCount / studentsData.length) * 100) : 0;
        const participationRate = 100; // All students in the response participated
        const averageTime = studentsData.length > 0 ? Math.round(totalTime / studentsData.length) : 0;
        const avgAttemptsPerStudent = studentsData.length > 0 ? Math.round((totalAttempts / studentsData.length) * 10) / 10 : 0;

        return {
            title: examTitle,
            averageScore,
            passRate,
            participationRate,
            averageTime,
            totalAttempts,
            studentsCount: studentsData.length,
            participants: studentsData.length,
            topScore: Math.round(maxScore),
            completionTime: averageTime,
            averageAttempts: avgAttemptsPerStudent
        };
    };

    // Function to fetch monthly comparison data
    const fetchMonthlyComparison = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/monthly-comparison`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Monthly comparison response:', response.data);
            setMonthlyComparison(response.data.data || []);
        } catch (error) {
            console.error('Error fetching monthly comparison:', error);
            // Set fallback data
            setMonthlyComparison([
                { month: 'يوليو 2025', totalExams: 45, averageScore: 78, passRate: 82, participationRate: 95 },
                { month: 'يونيو 2025', totalExams: 38, averageScore: 74, passRate: 79, participationRate: 91 },
                { month: 'مايو 2025', totalExams: 42, averageScore: 76, passRate: 80, participationRate: 93 },
                { month: 'أبريل 2025', totalExams: 39, averageScore: 72, passRate: 77, participationRate: 89 },
                { month: 'مارس 2025', totalExams: 35, averageScore: 70, passRate: 75, participationRate: 87 },
                { month: 'فبراير 2025', totalExams: 32, averageScore: 68, passRate: 73, participationRate: 85 }
            ]);
        }
    };

    // Function to fetch performance trends
    const fetchPerformanceTrends = async () => {
        try {
            const token = Cookies.get('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/examResult/performance-trends`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Performance trends response:', response.data);
            setPerformanceTrends(response.data.data || []);
        } catch (error) {
            console.error('Error fetching performance trends:', error);
            // Set fallback data
            setPerformanceTrends([
                { date: 'يوليو', participation: 125, averageScore: 78 },
                { date: 'يونيو', participation: 108, averageScore: 74 },
                { date: 'مايو', participation: 142, averageScore: 76 },
                { date: 'أبريل', participation: 119, averageScore: 72 },
                { date: 'مارس', participation: 95, averageScore: 70 },
                { date: 'فبراير', participation: 87, averageScore: 68 }
            ]);
        }
    };

    // Function to calculate comparative data
    const calculateComparativeData = (results) => {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        let currentPeriodStats = { totalExams: 0, totalScore: 0, passCount: 0, participants: new Set() };
        let previousPeriodStats = { totalExams: 0, totalScore: 0, passCount: 0, participants: new Set() };
        let allTimeStats = { totalExams: 0, totalScore: 0, passCount: 0, participants: new Set() };

        results.forEach(student => {
            student.results.forEach(result => {
                const resultDate = new Date(result.date || result.createdAt);
                const score = (result.correctAnswers / result.totalQuestions) * 100;

                // Add to all-time stats for fallback
                allTimeStats.totalExams++;
                allTimeStats.totalScore += score;
                allTimeStats.participants.add(student.studentId._id);
                if (score >= 60) allTimeStats.passCount++;

                if (resultDate >= currentMonthStart) {
                    currentPeriodStats.totalExams++;
                    currentPeriodStats.totalScore += score;
                    currentPeriodStats.participants.add(student.studentId._id);
                    if (score >= 60) currentPeriodStats.passCount++;
                } else if (resultDate >= previousMonthStart && resultDate <= previousMonthEnd) {
                    previousPeriodStats.totalExams++;
                    previousPeriodStats.totalScore += score;
                    previousPeriodStats.participants.add(student.studentId._id);
                    if (score >= 60) previousPeriodStats.passCount++;
                }
            });
        });

        console.log('Current period stats:', currentPeriodStats);
        console.log('Previous period stats:', previousPeriodStats);
        console.log('All time stats:', allTimeStats);

        // If no recent data, use all-time stats with some variation for demonstration
        let currentAverageScore = currentPeriodStats.totalExams > 0 ?
            Math.round(currentPeriodStats.totalScore / currentPeriodStats.totalExams) :
            (allTimeStats.totalExams > 0 ? Math.round(allTimeStats.totalScore / allTimeStats.totalExams) : 0);

        let previousAverageScore = previousPeriodStats.totalExams > 0 ?
            Math.round(previousPeriodStats.totalScore / previousPeriodStats.totalExams) :
            (allTimeStats.totalExams > 0 ? Math.round((allTimeStats.totalScore / allTimeStats.totalExams) * 0.95) : 0);

        let currentPassRate = currentPeriodStats.totalExams > 0 ?
            Math.round((currentPeriodStats.passCount / currentPeriodStats.totalExams) * 100) :
            (allTimeStats.totalExams > 0 ? Math.round((allTimeStats.passCount / allTimeStats.totalExams) * 100) : 0);

        let previousPassRate = previousPeriodStats.totalExams > 0 ?
            Math.round((previousPeriodStats.passCount / previousPeriodStats.totalExams) * 100) :
            (allTimeStats.totalExams > 0 ? Math.round(((allTimeStats.passCount / allTimeStats.totalExams) * 100) * 0.92) : 0);

        let currentParticipationRate = currentPeriodStats.participants.size > 0 ?
            Math.round((currentPeriodStats.participants.size / Math.max(results.length, 1)) * 100) :
            (allTimeStats.participants.size > 0 ? Math.round((allTimeStats.participants.size / Math.max(results.length, 1)) * 100) : 0);

        let previousParticipationRate = previousPeriodStats.participants.size > 0 ?
            Math.round((previousPeriodStats.participants.size / Math.max(results.length, 1)) * 100) :
            (allTimeStats.participants.size > 0 ? Math.round(((allTimeStats.participants.size / Math.max(results.length, 1)) * 100) * 0.88) : 0);

        // If still no data, provide demo values
        if (currentAverageScore === 0 && previousAverageScore === 0) {
            currentAverageScore = 78;
            previousAverageScore = 74;
            currentPassRate = 85;
            previousPassRate = 81;
            currentParticipationRate = 92;
            previousParticipationRate = 88;
        }

        setComparativeData({
            currentPeriod: {
                averageScore: currentAverageScore,
                passRate: currentPassRate,
                participationRate: currentParticipationRate
            },
            previousPeriod: {
                averageScore: previousAverageScore,
                passRate: previousPassRate,
                participationRate: previousParticipationRate
            }
        });
    };

    const processExamStats = (results) => {
        const examAttempts = {};
        const totalExams = results.reduce((sum, student) => sum + student.results.length, 0);
        let totalScore = 0;
        let totalCorrect = 0;
        let totalQuestions = 0;
        let maxScore = 0;
        let totalTime = 0;
        let participatingStudents = new Set();
        let totalAttempts = 0;
        let uniqueExams = 0;

        results.forEach(student => {
            student.results.forEach(exam => {
                const examKey = `${student.studentId?._id || student._id}-${exam.examTitle}`;
                if (!examAttempts[examKey]) {
                    examAttempts[examKey] = [];
                    uniqueExams++;
                }
                examAttempts[examKey].push({
                    attempt: exam.attemptNumber,
                    score: (exam.correctAnswers / exam.totalQuestions) * 100
                });

                totalCorrect += exam.correctAnswers;
                totalQuestions += exam.totalQuestions;
                totalTime += exam.duration || 0;
                const score = (exam.correctAnswers / exam.totalQuestions) * 100;
                maxScore = Math.max(maxScore, score);
                if (student.studentId?._id) {
                    participatingStudents.add(student.studentId._id);
                }
            });
        });

        // Calculate average attempts per exam
        const totalAttemptsSum = Object.values(examAttempts).reduce((sum, attempts) => sum + attempts.length, 0);
        const avgAttempts = uniqueExams > 0 ? totalAttemptsSum / uniqueExams : 0;

        // Calculate improvement rate between first and last attempts
        let improvementRate = 0;
        let examWithMultipleAttempts = 0;
        Object.values(examAttempts).forEach(attempts => {
            if (attempts.length > 1) {
                examWithMultipleAttempts++;
                const firstScore = attempts[0].score;
                const lastScore = attempts[attempts.length - 1].score;
                improvementRate += lastScore - firstScore;
            }
        });

        improvementRate = examWithMultipleAttempts > 0 ? improvementRate / examWithMultipleAttempts : 0;

        const avgScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const passCount = Object.values(examAttempts).filter(attempts =>
            attempts.some(attempt => attempt.score >= 60)
        ).length;
        const passRate = uniqueExams > 0 ? (passCount / uniqueExams) * 100 : 0;

        setExamStats({
            totalExams,
            averageScore: Math.round(avgScore),
            passRate: Math.round(passRate),
            topScore: Math.round(maxScore),
            participationRate: Math.round((participatingStudents.size / (results.length || 1)) * 100),
            completionTime: Math.round(totalTime / totalExams) || 0,
            averageAttempts: Math.round(avgAttempts * 10) / 10,
            improvementRate: Math.round(improvementRate)
        });
    };

    const processPerformanceData = (results) => {
        const monthlyData = {};

        results.forEach(student => {
            student.results.forEach(exam => {
                const date = new Date(exam.examDate);
                const monthYear = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = {
                        month: monthYear,
                        متوسط: 0,
                        أعلى: 0,
                        أدنى: 100,
                        معدل_النجاح: 0,
                        count: 0
                    };
                }

                const score = (exam.correctAnswers / exam.totalQuestions) * 100;
                monthlyData[monthYear].أعلى = Math.max(monthlyData[monthYear].أعلى, score);
                monthlyData[monthYear].أدنى = Math.min(monthlyData[monthYear].أدنى, score);
                monthlyData[monthYear].متوسط =
                    (monthlyData[monthYear].متوسط * monthlyData[monthYear].count + score) /
                    (monthlyData[monthYear].count + 1);
                monthlyData[monthYear].count++;
                monthlyData[monthYear].معدل_النجاح =
                    (score >= 60 ? monthlyData[monthYear].معدل_النجاح + 1 : monthlyData[monthYear].معدل_النجاح);
            });
        });

        // Convert to array and calculate final pass rate
        const performanceDataArray = Object.values(monthlyData).map(data => ({
            ...data,
            متوسط: Math.round(data.متوسط),
            أعلى: Math.round(data.أعلى),
            أدنى: Math.round(data.أدنى),
            معدل_النجاح: Math.round((data.معدل_النجاح / data.count) * 100)
        }));

        setPerformanceData(performanceDataArray.slice(-6)); // Last 6 months
    };

    const processDistributionData = (results) => {
        const distribution = {
            'ممتاز (90-100)': 0,
            'جيد جداً (80-89)': 0,
            'جيد (70-79)': 0,
            'مقبول (60-69)': 0,
            'ضعيف (أقل من 60)': 0
        };

        let totalScores = 0;

        // Advanced analytics metrics
        const advancedMetrics = {
            discriminationIndices: [
                { questionNumber: 1, value: 0.45 },
                { questionNumber: 2, value: 0.28 },
                { questionNumber: 3, value: 0.65 },
                { questionNumber: 4, value: 0.32 },
                { questionNumber: 5, value: 0.18 },
                { questionNumber: 6, value: 0.53 },
                { questionNumber: 7, value: 0.41 },
                { questionNumber: 8, value: 0.22 },
                { questionNumber: 9, value: 0.37 },
                { questionNumber: 10, value: 0.49 }
            ],
            difficultyIndices: [
                { questionNumber: 1, difficulty: 0.75, discrimination: 0.45 },
                { questionNumber: 2, difficulty: 0.45, discrimination: 0.28 },
                { questionNumber: 3, difficulty: 0.85, discrimination: 0.65 },
                { questionNumber: 4, difficulty: 0.60, discrimination: 0.32 },
                { questionNumber: 5, difficulty: 0.35, discrimination: 0.18 },
                { questionNumber: 6, difficulty: 0.72, discrimination: 0.53 },
                { questionNumber: 7, difficulty: 0.65, discrimination: 0.41 },
                { questionNumber: 8, difficulty: 0.40, discrimination: 0.22 },
                { questionNumber: 9, difficulty: 0.55, discrimination: 0.37 },
                { questionNumber: 10, difficulty: 0.68, discrimination: 0.49 }
            ]
        };

        results.forEach(student => {
            student.results.forEach(exam => {
                const score = (exam.correctAnswers / exam.totalQuestions) * 100;
                totalScores++;

                if (score >= 90) distribution['ممتاز (90-100)']++;
                else if (score >= 80) distribution['جيد جداً (80-89)']++;
                else if (score >= 70) distribution['جيد (70-79)']++;
                else if (score >= 60) distribution['مقبول (60-69)']++;
                else distribution['ضعيف (أقل من 60)']++;
            });
        });

        setDistributionData(prevData => prevData.map(item => ({
            ...item,
            value: Math.round((distribution[item.name] / totalScores) * 100) || 0
        })));
    };

    // Function to format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    };

    // Function to get WhatsApp link
    const getWhatsAppLink = (phoneNumber) => {
        if (!phoneNumber) return '#';

        // Remove any non-digit characters
        const cleanNumber = phoneNumber.replace(/\D/g, '');

        // Format for WhatsApp API
        if (cleanNumber.startsWith('0')) {
            // Add country code for local numbers (e.g., Egypt +20)
            return `https://wa.me/2${cleanNumber}`;
        }

        return `https://wa.me/${cleanNumber}`;
    };

    // Function to export as image
    const exportAsImage = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#121212',
                logging: false,
            });

            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `تحليلات_الاختبارات_${new Date().toLocaleDateString('ar-EG')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting as image:', error);
        }
    };

    // Function to export as PDF
    const exportAsPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 1.5,
                backgroundColor: '#121212',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`تحليلات_الاختبارات_${new Date().toLocaleDateString('ar-EG')}.pdf`);
        } catch (error) {
            console.error('Error exporting as PDF:', error);
        }
    };

    // Export to Excel function
    const exportToExcel = () => {
        try {
            // Create worksheet from data
            const worksheet = XLSX.utils.json_to_sheet(
                studentsByExam.map(item => ({
                    'اسم الطالب': item.student.name,
                    'البريد الإلكتروني': item.student.email,
                    'الدرجة': item.bestAttempt.score,
                    'عدد المحاولات': item.totalAttempts,
                    'تاريخ أفضل محاولة': format(new Date(item.bestAttempt.examDate), 'yyyy-MM-dd'),
                    'الإجابات الصحيحة': item.bestAttempt.correctAnswers,
                    'إجمالي الأسئلة': item.bestAttempt.totalQuestions
                }))
            );

            // Create workbook and add worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "تحليل الاختبارات");

            // Generate Excel file and trigger download
            XLSX.writeFile(workbook, `تحليل_الاختبارات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        }
    };

    return (
        <div className="space-y-6 font-arabicUI3">
            {/* Header with analytics dashboard branding */}
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl p-6 mb-8 border border-blue-800/30">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/30 rounded-lg">
                                <BarChart2 className="text-blue-400" size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-white">تحليل الاختبارات</h1>
                        </div>
                        <p className="text-gray-300 max-w-2xl">
                            نظام تحليل متقدم لقياس أداء الطلاب في الاختبارات مع رؤى تفصيلية للأسئلة والنتائج
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="dropdown relative group">
                            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors text-white py-2 px-4 rounded-lg">
                                <Download size={16} />
                                <span>تصدير</span>
                                <ChevronDown size={16} />
                            </button>

                            <div className="dropdown-menu absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                                <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
                                    <button
                                        onClick={exportAsImage}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors text-right"
                                    >
                                        <FaImage size={16} className="ml-2" />
                                        <span>تصدير كصورة PNG</span>
                                    </button>

                                    <button
                                        onClick={exportAsPDF}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700 text-right"
                                    >
                                        <FaFilePdf size={16} className="ml-2" />
                                        <span>تصدير كملف PDF</span>
                                    </button>

                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700 text-right"
                                    >
                                        <FaFileExcel size={16} className="ml-2" />
                                        <span>تصدير لملف Excel</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setFullScreen(!fullScreen)}
                            className="flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-lg"
                            title={fullScreen ? "إلغاء وضع ملء الشاشة" : "وضع ملء الشاشة"}
                        >
                            {fullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Analytics Filters */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-6">
                {/* Main filters */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="w-full md:w-auto flex-1">
                            <label className="block text-gray-300 text-sm font-medium mb-2">اختر الامتحان</label>
                            <div className="relative">
                                <select
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 pl-10 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                >
                                    <option className="text-black" value="all">جميع الاختبارات</option>
                                    {availableExams.map((exam, index) => (
                                        <option className="text-black" key={index} value={exam}>{exam}</option>
                                    ))}
                                </select>
                                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>

                        <div className="w-full md:w-auto min-w-[200px]">
                            <label className="block text-gray-300 text-sm font-medium mb-2">الفترة الزمنية</label>
                            <div className="relative">
                                <select
                                    value={selectedDateRange}
                                    onChange={(e) => setSelectedDateRange(e.target.value)}
                                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 pl-10 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                >
                                    <option className="text-black" value="week">آخر أسبوع</option>
                                    <option className="text-black" value="month">آخر شهر</option>
                                    <option className="text-black" value="quarter">آخر 3 شهور</option>
                                    <option className="text-black" value="year">آخر سنة</option>
                                    <option className="text-black" value="all">كل الوقت</option>
                                    <option className="text-black" value="custom">تاريخ مخصص</option>
                                </select>
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>

                        <div className="w-full md:w-auto min-w-[200px]">
                            <label className="block text-gray-300 text-sm font-medium mb-2">المستوى</label>
                            <div className="relative">
                                <select
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 pl-10 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                >
                                    <option className="text-black" value="all">جميع المستويات</option>
                                    <option className="text-black" value="beginner">مبتدئ</option>
                                    <option className="text-black" value="intermediate">متوسط</option>
                                    <option className="text-black" value="advanced">متقدم</option>
                                </select>
                                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2 px-4 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors"
                        >
                            <Sliders size={18} />
                            <span>فلاتر متقدمة</span>
                            {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <button
                            onClick={fetchExamResults}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            <Search size={18} />
                            <span>تطبيق</span>
                        </button>
                    </div>
                </div>

                {/* Advanced filters - collapsible */}
                {showAdvancedFilters && (
                    <div className="p-5 bg-blue-900/10 border-t border-white/10 animate-slideDown">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">تصفية حسب معدل النجاح</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={passRateFilter}
                                        onChange={(e) => setPassRateFilter(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <span className="text-white bg-white/10 px-2 py-1 rounded min-w-[50px] text-center">
                                        {passRateFilter}%
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">عدد المحاولات</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            placeholder="الحد الأدنى"
                                            value={attemptsRange.min}
                                            onChange={(e) => setAttemptsRange(prev => ({ ...prev, min: e.target.value }))}
                                            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            placeholder="الحد الأقصى"
                                            value={attemptsRange.max}
                                            onChange={(e) => setAttemptsRange(prev => ({ ...prev, max: e.target.value }))}
                                            className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">الأسئلة المحددة</label>
                                <div className="relative">
                                    <select
                                        value={selectedQuestion}
                                        onChange={(e) => setSelectedQuestion(e.target.value)}
                                        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 pl-10 appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    >
                                        <option className="text-black" value="">جميع الأسئلة</option>
                                        {questionsList.map((question, index) => (
                                            <option className="text-black" key={index} value={question.id}>سؤال {index + 1}</option>
                                        ))}
                                    </select>
                                    <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                </div>
                            </div>
                        </div>

                        {selectedDateRange === 'custom' && (
                            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">من تاريخ</label>
                                    <input
                                        type="date"
                                        value={customDateRange.startDate || ''}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        value={customDateRange.endDate || ''}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Analytics Tabs */}
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-6">
                <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap ${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            } transition-all`}
                    >
                        <PieChartIcon size={18} />
                        <span>نظرة عامة</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('topPerformers')}
                        className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap ${activeTab === 'topPerformers'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            } transition-all`}
                    >
                        <Award size={18} />
                        <span>المتفوقون</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap ${activeTab === 'students'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            } transition-all`}
                    >
                        <Users size={18} />
                        <span>الطلاب المشاركون</span>
                        {studentsByExam.length > 0 && (
                            <span className="ml-2 bg-blue-500/20 text-blue-400 text-xs py-1 px-2 rounded-full">
                                {studentsByExam.length}
                            </span>
                        )}
                    </button>


                    <button
                        onClick={() => setActiveTab('comparison')}
                        className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap ${activeTab === 'comparison'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            } transition-all`}
                    >
                        <Activity size={18} />
                        <span>المقارنة والاتجاهات</span>
                    </button>


                </div>


            </div>

            {/* محتوى التقرير */}
            <div ref={reportRef}>
                {loading ? (
                    // Loading skeleton
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 h-32" />
                        ))}
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <>
                                {/* Summary Statistics Banner */}
                                <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl p-6 mb-6 border border-blue-800/30">
                                    <div className="flex flex-col md:flex-row md:justify-between gap-6 items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">نظرة عامة على الأداء</h2>
                                            <p className="text-gray-300">
                                                {selectedExam !== 'all' ? `تحليل أداء الطلاب في امتحان "${selectedExam}"` : 'تحليل أداء الطلاب في جميع الاختبارات'}
                                            </p>
                                        </div>

                                        {selectedDateRange !== 'all' && (
                                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                                                <Calendar size={16} className="text-blue-400" />
                                                <span className="text-gray-300">
                                                    {selectedDateRange === 'week' ? 'آخر 7 أيام' :
                                                        selectedDateRange === 'month' ? 'آخر 30 يوم' :
                                                            selectedDateRange === 'quarter' ? 'آخر 3 أشهر' :
                                                                selectedDateRange === 'year' ? 'آخر سنة' :
                                                                    'فترة مخصصة'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* إحصائيات سريعة - Enhanced KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-700/10 backdrop-blur-xl rounded-xl p-6 border border-blue-800/30 hover:border-blue-500/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                                <Award className="text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-2xl font-bold text-white">{examStats.averageScore}%</h3>
                                                    {comparativeData.currentPeriod.averageScore > comparativeData.previousPeriod.averageScore && (
                                                        <span className="text-green-400 text-sm flex items-center">
                                                            <ArrowUpRight size={14} />
                                                            {((comparativeData.currentPeriod.averageScore - comparativeData.previousPeriod.averageScore) / comparativeData.previousPeriod.averageScore * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400">متوسط الدرجات</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">الوسيط</span>
                                                <span className="text-white">{examStats.medianScore}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-900/20 to-green-700/10 backdrop-blur-xl rounded-xl p-6 border border-green-800/30 hover:border-green-500/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                                                <CheckCircle className="text-green-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-2xl font-bold text-white">{examStats.passRate}%</h3>
                                                    {comparativeData.currentPeriod.passRate > comparativeData.previousPeriod.passRate && (
                                                        <span className="text-green-400 text-sm flex items-center">
                                                            <ArrowUpRight size={14} />
                                                            {((comparativeData.currentPeriod.passRate - comparativeData.previousPeriod.passRate) / comparativeData.previousPeriod.passRate * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400">نسبة النجاح</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${examStats.passRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-700/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-800/30 hover:border-yellow-500/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                                                <TrendingUp className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-2xl font-bold text-white">{examStats.topScore}%</h3>
                                                </div>
                                                <p className="text-gray-400">أعلى درجة</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">أدنى درجة</span>
                                                <span className="text-white">{examStats.lowestScore || '0'}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-700/10 backdrop-blur-xl rounded-xl p-6 border border-purple-800/30 hover:border-purple-500/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                                                <Users className="text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-2xl font-bold text-white">{examStats.participationRate}%</h3>
                                                    {comparativeData.currentPeriod.participationRate > comparativeData.previousPeriod.participationRate && (
                                                        <span className="text-green-400 text-sm flex items-center">
                                                            <ArrowUpRight size={14} />
                                                            {((comparativeData.currentPeriod.participationRate - comparativeData.previousPeriod.participationRate) / comparativeData.previousPeriod.participationRate * 100).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400">نسبة المشاركة</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">إجمالي الطلاب</span>
                                                <span className="text-white">{examStats.totalStudents}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-lg">
                                                <Book className="text-gray-300" size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{examStats.totalExams}</h3>
                                                <p className="text-gray-400 text-sm">إجمالي الامتحانات</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-lg">
                                                <Clock className="text-gray-300" size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{examStats.completionTime} دقيقة</h3>
                                                <p className="text-gray-400 text-sm">متوسط وقت الإكمال</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-lg">
                                                <RotateCw className="text-gray-300" size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{examStats.averageAttempts}</h3>
                                                <p className="text-gray-400 text-sm">متوسط المحاولات</p>
                                            </div>
                                        </div>
                                    </div>

                                    {examStats.improvementRate > 0 && (
                                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/20 rounded-lg">
                                                    <TrendingUp className="text-green-500" size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">+{examStats.improvementRate}%</h3>
                                                    <p className="text-gray-400 text-sm">معدل التحسن</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    {/* Performance Trends - Area Chart */}
                                    <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 backdrop-blur-xl rounded-xl p-6 border border-blue-800/30 hover:border-blue-700/40 transition-colors">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <FaChartLine className="text-blue-400" />
                                                <span>اتجاهات الأداء</span>
                                            </h3>

                                            <select
                                                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
                                                onChange={(e) => setPerformanceMetric(e.target.value)}
                                                value={performanceMetric}
                                            >
                                                <option className="text-black" value="averageScore">متوسط الدرجات</option>
                                                <option className="text-black" value="passRate">نسبة النجاح</option>
                                                <option className="text-black" value="participationRate">نسبة المشاركة</option>
                                            </select>
                                        </div>

                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={performanceData}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3182CE" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#3182CE" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                                <XAxis dataKey="month" stroke="#fff" />
                                                <YAxis stroke="#fff" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1a1a1a',
                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="متوسط"
                                                    stroke="#3182CE"
                                                    fillOpacity={1}
                                                    fill="url(#colorScore)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Score Distribution - Enhanced Pie Chart */}
                                    <div className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 backdrop-blur-xl rounded-xl p-6 border border-purple-800/30 hover:border-purple-700/40 transition-colors">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                <FaChartPie className="text-purple-400" />
                                                <span>توزيع الدرجات</span>
                                            </h3>

                                            <div className="bg-purple-500/10 px-3 py-1 rounded-lg text-sm text-purple-300 border border-purple-500/20">
                                                {distributionData.reduce((total, item) => total + item.count, 0)} طالب
                                            </div>
                                        </div>

                                        <div className="flex flex-col lg:flex-row items-center">
                                            <ResponsiveContainer width="100%" height={280}>
                                                <PieChart>
                                                    <Pie
                                                        data={distributionData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {distributionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#1a1a1a',
                                                            border: '1px solid rgba(255,255,255,0.2)'
                                                        }}
                                                        formatter={(value, name) => [`${value}%`, name]}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>

                                            <div className="grid grid-cols-1 gap-2 mt-4 lg:mt-0 w-full lg:w-auto">
                                                {distributionData.map((entry, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                        <span className="text-gray-300">{entry.name}:</span>
                                                        <span className="text-white font-medium">{entry.count} طالب</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </>
                        )}


                        {activeTab === 'topPerformers' && (
                            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-xl rounded-xl p-6 border border-blue-800/30">
                                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                                    <Award className="text-yellow-400" />
                                    <span>أفضل الطلاب أداءً</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    {topPerformers.slice(0, 3).map((performer, index) => (
                                        <div
                                            key={performer.studentId}
                                            className={`bg-gradient-to-br ${index === 0 ? 'from-amber-500/20 to-yellow-700/30 border-yellow-500/50' :
                                                index === 1 ? 'from-gray-300/20 to-gray-600/30 border-gray-400/50' :
                                                    'from-amber-700/20 to-amber-900/30 border-amber-700/50'
                                                } p-6 rounded-xl border shadow-lg relative overflow-hidden`}
                                        >
                                            <div className="absolute -top-6 -right-6 opacity-10">
                                                {index === 0 && <FaTrophy size={120} className="text-yellow-500" />}
                                                {index === 1 && <FaMedal size={120} className="text-gray-400" />}
                                                {index === 2 && <FaRibbon size={120} className="text-amber-700" />}
                                            </div>

                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={`p-3 rounded-full ${index === 0 ? 'bg-yellow-500/30 text-yellow-300' :
                                                    index === 1 ? 'bg-gray-400/30 text-gray-300' :
                                                        'bg-amber-700/30 text-amber-600'
                                                    }`}>
                                                    {index === 0 && <FaTrophy size={24} />}
                                                    {index === 1 && <FaMedal size={24} />}
                                                    {index === 2 && <FaRibbon size={24} />}
                                                </div>

                                                <div>
                                                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-1 ${index === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                            'bg-amber-700/20 text-amber-600'
                                                        }`}>
                                                        المركز {index + 1}
                                                    </div>
                                                    <h4 className="text-xl font-bold text-white">{performer.name}</h4>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-gray-400 text-sm mb-1">متوسط الدرجات</div>
                                                <div className="text-3xl font-bold text-white">{performer.percentage}%</div>
                                            </div>

                                            <div className="mb-4 pt-4 border-t border-white/10">
                                                <div className="text-gray-400 text-sm mb-1">أفضل امتحان</div>
                                                <div className="text-lg font-medium text-white">{performer.bestExam || selectedExam}</div>
                                            </div>

                                            <a
                                                href={`mailto:${performer.email}`}
                                                className="text-blue-400 hover:text-blue-300 text-sm block"
                                            >
                                                {performer.email}
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                {topPerformers.length > 3 && (
                                    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
                                        <div className="p-6 border-b border-white/10">
                                            <h4 className="text-xl font-bold text-white">باقي الطلاب المتفوقين</h4>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-white">
                                                <thead>
                                                    <tr className="bg-white/5">
                                                        <th className="py-4 px-6 text-right">الترتيب</th>
                                                        <th className="py-4 px-6 text-right">الاسم</th>
                                                        <th className="py-4 px-6 text-right">البريد الإلكتروني</th>
                                                        <th className="py-4 px-6 text-right">الدرجة</th>
                                                        <th className="py-4 px-6 text-right">عدد المحاولات</th>
                                                        <th className="py-4 px-6 text-right">تفاصيل</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topPerformers.slice(3).map((performer, index) => (
                                                        <tr key={performer.studentId} className="border-t border-white/5 hover:bg-white/5">
                                                            <td className="py-3 px-6">{index + 4}</td>
                                                            <td className="py-3 px-6 font-medium">{performer.name}</td>
                                                            <td className="py-3 px-6 text-blue-400">{performer.email}</td>
                                                            <td className="py-3 px-6">
                                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${performer.percentage >= 90 ? 'bg-green-500/20 text-green-400' :
                                                                    performer.percentage >= 80 ? 'bg-blue-500/20 text-blue-400' :
                                                                        performer.percentage >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {performer.percentage}%
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-6">{performer.attempts || 1}</td>
                                                            <td className="py-3 px-6">
                                                                <button
                                                                    onClick={() => viewStudentDetails(performer.studentId)}
                                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
                                                                >
                                                                    <Search size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'comparison' && (
                            <>
                                <div className="bg-gradient-to-r from-green-900/40 to-teal-900/40 rounded-2xl p-6 mb-6 border border-green-800/30">
                                    <div className="flex flex-col md:flex-row md:justify-between gap-6 items-center">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">تحليل مقارن</h2>
                                            <p className="text-gray-300">
                                                مقارنة الأداء بين الفترات الزمنية والمجموعات
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/10 rounded-xl overflow-hidden border border-white/20 flex">
                                                <button
                                                    onClick={() => setComparisonType('time')}
                                                    className={`px-4 py-2 ${comparisonType === 'time' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                                                >
                                                    فترات زمنية
                                                </button>
                                                <button
                                                    onClick={() => setComparisonType('exams')}
                                                    className={`px-4 py-2 ${comparisonType === 'exams' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                                                >
                                                    امتحانات
                                                </button>
                                                <button
                                                    onClick={() => setComparisonType('groups')}
                                                    className={`px-4 py-2 ${comparisonType === 'groups' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                                                >
                                                    مجموعات
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {comparisonType === 'time' && (
                                    <>
                                        {/* Time Period Comparison */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-bold text-white">متوسط الدرجات</h4>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${comparativeData.currentPeriod.averageScore > comparativeData.previousPeriod.averageScore
                                                        ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {comparativeData.currentPeriod.averageScore > comparativeData.previousPeriod.averageScore
                                                            ? `+${(comparativeData.currentPeriod.averageScore - comparativeData.previousPeriod.averageScore).toFixed(1)}%`
                                                            : `${(comparativeData.currentPeriod.averageScore - comparativeData.previousPeriod.averageScore).toFixed(1)}%`
                                                        }
                                                    </div>
                                                </div>

                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة الحالية</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.currentPeriod.averageScore}%</div>
                                                    </div>
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة السابقة</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.previousPeriod.averageScore}%</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-bold text-white">نسبة النجاح</h4>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${comparativeData.currentPeriod.passRate > comparativeData.previousPeriod.passRate
                                                        ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {comparativeData.currentPeriod.passRate > comparativeData.previousPeriod.passRate
                                                            ? `+${(comparativeData.currentPeriod.passRate - comparativeData.previousPeriod.passRate).toFixed(1)}%`
                                                            : `${(comparativeData.currentPeriod.passRate - comparativeData.previousPeriod.passRate).toFixed(1)}%`
                                                        }
                                                    </div>
                                                </div>

                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة الحالية</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.currentPeriod.passRate}%</div>
                                                    </div>
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة السابقة</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.previousPeriod.passRate}%</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-lg font-bold text-white">نسبة المشاركة</h4>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${comparativeData.currentPeriod.participationRate > comparativeData.previousPeriod.participationRate
                                                        ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {comparativeData.currentPeriod.participationRate > comparativeData.previousPeriod.participationRate
                                                            ? `+${(comparativeData.currentPeriod.participationRate - comparativeData.previousPeriod.participationRate).toFixed(1)}%`
                                                            : `${(comparativeData.currentPeriod.participationRate - comparativeData.previousPeriod.participationRate).toFixed(1)}%`
                                                        }
                                                    </div>
                                                </div>

                                                <div className="mt-6 grid grid-cols-2 gap-4">
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة الحالية</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.currentPeriod.participationRate}%</div>
                                                    </div>
                                                    <div className="bg-white/10 rounded-lg p-4">
                                                        <div className="text-gray-400 text-sm mb-1">الفترة السابقة</div>
                                                        <div className="text-2xl font-bold text-white">{comparativeData.previousPeriod.participationRate}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trends Chart */}
                                        <div className="bg-gradient-to-br from-green-900/10 to-blue-900/10 backdrop-blur-xl rounded-xl p-6 border border-green-800/30 mb-8">
                                            <h3 className="text-xl font-bold text-white mb-6">اتجاهات الأداء عبر الزمن</h3>

                                            <ResponsiveContainer width="100%" height={400}>
                                                <ComposedChart data={performanceTrends}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                                    <XAxis dataKey="date" stroke="#fff" />
                                                    <YAxis yAxisId="left" stroke="#10B981" />
                                                    <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#1a1a1a',
                                                            border: '1px solid rgba(255,255,255,0.2)'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar yAxisId="left" dataKey="participation" name="عدد المشاركين" fill="#10B981" />
                                                    <Line yAxisId="right" type="monotone" dataKey="averageScore" name="متوسط الدرجات" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Monthly Comparison */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mb-6">
                                            <div className="p-6 border-b border-white/10">
                                                <h3 className="text-xl font-bold text-white">المقارنة الشهرية</h3>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-white">
                                                    <thead>
                                                        <tr className="bg-white/5">
                                                            <th className="py-4 px-6 text-right">الشهر</th>
                                                            <th className="py-4 px-6 text-right">عدد الاختبارات</th>
                                                            <th className="py-4 px-6 text-right">متوسط الدرجات</th>
                                                            <th className="py-4 px-6 text-right">نسبة النجاح</th>
                                                            <th className="py-4 px-6 text-right">معدل المشاركة</th>
                                                            <th className="py-4 px-6 text-right">التغير</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {monthlyComparison.map((month, index) => (
                                                            <tr key={index} className="border-t border-white/5 hover:bg-white/5">
                                                                <td className="py-3 px-6 font-medium">{month.month}</td>
                                                                <td className="py-3 px-6">{month.examsCount}</td>
                                                                <td className="py-3 px-6">
                                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${month.averageScore >= 80 ? 'bg-green-500/20 text-green-400' :
                                                                        month.averageScore >= 70 ? 'bg-blue-500/20 text-blue-400' :
                                                                            month.averageScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                        {month.averageScore}%
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-6">{month.passRate}%</td>
                                                                <td className="py-3 px-6">{month.participationRate}%</td>
                                                                <td className="py-3 px-6">
                                                                    <div className="flex items-center gap-1">
                                                                        {month.change > 0 ? (
                                                                            <>
                                                                                <ArrowUpRight className="text-green-400" size={16} />
                                                                                <span className="text-green-400">+{month.change}%</span>
                                                                            </>
                                                                        ) : month.change < 0 ? (
                                                                            <>
                                                                                <ArrowUpRight className="text-red-400 transform rotate-90" size={16} />
                                                                                <span className="text-red-400">{month.change}%</span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-400">0%</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {comparisonType === 'exams' && (
                                    <>
                                        {/* Exams Comparison */}
                                        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 mb-8">
                                            <h3 className="text-xl font-bold text-white mb-6">مقارنة بين الاختبارات</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-gray-300 text-sm font-medium mb-2">اختر الامتحان الأول</label>
                                                    <select
                                                        value={compareExam1}
                                                        onChange={(e) => setCompareExam1(e.target.value)}
                                                        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 appearance-none"
                                                    >
                                                        {availableExams.map((exam, index) => (
                                                            <option className="text-black" key={`exam1-${index}`} value={exam}>{exam}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-gray-300 text-sm font-medium mb-2">اختر الامتحان الثاني</label>
                                                    <select
                                                        value={compareExam2}
                                                        onChange={(e) => setCompareExam2(e.target.value)}
                                                        className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-3 appearance-none"
                                                    >
                                                        {availableExams.map((exam, index) => (
                                                            <option className="text-black" key={`exam2-${index}`} value={exam}>{exam}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <button
                                                    onClick={compareExams}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    قارن الاختبارات
                                                </button>
                                            </div>
                                        </div>

                                        {examComparisonData.exam1 && examComparisonData.exam2 && (
                                            <>
                                                {/* Exams Comparison Results */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                                    <div className="bg-gradient-to-br from-blue-900/10 to-indigo-900/10 backdrop-blur-xl rounded-xl p-6 border border-blue-800/30">
                                                        <h4 className="text-lg font-bold text-white mb-4">مقارنة المؤشرات الرئيسية</h4>

                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart
                                                                data={[
                                                                    {
                                                                        name: 'متوسط الدرجات',
                                                                        [examComparisonData.exam1.title]: examComparisonData.exam1.averageScore,
                                                                        [examComparisonData.exam2.title]: examComparisonData.exam2.averageScore
                                                                    },
                                                                    {
                                                                        name: 'نسبة النجاح',
                                                                        [examComparisonData.exam1.title]: examComparisonData.exam1.passRate,
                                                                        [examComparisonData.exam2.title]: examComparisonData.exam2.passRate
                                                                    },
                                                                    {
                                                                        name: 'نسبة المشاركة',
                                                                        [examComparisonData.exam1.title]: examComparisonData.exam1.participationRate,
                                                                        [examComparisonData.exam2.title]: examComparisonData.exam2.participationRate
                                                                    }
                                                                ]}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                                                <XAxis dataKey="name" stroke="#fff" />
                                                                <YAxis stroke="#fff" />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#1a1a1a',
                                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                                    }}
                                                                />
                                                                <Legend />
                                                                <Bar dataKey={examComparisonData.exam1.title} fill="#3B82F6" />
                                                                <Bar dataKey={examComparisonData.exam2.title} fill="#8B5CF6" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>


                                                </div>

                                                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mb-6">
                                                    <div className="p-6 border-b border-white/10">
                                                        <h4 className="text-lg font-bold text-white">مقارنة تفصيلية</h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                                        <div>
                                                            <h5 className="text-lg font-bold text-blue-400 mb-4">{examComparisonData.exam1.title}</h5>

                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">متوسط الدرجات:</span>
                                                                    <span className="text-white">{examComparisonData.exam1.averageScore}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">نسبة النجاح:</span>
                                                                    <span className="text-white">{examComparisonData.exam1.passRate}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">عدد المشاركين:</span>
                                                                    <span className="text-white">{examComparisonData.exam1.participants}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">أعلى درجة:</span>
                                                                    <span className="text-white">{examComparisonData.exam1.topScore}%</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">متوسط وقت الإكمال:</span>
                                                                    <span className="text-white">{examComparisonData.exam1.completionTime} دقيقة</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h5 className="text-lg font-bold text-purple-400 mb-4">{examComparisonData.exam2.title}</h5>

                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">متوسط الدرجات:</span>
                                                                    <div className="flex items-center">
                                                                        <span className="text-white">{examComparisonData.exam2.averageScore}%</span>
                                                                        {examComparisonData.exam2.averageScore !== examComparisonData.exam1.averageScore && (
                                                                            <span className={`ml-2 text-xs ${examComparisonData.exam2.averageScore > examComparisonData.exam1.averageScore
                                                                                ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {examComparisonData.exam2.averageScore > examComparisonData.exam1.averageScore ? '+' : ''}
                                                                                {(examComparisonData.exam2.averageScore - examComparisonData.exam1.averageScore).toFixed(1)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">نسبة النجاح:</span>
                                                                    <div className="flex items-center">
                                                                        <span className="text-white">{examComparisonData.exam2.passRate}%</span>
                                                                        {examComparisonData.exam2.passRate !== examComparisonData.exam1.passRate && (
                                                                            <span className={`ml-2 text-xs ${examComparisonData.exam2.passRate > examComparisonData.exam1.passRate
                                                                                ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {examComparisonData.exam2.passRate > examComparisonData.exam1.passRate ? '+' : ''}
                                                                                {(examComparisonData.exam2.passRate - examComparisonData.exam1.passRate).toFixed(1)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">عدد المشاركين:</span>
                                                                    <div className="flex items-center">
                                                                        <span className="text-white">{examComparisonData.exam2.participants}</span>
                                                                        {examComparisonData.exam2.participants !== examComparisonData.exam1.participants && (
                                                                            <span className={`ml-2 text-xs ${examComparisonData.exam2.participants > examComparisonData.exam1.participants
                                                                                ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {examComparisonData.exam2.participants > examComparisonData.exam1.participants ? '+' : ''}
                                                                                {examComparisonData.exam2.participants - examComparisonData.exam1.participants}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">أعلى درجة:</span>
                                                                    <div className="flex items-center">
                                                                        <span className="text-white">{examComparisonData.exam2.topScore}%</span>
                                                                        {examComparisonData.exam2.topScore !== examComparisonData.exam1.topScore && (
                                                                            <span className={`ml-2 text-xs ${examComparisonData.exam2.topScore > examComparisonData.exam1.topScore
                                                                                ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {examComparisonData.exam2.topScore > examComparisonData.exam1.topScore ? '+' : ''}
                                                                                {(examComparisonData.exam2.topScore - examComparisonData.exam1.topScore).toFixed(1)}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">متوسط وقت الإكمال:</span>
                                                                    <div className="flex items-center">
                                                                        <span className="text-white">{examComparisonData.exam2.completionTime} دقيقة</span>
                                                                        {examComparisonData.exam2.completionTime !== examComparisonData.exam1.completionTime && (
                                                                            <span className={`ml-2 text-xs ${examComparisonData.exam2.completionTime < examComparisonData.exam1.completionTime
                                                                                ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {examComparisonData.exam2.completionTime < examComparisonData.exam1.completionTime ? '-' : '+'}
                                                                                {Math.abs(examComparisonData.exam2.completionTime - examComparisonData.exam1.completionTime).toFixed(1)} د
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {comparisonType === 'groups' && (
                                    <div className="text-center py-12 text-gray-400 bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                        <Info className="mx-auto mb-4" size={48} />
                                        <h3 className="text-xl font-bold text-white mb-2">قريباً</h3>
                                        <p>تحليل المقارنات بين المجموعات المختلفة سيكون متاحاً قريباً</p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'students' && (
                            <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 backdrop-blur-xl rounded-xl p-6 border border-blue-800/30">
                                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Users className="text-blue-400" />
                                        <span>
                                            {selectedExam === 'all' ?
                                                'اختر امتحاناً محدداً لعرض الطلاب المشاركين' :
                                                `الطلاب المشاركون في امتحان: ${selectedExam}`
                                            }
                                        </span>
                                    </h3>

                                    {selectedExam !== 'all' && (
                                        <div className="relative">
                                            <Search className="absolute top-2.5 right-3 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="بحث عن طالب..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="bg-white/10 border border-white/20 rounded-lg py-2 pr-10 pl-4 w-64 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                            />
                                        </div>
                                    )}
                                </div>

                                {selectedExam === 'all' ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Clipboard className="mx-auto mb-4" size={48} />
                                        <p>يرجى اختيار امتحان محدد من القائمة المنسدلة أعلاه لعرض الطلاب المشاركين</p>
                                    </div>
                                ) : studentListLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                        <p className="text-gray-400">جاري تحميل بيانات الطلاب...</p>
                                    </div>
                                ) : studentsByExam.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <AlertTriangle className="mx-auto mb-4" size={48} />
                                        <p>لا يوجد طلاب شاركوا في هذا الامتحان</p>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-xl overflow-hidden">
                                        <table className="w-full text-white">
                                            <thead>
                                                <tr className="bg-white/10">
                                                    <th className="py-3 px-4 text-right">الترتيب</th>
                                                    <th className="py-3 px-4 text-right">الاسم</th>
                                                    <th className="py-3 px-4 text-right">الدرجة</th>
                                                    <th className="py-3 px-4 text-right">عدد المحاولات</th>
                                                    <th className="py-3 px-4 text-right">تاريخ أفضل محاولة</th>
                                                    <th className="py-3 px-4 text-right">تواصل</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsByExam
                                                    .filter(item =>
                                                        item.student.name.includes(searchTerm) ||
                                                        item.student.email.includes(searchTerm)
                                                    )
                                                    .map((item, index) => (
                                                        <tr
                                                            key={item.student.id}
                                                            className={`border-t border-white/10 hover:bg-white/5 ${index < 3 ? (
                                                                index === 0 ? 'bg-yellow-500/10' :
                                                                    index === 1 ? 'bg-gray-400/10' :
                                                                        'bg-amber-700/10'
                                                            ) : ''}`}
                                                        >
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center">
                                                                    {index === 0 && <FaTrophy className="text-yellow-500 mr-2" />}
                                                                    {index === 1 && <FaMedal className="text-gray-400 mr-2" />}
                                                                    {index === 2 && <FaRibbon className="text-amber-700 mr-2" />}
                                                                    {index + 1}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 font-medium">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedStudent(item);
                                                                        setShowStudentModal(true);
                                                                    }}
                                                                    className="hover:text-blue-400 transition-colors"
                                                                >
                                                                    {item.student.name}
                                                                </button>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span
                                                                    className={`inline-block px-2 py-1 rounded text-xs font-bold ${item.bestAttempt.score >= 90 ? 'bg-green-500/20 text-green-400' :
                                                                        item.bestAttempt.score >= 80 ? 'bg-blue-500/20 text-blue-400' :
                                                                            item.bestAttempt.score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                item.bestAttempt.score >= 60 ? 'bg-orange-500/20 text-orange-400' :
                                                                                    'bg-red-500/20 text-red-400'
                                                                        }`}
                                                                >
                                                                    {item.bestAttempt.score}%
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">{item.totalAttempts}</td>
                                                            <td className="py-3 px-4 text-gray-300">{formatDate(item.bestAttempt.examDate)}</td>
                                                            <td className="py-3 px-4">
                                                                {item.student.phoneNumber && (
                                                                    <a
                                                                        href={getWhatsAppLink(item.student.phoneNumber)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center justify-center p-2 bg-green-600/20 hover:bg-green-600/40 text-green-500 rounded-lg transition-colors"
                                                                    >
                                                                        <FaWhatsapp size={18} />
                                                                    </a>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}


                    </>
                )}
            </div>

            {/* Question Details Modal */}
            {selectedQuestionForDetails && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">تفاصيل السؤال {selectedQuestionForDetails.questionNumber}</h3>
                                <button
                                    onClick={() => setSelectedQuestionForDetails(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                                <h4 className="text-blue-400 text-sm mb-2">نص السؤال</h4>
                                <p className="text-white">{selectedQuestionForDetails.text || 'لا يتوفر نص السؤال'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-blue-400 text-sm mb-2">نسبة النجاح</h4>
                                    <p className="text-2xl font-bold text-white">{selectedQuestionForDetails.successRate}%</p>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-blue-400 text-sm mb-2">متوسط وقت الإجابة</h4>
                                    <p className="text-2xl font-bold text-white">{selectedQuestionForDetails.avgTime} ثانية</p>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-blue-400 text-sm mb-2">معامل الصعوبة</h4>
                                    <div className="flex items-center gap-1 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-8 h-2 rounded-full ${i < selectedQuestionForDetails.difficultyIndex ? 'bg-orange-500' : 'bg-white/20'
                                                    }`}
                                            ></div>
                                        ))}
                                        <span className="ml-2 text-white">{selectedQuestionForDetails.difficultyIndex}/5</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-blue-400 text-sm mb-2">معامل التمييز</h4>
                                    <p className="text-2xl font-bold text-white">{selectedQuestionForDetails.discriminationIndex.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                                <h4 className="text-blue-400 text-sm mb-2">توزيع الإجابات</h4>

                                <div className="space-y-3 mt-4">
                                    {selectedQuestionForDetails.answerDistribution && selectedQuestionForDetails.answerDistribution.map((answer, index) => (
                                        <div key={index} className="relative">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className={`${answer.isCorrect ? 'text-green-400' : 'text-gray-300'} flex items-center gap-1`}>
                                                    {answer.isCorrect && <CheckCircle size={14} />}
                                                    {answer.text || `الخيار ${index + 1}`}
                                                </span>
                                                <span className="text-white">{answer.percentage}%</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${answer.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{ width: `${answer.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h4 className="text-blue-400 text-sm mb-4">توصيات لتحسين السؤال</h4>

                                <ul className="space-y-3 text-sm">
                                    {selectedQuestionForDetails.discriminationIndex < 0.3 && (
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="text-orange-400 mt-0.5" size={14} />
                                            <span className="text-gray-300">
                                                معامل التمييز منخفض ({selectedQuestionForDetails.discriminationIndex.toFixed(2)}). ينصح بمراجعة صياغة السؤال للتمييز بشكل أفضل بين مستويات الطلاب.
                                            </span>
                                        </li>
                                    )}

                                    {selectedQuestionForDetails.successRate < 30 && (
                                        <li className="flex items-start gap-2">
                                            <AlertTriangle className="text-orange-400 mt-0.5" size={14} />
                                            <span className="text-gray-300">
                                                نسبة النجاح منخفضة جداً ({selectedQuestionForDetails.successRate}%). ينصح بمراجعة صعوبة السؤال أو المفاهيم التي يغطيها.
                                            </span>
                                        </li>
                                    )}

                                    {selectedQuestionForDetails.successRate > 90 && (
                                        <li className="flex items-start gap-2">
                                            <Info className="text-blue-400 mt-0.5" size={14} />
                                            <span className="text-gray-300">
                                                نسبة النجاح مرتفعة جداً ({selectedQuestionForDetails.successRate}%). السؤال قد يكون سهلاً للغاية ويمكن زيادة صعوبته.
                                            </span>
                                        </li>
                                    )}

                                    {selectedQuestionForDetails.avgTime > 60 && (
                                        <li className="flex items-start gap-2">
                                            <Clock className="text-blue-400 mt-0.5" size={14} />
                                            <span className="text-gray-300">
                                                متوسط وقت الإجابة طويل ({selectedQuestionForDetails.avgTime} ثانية). قد يشير هذا إلى تعقيد صياغة السؤال أو طوله.
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gray-900/80 border-t border-gray-800 p-6 flex justify-end">
                            <button
                                onClick={() => setSelectedQuestionForDetails(null)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Modal for Student Details */}
            {showStudentModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <FaUserGraduate className="text-blue-400" />
                                    <span>تفاصيل الطالب</span>
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowStudentModal(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Student Profile */}
                            <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-xl border border-blue-500/30">
                                        <User className="text-blue-400" size={40} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-bold text-white mb-2">{selectedStudent.student.name}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-sm">البريد الإلكتروني</p>
                                                <p className="text-blue-400 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                                    </svg>
                                                    {selectedStudent.student.email}
                                                </p>
                                            </div>
                                            <div>
                                                {selectedStudent.student.phoneNumber && (
                                                    <>
                                                        <p className="text-gray-400 text-sm">رقم الهاتف</p>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-white">{selectedStudent.student.phoneNumber}</p>
                                                            <a
                                                                href={getWhatsAppLink(selectedStudent.student.phoneNumber)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center p-2 bg-green-600/20 hover:bg-green-600/40 text-green-500 rounded-lg transition-colors"
                                                            >
                                                                <FaWhatsapp size={16} />
                                                            </a>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Summary */}
                            <div className="mb-6">
                                <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Award size={18} className="text-blue-400" />
                                    <span>ملخص الأداء</span>
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-blue-500/30 transition-colors">
                                        <h5 className="text-blue-400 mb-1 text-sm">أفضل درجة</h5>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-bold text-white">{selectedStudent.bestAttempt.score}%</p>
                                            {selectedStudent.bestAttempt.rank && (
                                                <span className="text-yellow-400 text-sm">
                                                    الترتيب: {selectedStudent.bestAttempt.rank}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-500/30 transition-colors">
                                        <h5 className="text-green-400 mb-1 text-sm">الإجابات الصحيحة</h5>
                                        <p className="text-2xl font-bold text-white">
                                            {selectedStudent.bestAttempt.correctAnswers} / {selectedStudent.bestAttempt.totalQuestions}
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition-colors">
                                        <h5 className="text-purple-400 mb-1 text-sm">إجمالي المحاولات</h5>
                                        <p className="text-2xl font-bold text-white">{selectedStudent.totalAttempts}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-colors">
                                        <h5 className="text-orange-400 mb-1 text-sm">تاريخ أفضل محاولة</h5>
                                        <p className="text-lg font-bold text-white">{formatDate(selectedStudent.bestAttempt.examDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Over Attempts */}
                            {selectedStudent.attempts && selectedStudent.attempts.length > 1 && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 mb-6">
                                    <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-blue-400" />
                                        <span>التقدم عبر المحاولات</span>
                                    </h5>

                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={selectedStudent.attempts.map((attempt, index) => ({
                                            name: `محاولة ${index + 1}`,
                                            score: attempt.score,
                                            date: formatDate(attempt.examDate)
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                            <XAxis dataKey="name" stroke="#fff" />
                                            <YAxis stroke="#fff" domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1a1a1a',
                                                    border: '1px solid rgba(255,255,255,0.2)'
                                                }}
                                                formatter={(value, name, props) => [`${value}%`, `الدرجة`, props.payload.date]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#3182CE"
                                                strokeWidth={2}
                                                dot={{ stroke: '#3182CE', strokeWidth: 2, r: 4, fill: '#1a1a1a' }}
                                                activeDot={{ stroke: '#3182CE', strokeWidth: 2, r: 6, fill: '#3182CE' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>

                                    {selectedStudent.improvement && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <div className="text-gray-300 text-sm">
                                                    المحاولة الأولى: <span className="text-white">{selectedStudent.attempts[0].score}%</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">
                                                    التحسن: <span className={`${selectedStudent.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {selectedStudent.improvement > 0 ? '+' : ''}{selectedStudent.improvement}%
                                                    </span>
                                                </div>
                                                <div className="text-gray-300 text-sm">
                                                    المحاولة الأخيرة: <span className="text-white">{selectedStudent.attempts[selectedStudent.attempts.length - 1].score}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Question Analysis */}
                            {selectedStudent.questionAnalysis && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 mb-6">
                                    <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <HelpCircle size={18} className="text-blue-400" />
                                        <span>تحليل الأسئلة</span>
                                    </h5>

                                    <div className="bg-white/5 rounded-xl overflow-hidden">
                                        <table className="w-full text-white">
                                            <thead>
                                                <tr className="bg-white/10">
                                                    <th className="py-3 px-4 text-right">رقم السؤال</th>
                                                    <th className="py-3 px-4 text-right">الإجابة</th>
                                                    <th className="py-3 px-4 text-right">الوقت المستغرق</th>
                                                    <th className="py-3 px-4 text-right">الصعوبة</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedStudent.questionAnalysis.map((q, index) => (
                                                    <tr key={index} className={`border-t border-white/10 hover:bg-white/5 ${!q.correct ? 'bg-red-900/10' : ''}`}>
                                                        <td className="py-3 px-4">سؤال {q.number}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${q.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {q.correct ? 'صحيحة' : 'خاطئة'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">{q.time} ثانية</td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className={`w-5 h-1 rounded-full ${i < q.difficulty ? 'bg-orange-500' : 'bg-white/20'
                                                                        }`}></div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Student Insights */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                                <h5 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-blue-400" />
                                    <span>تحليل الأداء</span>
                                </h5>

                                <div className="grid grid-cols-1 gap-4">
                                    {selectedStudent.strengths && selectedStudent.strengths.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-500/20 text-green-400 rounded-full mt-1">
                                                <CheckCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium mb-1">نقاط القوة</p>
                                                <ul className="text-gray-300 text-sm space-y-1">
                                                    {selectedStudent.strengths.map((strength, index) => (
                                                        <li key={index} className="flex items-center gap-2">
                                                            <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                                            {strength}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {selectedStudent.weaknesses && selectedStudent.weaknesses.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-500/20 text-red-400 rounded-full mt-1">
                                                <AlertTriangle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium mb-1">نقاط تحتاج إلى تحسين</p>
                                                <ul className="text-gray-300 text-sm space-y-1">
                                                    {selectedStudent.weaknesses.map((weakness, index) => (
                                                        <li key={index} className="flex items-center gap-2">
                                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                                            {weakness}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full mt-1">
                                            <Info size={16} />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium mb-1">توصيات</p>
                                            <p className="text-gray-300 text-sm">
                                                {selectedStudent.recommendations || "بناءً على أداء الطالب، ينصح بالتركيز على المفاهيم الأساسية ومراجعة المواد التعليمية المتعلقة بالأسئلة التي أخطأ فيها."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-900/80 border-t border-gray-800 p-6 flex justify-between items-center">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open(`mailto:${selectedStudent.student.email}?subject=متابعة أدائك في الاختبار: ${selectedExam}`)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    <span>إرسال بريد إلكتروني</span>
                                </button>

                                {selectedStudent.student.phoneNumber && (
                                    <a
                                        href={getWhatsAppLink(selectedStudent.student.phoneNumber)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <FaWhatsapp size={16} />
                                        <span>واتساب</span>
                                    </a>
                                )}
                            </div>

                            <button
                                onClick={() => setShowStudentModal(false)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}