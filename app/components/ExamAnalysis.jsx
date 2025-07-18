import { useState, useEffect } from "react";
import { FileText, AlertCircle, Clock, Download, Play, PieChart, BarChart, Award, Book, Users, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from "recharts";
import { LightbulbIcon } from "lucide-react";
import { Lightbulb, BookmarkPlus, BookmarkCheck, RefreshCw } from 'lucide-react';
import { FaSquareRootAlt, FaInfinity, FaCalculator } from "react-icons/fa";
import MemoryGame from "./Game";

// Colors for charts
const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#ec4899', '#f43f5e', '#f97316'];
const adviceDatabase = [
  {
    title: "نصيحة اليوم",
    content: "التعلم المستمر هو مفتاح النجاح. خصص 30 دقيقة يومياً للمراجعة وستلاحظ تحسناً كبيراً في مستواك الدراسي.",
    tags: ["دراسة", "تنظيم الوقت", "نجاح"]
  },
  {
    title: "فكرة مفيدة",
    content: "تقسيم المهام الكبيرة إلى خطوات صغيرة يجعلها أكثر قابلية للإنجاز. ركز على إنجاز خطوة واحدة في كل مرة.",
    tags: ["إنتاجية", "تخطيط", "إدارة المهام"]
  },
  {
    title: "نصيحة صحية",
    content: "شرب الماء بكميات كافية يحسن التركيز ويزيد من الطاقة. احرص على شرب 8 أكواب يومياً على الأقل.",
    tags: ["صحة", "طاقة", "تركيز"]
  },
  {
    title: "للنجاح المهني",
    content: "تطوير مهاراتك باستمرار يفتح أبواباً جديدة للفرص. خصص وقتاً أسبوعياً لتعلم مهارة جديدة.",
    tags: ["تطوير ذاتي", "مهارات", "عمل"]
  },
  {
    title: "للحياة المتوازنة",
    content: "خصص وقتاً للاسترخاء والتأمل يومياً. عشر دقائق من التأمل تساعد في تقليل التوتر وتحسين جودة الحياة.",
    tags: ["توازن", "صحة نفسية", "تأمل"]
  },
  {
    title: "نصيحة للمذاكرة",
    content: "تغيير مكان المذاكرة من وقت لآخر يساعد على تحسين التركيز وتنشيط الذاكرة. جرب الدراسة في أماكن مختلفة.",
    tags: ["دراسة", "تركيز", "ذاكرة"]
  },
  {
    title: "للعلاقات الإيجابية",
    content: "الاستماع الجيد هو أساس التواصل الفعال. ركز على فهم الآخرين قبل أن تتوقع منهم فهمك.",
    tags: ["علاقات", "تواصل", "استماع"]
  }
];


export default function EnhancedCourseOverview() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [todayAdvice, setTodayAdvice] = useState(null);

  // Theme state - synced with header theme toggle
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference and sync with document class
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(isDark);

    // Sync with document class
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Listen for theme changes from other components (like header)
  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
    };

    // Listen for storage changes (when theme is changed in other tabs/components)
    window.addEventListener('storage', handleThemeChange);

    // Also check periodically in case theme is changed by other components in same tab
    const interval = setInterval(() => {
      const savedTheme = localStorage.getItem('theme');
      const isDark = savedTheme === 'dark';
      if (isDark !== isDarkMode) {
        setIsDarkMode(isDark);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      clearInterval(interval);
    };
  }, [isDarkMode]);

 

  // Fetch student data from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get token from cookies
        const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
          const [name, value] = cookie.trim().split('=');
          cookies[name] = value;
          return cookies;
        }, {});

        const token = cookies.token || '';

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/examResult/getMe`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        } const data = await response.json();
        if (data.message === "No results found.") {
          setStudentData({ results: [] });
        } else {
          setStudentData(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    const getDailyAdvice = () => {
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const adviceIndex = dayOfYear % adviceDatabase.length;
      return adviceDatabase[adviceIndex];
    };

    setTodayAdvice(getDailyAdvice());
    fetchStudentData();
  }, []);


  // Process exam data to generate statistics
  const processExamData = () => {
    if (!studentData) return null;

    // Calculate average score across all exams
    const totalScores = studentData.results.reduce((sum, exam) => {
      return sum + (exam.correctAnswers / exam.totalQuestions * 100);
    }, 0);

    const averageScore = studentData.results.length > 0 ? totalScores / studentData.results.length : 0;

    // Get unique exam titles
    const uniqueExamTitles = [...new Set(studentData.results.map(result => result.examTitle))];

    // Get latest attempt for each unique exam
    const latestExams = uniqueExamTitles.map(title => {
      const examsForTitle = studentData.results.filter(result => result.examTitle === title);
      return examsForTitle.reduce((latest, current) => {
        return new Date(current.examDate) > new Date(latest.examDate) ? current : latest;
      });
    });

    // Format exam dates by day for progress chart
    const examsByDay = {};
    studentData.results.forEach(exam => {
      const date = new Date(exam.examDate);
      const dayKey = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }); // e.g., "7 مايو"

      if (!examsByDay[dayKey]) {
        examsByDay[dayKey] = [];
      }

      examsByDay[dayKey].push(exam.correctAnswers / exam.totalQuestions * 100);
    });

    const progressData = Object.keys(examsByDay).map(day => ({
      day,
      score: Math.round(examsByDay[day].reduce((sum, score) => sum + score, 0) / examsByDay[day].length)
    }));


    // Create skill data based on exam performance
    const mathExams = studentData.results.filter(exam => exam.examTitle === "Math Final");
    const chemistryExams = studentData.results.filter(exam => exam.examTitle === "امتحان كيمياء");

    const mathScore = mathExams.length > 0 ?
      mathExams.reduce((avg, exam) => avg + (exam.correctAnswers / exam.totalQuestions * 100), 0) / mathExams.length : 0;

    const chemistryScore = chemistryExams.length > 0 ?
      chemistryExams.reduce((avg, exam) => avg + (exam.correctAnswers / exam.totalQuestions * 100), 0) / chemistryExams.length : 0;

    const skillsData = [
      { name: "الاحياء", value: Math.round(mathScore) || 70 },
      { name: "الكيمياء", value: Math.round(chemistryScore) || 50 },
      { name: "التفكير المنطقي", value: Math.round((mathScore + chemistryScore) / 2) || 60 },
      { name: "التحليل", value: Math.round((mathScore * 0.7 + chemistryScore * 0.3)) || 65 },
      { name: "حل المشكلات", value: Math.round((mathScore * 0.6 + chemistryScore * 0.4)) || 75 }
    ];

    // Calculate attempts distribution
    const timeDistribution = [
      { name: "الاحياء", value: Math.round(studentData.results.filter(exam => exam.examTitle === "Math Final").length / studentData.results.length * 100) },
      { name: "الكيمياء", value: Math.round(studentData.results.filter(exam => exam.examTitle === "امتحان كيمياء").length / studentData.results.length * 100) }
    ];

    return {
      title: "نظرة عامة على الأداء",
      studentName: studentData.studentId.name,
      studentEmail: studentData.studentId.email,
      progress: Math.round(averageScore),
      level: averageScore >= 80 ? "متقدم" : averageScore >= 60 ? "متوسط" : "مبتدئ",
      rank: 5, // Placeholder since we don't have ranking data
      totalStudents: 30, // Placeholder
      progressData,
      skillsData,
      timeDistribution,
      latestExams,
      upcomingEvents: [
        { title: "امتحان الفيزياء", date: "15 مايو 2025", daysLeft: 9 },
        { title: "امتحان الأحياء", date: "22 مايو 2025", daysLeft: 16 },
      ]
    };
  };

  const course = processExamData();

  const [currentAdvice, setCurrentAdvice] = useState(null);
  const [savedAdvice, setSavedAdvice] = useState([]);
  const [isSaved, setIsSaved] = useState(false);

  // Get random advice that isn't already saved
  const getRandomAdvice = () => {
    let availableAdvice = [...adviceDatabase];

    // Filter out saved advice if there are still other options available
    if (savedAdvice.length < adviceDatabase.length) {
      availableAdvice = adviceDatabase.filter(advice =>
        !savedAdvice.some(saved => saved.content === advice.content)
      );
    }

    const randomIndex = Math.floor(Math.random() * availableAdvice.length);
    return availableAdvice[randomIndex];
  };

  // Initialize with random advice
  useEffect(() => {
    const advice = getRandomAdvice();
    setCurrentAdvice(advice);
    setIsSaved(false);
  }, []);

  // Get new advice
  const handleNewAdvice = () => {
    const advice = getRandomAdvice();
    setCurrentAdvice(advice);
    setIsSaved(false);
  };

  // Save current advice
  const handleSaveAdvice = () => {
    if (!isSaved && currentAdvice) {
      setSavedAdvice([...savedAdvice, currentAdvice]);
      setIsSaved(true);
    }
  };

  if (!currentAdvice) return null;
  const skillsData = [
    { name: 'الشرح', value: 70 },

    { name: 'الحل', value: 99 },
    { name: 'الاستمرارية', value: 95 },
    { name: 'الحفظ', value: 75 },
    { name: 'الفهم', value: 95 },]

  // Calculate level color based on progress
  const getLevelColor = () => {
    if (!course) return "text-yellow-400";
    if (course.progress >= 80) return "text-green-400";
    if (course.progress >= 60) return "text-blue-400";
    if (course.progress >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  // Format percentage for display
  const formatPercent = (value) => `${value}%`;

  if (loading) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-300" dir="rtl">
         <div className="relative z-20 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-800 dark:text-white">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300" dir="rtl">
         <div className="relative z-20 flex items-center justify-center h-screen">
          <div className="bg-red-100 dark:bg-red-900/20 backdrop-blur-sm rounded-xl p-6 border border-red-300 dark:border-red-500/30 max-w-md text-center">
            <AlertCircle size={40} className="text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-red-800 dark:text-white">حدث خطأ أثناء تحميل البيانات</h3>
            <p className="text-red-600 dark:text-white/70">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors text-white"
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!studentData || (!course && studentData?.results?.length === 0)) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300" dir="rtl">
         <div className="relative z-20 flex items-center justify-center h-screen">
          <div className="bg-white/80 border-gray-200 dark:bg-purple-900/20 dark:border-purple-500/30 backdrop-blur-sm rounded-xl p-6 border max-w-md text-center shadow-lg">
            <FileText size={40} className="text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">لم تقم بإجراء أي امتحانات بعد</h3>
            <p className="text-gray-600 dark:text-white/70 mb-4">ابدأ رحلتك التعليمية وقم بحل بعض الامتحانات لتتمكن من رؤية تقدمك وتحليل أدائك</p>
            <button
              onClick={() => window.location.href = '/Courses'}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors text-white"
            >
              استكشف الدورات والامتحانات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative    transition-colors duration-300" dir="rtl">
       <div className="relative z-20 p-6 text-gray-900 dark:text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
              <p className="text-gray-600 dark:text-white/60">{course.studentName} • {course.studentEmail}</p>
            </div>
            <div className="bg-white/80 border-gray-200 dark:bg-purple-900/30 dark:border-white/10 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-white/60 text-sm">المستوى الحالي:</span>
                <span className={`font-bold ${getLevelColor()}`}>{course.level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-white/10 pb-2">
          <button
            className={`px-4 py-2 ${activeTab === 'overview' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' : 'text-gray-600 dark:text-white/70'}`}
            onClick={() => setActiveTab('overview')}
          >
            نظرة عامة
          </button>

          <button
            className={`px-4 py-2 ${activeTab === 'exams' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' : 'text-gray-600 dark:text-white/70'}`}
            onClick={() => setActiveTab('exams')}
          >
            الامتحانات
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress summary card */}
              <div className="  border-gray-200 hover:border-purple-400 dark:bg-gradient-to-br dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-white/10 dark:hover:border-purple-500/30 backdrop-blur-sm rounded-xl p-6 border transition-all shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <PieChart size={20} className="text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">تقدمك الإجمالي</h3>
                </div>

                <div className="flex justify-center py-4">
                  <div className="relative h-36 w-36 flex items-center justify-center">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={isDarkMode ? "#1f2937" : "#e5e7eb"}
                        strokeWidth="10"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${course.progress * 2.83} ${283 - course.progress * 2.83}`}
                        strokeDashoffset="70.75" // 283/4 to start at top
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{course.progress}%</span>
                      <span className="text-xs text-gray-600 dark:text-white/60">مكتمل</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-gray-600 dark:text-white/70 text-sm">متبقي {100 - course.progress}% لإكمال المستوى</p>
                </div>
              </div>

              {/* advice card */}
              <div className="max-w-md h-full mx-auto">
                <div className="  border-gray-200 hover:border-emerald-400  dark:bg-gradient-to-br dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-white/10 dark:hover:border-emerald-500/30 backdrop-blur-sm rounded-xl p-6 border transition-all shadow-lg h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Lightbulb size={20} className="text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{todayAdvice.title}</h3>
                  </div>

                  <div className="py-4">
                    <p className="text-gray-700 dark:text-white/80 leading-relaxed text-right mb-6">{todayAdvice.content}</p>

                    <div className="flex flex-wrap gap-2 justify-end mt-4">
                      {todayAdvice.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>



              {/* Skills radar card */}

              <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Brain size={20} className="text-purple-300" />
                  </div>
                  <h3 className="font-bold text-lg">ركز علي الحاجات دي</h3>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                      <PolarGrid stroke="#3f3f46" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Radar
                        name="المهارات"
                        dataKey="value"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Progress chart */}
            <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <BarChart size={20} className="text-purple-300" />
                </div>
                <h3 className="font-bold text-lg">تقدمك اليومي</h3>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={course.progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="day" tick={{ fill: '#a1a1aa' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#a1a1aa' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        borderColor: '#4c1d95',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                      formatter={(value) => [`${value}%`, 'التقدم']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 6 }}
                      activeDot={{ r: 8, fill: '#c4b5fd' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time distribution and upcoming events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam distribution */}

              <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <FileText size={20} className="text-purple-300" />
                  </div>
                  <h3 className="font-bold text-lg">آخر الامتحانات</h3>
                </div>

                <div className="space-y-4">
                  {studentData.results.slice(-3).reverse().map((exam, index) => {
                    const score = Math.round(exam.correctAnswers / exam.totalQuestions * 100) || 0;
                    const examDate = new Date(exam.examDate);
                    const formattedDate = examDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          <div>
                            <h4 className="font-medium">{exam.examTitle}</h4>
                            <p className="text-sm text-white/60">{formattedDate}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs ${score >= 70 ? 'bg-green-500/20 text-green-300' :
                          score >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                          {score}%
                        </div>
                      </div>
                    );
                  })}
                </div>


              </div>

              {/* Upcoming events */}
              <MemoryGame></MemoryGame>
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="text-purple-400" />
              الامتحانات
            </h3>

            {studentData.results && studentData.results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.latestExams.map((exam, index) => {
                  const score = Math.round(exam.correctAnswers / exam.totalQuestions * 100);

                  return (
                    <div key={exam._id} className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-all">
                          <FileText size={24} className="text-purple-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                              {exam.examTitle}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                              <span className="text-green-300">مكتمل</span>
                            </span>
                          </div>

                          <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between text-white/70 text-sm">
                              <div className="flex items-center gap-1">
                                <AlertCircle size={14} />
                                <span>{exam.totalQuestions} سؤال</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>المحاولة {exam.attemptNumber}</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">النتيجة:</span>
                                <span className={`font-bold ${score >= 70 ? 'text-green-300' : score >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>
                                  {score}%
                                </span>
                              </div>
                              <button className="text-xs flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all">
                                <Download size={12} />
                                <span>عرض التفاصيل</span>
                              </button>
                            </div>

                            <div className="w-full bg-white/10 h-2 rounded-full mt-2">
                              <div
                                className={`h-2 rounded-full ${score >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                  score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                    'bg-gradient-to-r from-red-500 to-red-400'
                                  }`}
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>

                            <div className="flex justify-between text-xs text-white/60">
                              <span>0%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <p>لا توجد نتائج امتحانات متاحة حالياً</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}