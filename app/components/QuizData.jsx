'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import Swal from 'sweetalert2';
import { FiHelpCircle, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import axios from 'axios';

const QuizData = ({ params }) => {
    const { quizid } = React.use(params);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [quizComplete, setQuizComplete] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [lastAnswerFeedback, setLastAnswerFeedback] = useState(null);
    const [userData, setUserData] = useState({ email: '', fullName: '' });

    // Load user data from cookies
    useEffect(() => {
        const userFullName = Cookies.get('username');
        if (userFullName) {
            setUserData({ fullName: userFullName });
        }
    }, []);

    // Load answers from localStorage on initial load
    useEffect(() => {
        if (quizid) {
            const savedAnswers = localStorage.getItem(`quiz_${quizid}_answers`);
            if (savedAnswers) {
                setSelectedAnswers(JSON.parse(savedAnswers));
            }
        }
    }, [quizid]);

    // Save answers to localStorage whenever they change
    useEffect(() => {
        if (quizid && Object.keys(selectedAnswers).length > 0) {
            localStorage.setItem(`quiz_${quizid}_answers`, JSON.stringify(selectedAnswers));
        }
    }, [selectedAnswers, quizid]);

    useEffect(() => {
        if (quizid) {
            loadQuizData();
        }
    }, [quizid]);
    const loadQuizData = async () => {
        try {
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('لم يتم العثور على رمز المصادقة');
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/exam/${quizid}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response || !response.data) {
                throw new Error('لا يمكن الوصول إلى هذا الاختبار');
            }

            const examData = response.data;

            // 🔁 تحويل بيانات الأسئلة إلى الشكل المناسب
            const parsedQuestions = examData.questions.map((q) => ({
                qus: q.title,
                opationA: q.options.a,
                opationB: q.options.b,
                opationC: q.options.c,
                opationD: q.options.d,
                trueChoisevip: q.correctAnswer?.toUpperCase(), // "a" => "A"
                imageUrl: q.imageUrl
            }));

            setQuiz({
                title: examData.title,
                questions: parsedQuestions
            });

            setTimeLeft(parsedQuestions.length * 120);
            setLoading(false);

        } catch (error) {
            console.error('Error loading quiz:', error);
            Swal.fire({
                title: 'خطأ',
                text: error.message || 'حدث خطأ أثناء تحميل الاختبار',
                icon: 'error',
                confirmButtonText: 'حسناً'
            }).then(() => {
                window.location.href = '/';
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft === null || quizComplete) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, quizComplete]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key >= '1' && e.key <= '4') {
                const options = ['A', 'B', 'C', 'D'];
                handleAnswerSelect(options[e.key - 1]);
            } else if (e.key === 'ArrowLeft') handleNextQuestion();
            else if (e.key === 'ArrowRight') handlePrevQuestion();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentQuestion]);

    const handleAnswerSelect = (answer) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [currentQuestion]: answer
        }));
        setLastAnswerFeedback({
            message: 'إجابة مسجلة!',
            timestamp: Date.now()
        });
        setTimeout(() => setLastAnswerFeedback(null), 2000);
    };

    const handleNextQuestion = () => {
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const calculateResults = () => {
        let score = 0;
        const detailedResults = quiz.questions.map((q, index) => {
            const isCorrect = selectedAnswers[index] === q.trueChoisevip;
            if (isCorrect) score++;
            return {
                question: q.qus,
                userAnswer: selectedAnswers[index],
                userAnswerText: q[`opation${selectedAnswers[index]}`],
                correctAnswer: q.trueChoisevip,
                correctAnswerText: q[`opation${q.trueChoisevip}`],
                isCorrect
            };
        });

        return {
            score,
            total: quiz.questions.length,
            percentage: (score / quiz.questions.length) * 100,
            details: detailedResults
        };
    };

    const handleSubmitQuiz = async () => {
        // Check for unanswered questions
        const unansweredQuestions = quiz.questions.reduce((acc, _, index) => {
            if (!selectedAnswers[index]) acc.push(index + 1);
            return acc;
        }, []);

        if (unansweredQuestions.length > 0) {
            await Swal.fire({
                title: 'أسئلة غير مجابة',
                html: `يرجى الإجابة على جميع الأسئلة.<br>الأسئلة غير مجابة: ${unansweredQuestions.join(', ')}`,
                icon: 'warning',
                confirmButtonText: 'حسناً'
            });
            return;
        }

        try {
            const result = await Swal.fire({
                title: 'هل أنت متأكد؟',
                text: 'بعد تسليم الاختبار لا يمكنك العودة للإجابات',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم، سلم الاختبار',
                cancelButtonText: 'لا، عودة للاختبار'
            });

            if (!result.isConfirmed) return;

            const results = calculateResults();

            // Format data according to the requested format
            const examResult = {
                examTitle: quiz.title,
                totalQuestions: quiz.questions.length,
                correctAnswers: results.score
            };

            // Get the token from cookies
            const token = Cookies.get('token');
            if (!token) {
                throw new Error('لم يتم العثور على رمز المصادقة');
            }

            // Send result to the backend
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/examResult/create`, examResult, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setResults(results);
            setQuizComplete(true);
            localStorage.removeItem(`quiz_${quizid}_answers`);

        } catch (error) {
            console.error('Error submitting quiz:', error);
            await Swal.fire({
                title: 'خطأ',
                text: error.message || 'حدث خطأ أثناء حفظ النتائج',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (quizComplete) {
        return (
            <div dir='rtl' className="min-h-screen bg-slate-950 text-slate-200 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-10 shadow-xl border border-slate-800">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-4xl font-arabicUI3 text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                نتائج الاختبار
                            </h2>

                            <div className="relative bg-slate-800/50 rounded-xl p-8 mb-12">
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div className="p-6">
                                        <div className="text-5xl font-arabicUI3 mb-2 text-blue-400">
                                            {results.percentage.toFixed(0)}%
                                        </div>
                                        <div className="text-slate-400">النسبة المئوية</div>
                                    </div>
                                    <div className="p-6 border-x border-slate-700">
                                        <div className="text-5xl font-arabicUI3 mb-2 text-emerald-400">
                                            {results.score}
                                        </div>
                                        <div className="text-slate-400">الإجابات الصحيحة</div>
                                    </div>
                                    <div className="p-6">
                                        <div className="text-5xl font-arabicUI3 mb-2 text-slate-400">
                                            {results.total}
                                        </div>
                                        <div className="text-slate-400">مجموع الأسئلة</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {results.details.map((result, index) => (
                                    <div key={index}
                                        className="bg-slate-800/30 rounded-lg p-6 transition-all duration-300 hover:bg-slate-800/50">
                                        <div className="flex flex-col gap-4">
                                            {/* Question Image */}
                                            {quiz.questions[index]?.imageUrl && (
                                                <div className="w-full">
                                                    <div className="relative h-48 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={quiz.questions[index].imageUrl}
                                                            alt="Question Image"
                                                            layout="fill"
                                                            objectFit="contain"
                                                            className="backdrop-blur-sm bg-white/5"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Question Details */}
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${result.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {result.isCorrect ?
                                                        <AiOutlineCheckCircle size={24} /> :
                                                        <AiOutlineCloseCircle size={24} />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium mb-3">{result.question}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className={`p-4 rounded-lg ${result.isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                            <p className="text-sm text-slate-400 mb-1">إجابتك</p>
                                                            <p className={result.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                                                                {result.userAnswerText}
                                                            </p>
                                                        </div>
                                                        {!result.isCorrect && (
                                                            <div className="p-4 rounded-lg bg-emerald-500/10">
                                                                <p className="text-sm text-slate-400 mb-1">الإجابة الصحيحة</p>
                                                                <p className="text-emerald-400">{result.correctAnswerText}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/">
                                <button className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                                                 transition-all duration-300 font-medium text-lg">
                                    العودة للصفحة الرئيسية
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div dir='rtl' className="min-h-screen bg-slate-950 py-8 px-4 relative">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${(currentQuestion / quiz.questions.length) * 100}%` }}
                />
            </div>

            {/* Help Panel */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed top-20 left-4 p-6 bg-slate-800/90 backdrop-blur-lg rounded-2xl w-80"
                    >
                        <h3 className="text-xl text-white mb-4">اختصارات لوحة المفاتيح</h3>
                        <ul className="space-y-2 text-slate-300">
                            <li>← السؤال التالي</li>
                            <li>→ السؤال السابق</li>
                            <li>1-4 اختيار الإجابة</li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl font-arabicUI3  mx-auto">
                <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-slate-800">
                    {/* Enhanced Header */}
                    <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl   font-arabicUI3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                                {quiz.title}
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                    احياء
                                </span>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                                    {quiz.questions.length} أسئلة
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Enhanced Timer */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                                <div className="relative bg-slate-800 px-6 py-3 rounded-lg flex items-center gap-3">
                                    <AiOutlineClockCircle className="text-blue-400" />
                                    <span className="font-mono text-2xl text-slate-200">{formatTime(timeLeft)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all duration-300"
                            >
                                <FiHelpCircle className="text-blue-400 text-xl" />
                            </button>
                        </div>
                    </header>

                    {/* Answer Feedback Animation */}
                    <AnimatePresence>
                        {lastAnswerFeedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="fixed bottom-8 left-8 bg-emerald-500/90 text-white px-6 py-3 rounded-lg
                                         backdrop-blur-lg flex items-center gap-2"
                            >
                                <FiCheck />
                                {lastAnswerFeedback.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <nav className="mb-8 overflow-x-auto">
                        <div className="flex gap-2 p-1">
                            {quiz?.questions?.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestion(index)}
                                    className={`
                                        min-w-[3rem] h-12 flex items-center justify-center rounded-lg
                                        font-medium transition-all duration-300
                                        ${selectedAnswers[index]
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}
                                        ${currentQuestion === index ? 'ring-2 ring-blue-500' : ''}
                                    `}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </nav>

                    <div className="bg-slate-800/30 rounded-xl p-8 mb-8">
                        <h2 className="text-2xl font-medium text-slate-200 mb-4">
                            {quiz?.questions[currentQuestion]?.qus}
                        </h2>

                        {/* Add Image Display */}
                        {quiz?.questions[currentQuestion]?.imageUrl && (
                            <div className="mb-8 flex justify-center">
                                <div className="relative w-full max-w-2xl h-64 rounded-xl overflow-hidden">
                                    <Image
                                        src={quiz.questions[currentQuestion].imageUrl}
                                        alt="Question Image"
                                        layout="fill"
                                        objectFit="contain"
                                        className="backdrop-blur-sm bg-white/5"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            console.error('Failed to load image');
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['A', 'B', 'C', 'D'].map((option, idx) => {
                                const arabicOptions = ['ا', 'ب', 'ج', 'د'];
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswerSelect(option)}
                                        className={`
                                            p-6 rounded-xl text-right transition-all duration-300
                                            flex items-center gap-4 group
                                            ${selectedAnswers[currentQuestion] === option
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'}
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                            transition-all duration-300
                                            ${selectedAnswers[currentQuestion] === option
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700'}
                                        `}>
                                            {arabicOptions[idx]}
                                        </div>
                                        <span className="flex-1">
                                            {quiz?.questions[currentQuestion]?.[`opation${option}`]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestion === 0}
                            className="px-8 py-4 bg-slate-800/50 text-slate-200 rounded-lg
                                     transition-all duration-300 hover:bg-slate-800
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            السؤال السابق
                        </button>

                        {currentQuestion === quiz?.questions?.length - 1 ? (
                            <button
                                onClick={handleSubmitQuiz}
                                className="px-8 py-4 bg-blue-600 text-white rounded-lg
                                         hover:bg-blue-700 transition-all duration-300"
                            >
                                إنهاء الاختبار
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                className="px-8 py-4 bg-slate-800/50 text-slate-200 rounded-lg
                                         hover:bg-slate-800 transition-all duration-300"
                            >
                                السؤال التالي
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizData;