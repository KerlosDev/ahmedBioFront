'use client';

import React, { useState, useEffect } from 'react';
import lessonsData from '../data/Lessons (3).json';
import unitsData from '../data/Units (1).json';
import solutionsData from '../data/Solutions.json';

const DataMapPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');

    // Filter lessons based on search and filters
    const filteredLessons = lessonsData.filter(lesson => {
        const matchesSearch = lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lesson.explain.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStage = selectedStage === 'all' || lesson.stage === selectedStage;
        const matchesSection = selectedSection === 'all' || lesson.section.toString() === selectedSection;

        return matchesSearch && matchesStage && matchesSection;
    });

    // Filter units based on search and filters
    const filteredUnits = unitsData.filter(unit => {
        const matchesSearch = unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            unit.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStage = selectedStage === 'all' || unit.stage === selectedStage;

        return matchesSearch && matchesStage;
    });

    // Filter solutions/exams based on search and filters
    const filteredSolutions = solutionsData.filter(solution => {
        const matchesSearch = solution.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStage = selectedStage === 'all' || solution.stage === selectedStage;
        const matchesUnit = selectedSection === 'all' || solution.unit === selectedSection;

        return matchesSearch && matchesStage && matchesUnit;
    });

    // Get unique stages and sections for filters
    const stages = [...new Set(lessonsData.map(lesson => lesson.stage))];
    const sections = [...new Set(lessonsData.map(lesson => lesson.section.toString()))].sort((a, b) => parseInt(a) - parseInt(b));

    // Function to convert solutions data to examModel format
    const convertToExamModelFormat = () => {
        const examModelData = solutionsData.map(solution => {
            // Extract questions from all sections
            const questions = [];

            if (solution.sections && Array.isArray(solution.sections)) {
                solution.sections.forEach(section => {
                    if (section.questions && Array.isArray(section.questions)) {
                        section.questions.forEach(question => {
                            // Convert question format to examModel structure
                            // Map Arabic letters to English letters for correctAnswer
                            const arabicToEnglishMap = {
                                'أ': 'a', 'ا': 'a',
                                'ب': 'b',
                                'ج': 'c',
                                'د': 'd'
                            };

                            const examQuestion = {
                                title: question.question.includes('http') ?
                                    `Question ${question.number + 1}` : // For image questions, use generic title
                                    question.question || `Question ${question.number + 1}`,
                                options: {
                                    a: question.choices && question.choices[0] ? question.choices[0] : "أ",
                                    b: question.choices && question.choices[1] ? question.choices[1] : "ب",
                                    c: question.choices && question.choices[2] ? question.choices[2] : "ج",
                                    d: question.choices && question.choices[3] ? question.choices[3] : "د"
                                },
                                correctAnswer: arabicToEnglishMap[question.modelAnswer] || question.modelAnswer || "a",
                                imageUrl: question.question.includes('http') ? question.question : null
                            };
                            questions.push(examQuestion);
                        });
                    }
                });
            }

            return {
                title: solution.name || `Exam ${solution.number}`,
                duration: solution.fullDegree ? solution.fullDegree * 2 : 30, // Estimate 2 minutes per question
                questions: questions
            };
        });

        return examModelData;
    };

    // Function to convert data to course module format
    const convertToCourseModuleFormat = () => {
        // Group lessons by stage to create different courses
        const coursesByStage = lessonsData.reduce((acc, lesson) => {
            if (!acc[lesson.stage]) {
                acc[lesson.stage] = [];
            }
            acc[lesson.stage].push(lesson);
            return acc;
        }, {});

        // Create courses based on stages
        const courses = Object.entries(coursesByStage).map(([stage, lessons]) => {
            // Group lessons by section to create chapters
            const chaptersBySection = lessons.reduce((acc, lesson) => {
                if (!acc[lesson.section]) {
                    acc[lesson.section] = [];
                }
                acc[lesson.section].push(lesson);
                return acc;
            }, {});

            // Create chapters
            const chapters = Object.entries(chaptersBySection).map(([section, sectionLessons]) => {
                const chapterLessons = sectionLessons.map(lesson => ({
                    title: lesson.name,
                    videoUrl: lesson.explain || "", // Using explain field as video URL or description
                    fileName: `lesson-${lesson.number}`,
                    fileUrl: lesson.image === "@/assets/imgs/lesson-cover.png" ? "" : lesson.image || ""
                }));

                return {
                    title: `Section ${section}`,
                    lessons: chapterLessons
                };
            });

            // Get stage name based on stage number
            const getStageLevel = (stageNum) => {
                switch (stageNum) {
                    case "1": return "الصف الأول الثانوي";
                    case "2": return "الصف الثاني الثانوي";
                    case "3":
                    case "6": // Based on your data, 6 seems to be third year
                    default: return "الصف الثالث الثانوي";
                }
            };

            // Find related exams for this stage
            const stageExams = solutionsData
                .filter(solution => solution.stage === stage)
                .map(solution => solution._id);

            // Calculate course price based on related units
            const relatedUnits = unitsData.filter(unit => unit.stage === stage);
            const averagePrice = relatedUnits.length > 0
                ? Math.round(relatedUnits.reduce((sum, unit) => sum + unit.price, 0) / relatedUnits.length)
                : 100;

            // Determine if course should be free (if all related lessons are free)
            const paidLessonsCount = lessons.filter(lesson => lesson.paid).length;
            const isFree = paidLessonsCount === 0;

            return {
                name: `Biology Course - Stage ${stage}`,
                description: `Complete biology course for stage ${stage} including ${lessons.length} lessons across ${chapters.length} chapters`,
                imageUrl: "https://example.com/course-cover.jpg", // You may want to customize this
                price: isFree ? 0 : averagePrice,
                isFree: isFree,
                level: getStageLevel(stage),
                chapters: chapters, // In real implementation, these would be ObjectIds referencing Chapter documents
                exams: stageExams, // In real implementation, these would be ObjectIds referencing Exam documents
                isDraft: false
            };
        });

        return courses;
    };

    // Function to download course data as JSON
    const downloadCourseData = () => {
        const courseData = convertToCourseModuleFormat();
        const dataStr = JSON.stringify(courseData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `course-module-data-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Function to download exam data as JSON
    const downloadExamData = () => {
        const examData = convertToExamModelFormat();
        const dataStr = JSON.stringify(examData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `exam-data-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    // Calculate statistics
    const stats = {
        totalLessons: lessonsData.length,
        totalUnits: unitsData.length,
        totalExams: solutionsData.length,
        totalQuestions: solutionsData.reduce((sum, solution) => {
            return sum + (solution.sections?.reduce((secSum, section) => secSum + (section.questions?.length || 0), 0) || 0);
        }, 0),
        paidLessons: lessonsData.filter(lesson => lesson.paid).length,
        freeLessons: lessonsData.filter(lesson => !lesson.paid).length,
        activeUnits: unitsData.filter(unit => unit.active).length,
        completedExams: solutionsData.filter(solution => solution.done).length,
        averageExamScore: solutionsData.length > 0 ? Math.round(
            solutionsData.reduce((sum, solution) => sum + (solution.totalDegree || 0), 0) / solutionsData.length
        ) : 0,
        totalPrice: unitsData.reduce((sum, unit) => sum + unit.price, 0),
        averagePrice: Math.round(unitsData.reduce((sum, unit) => sum + unit.price, 0) / unitsData.length),
        stages: stages.length,
        sections: sections.length
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <h1 className="text-3xl font-bold text-gray-900">Educational Data Map</h1>
                        <p className="mt-2 text-gray-600">Complete overview of lessons and course units</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'lessons', label: 'Lessons' },
                            { id: 'units', label: 'Course Units' },
                            { id: 'exams', label: 'Exams & Solutions' },
                            { id: 'analytics', label: 'Analytics' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">L</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Lessons</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">U</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Course Units</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">E</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Exams</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">$</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Value</p>
                                        <p className="text-2xl font-bold text-gray-900">${stats.totalPrice}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">Q</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Questions</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Lesson Distribution</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Paid Lessons</span>
                                        <span className="text-sm font-medium">{stats.paidLessons} ({Math.round(stats.paidLessons / stats.totalLessons * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Free Lessons</span>
                                        <span className="text-sm font-medium">{stats.freeLessons} ({Math.round(stats.freeLessons / stats.totalLessons * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Stages</span>
                                        <span className="text-sm font-medium">{stats.stages}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Sections</span>
                                        <span className="text-sm font-medium">{stats.sections}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Overview</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Completed Exams</span>
                                        <span className="text-sm font-medium">{stats.completedExams} ({Math.round(stats.completedExams / Math.max(stats.totalExams, 1) * 100)}%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Questions</span>
                                        <span className="text-sm font-medium">{stats.totalQuestions}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Average Score</span>
                                        <span className="text-sm font-medium">{stats.averageExamScore}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Auto-Corrected</span>
                                        <span className="text-sm font-medium">{solutionsData.filter(s => s.autoCorrect).length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Units Overview</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Average Price</span>
                                        <span className="text-sm font-medium">${stats.averagePrice}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Highest Price</span>
                                        <span className="text-sm font-medium">${Math.max(...unitsData.map(u => u.price))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Lowest Price</span>
                                        <span className="text-sm font-medium">${Math.min(...unitsData.map(u => u.price))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Active Units</span>
                                        <span className="text-sm font-medium">{Math.round(stats.activeUnits / stats.totalUnits * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lessons Tab */}
                {activeTab === 'lessons' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search lessons..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                                    <select
                                        value={selectedStage}
                                        onChange={(e) => setSelectedStage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Stages</option>
                                        {stages.map(stage => (
                                            <option key={stage} value={stage}>Stage {stage}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Sections</option>
                                        {sections.map(section => (
                                            <option key={section} value={section}>Section {section}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="text-sm text-gray-600">
                                        Showing {filteredLessons.length} of {lessonsData.length} lessons
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lessons List */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage/Section</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredLessons.slice(0, 50).map((lesson) => (
                                            <tr key={lesson._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{lesson.name}</div>
                                                        {lesson.explain && (
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">{lesson.explain}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    Stage {lesson.stage} / Section {lesson.section}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    #{lesson.number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lesson.paid
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {lesson.paid ? 'Paid' : 'Free'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ${lesson.price || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(lesson.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredLessons.length > 50 && (
                                <div className="bg-gray-50 px-6 py-3 text-center">
                                    <p className="text-sm text-gray-600">Showing first 50 results. Use filters to narrow down results.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Units Tab */}
                {activeTab === 'units' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search units..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                                    <select
                                        value={selectedStage}
                                        onChange={(e) => setSelectedStage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Stages</option>
                                        {stages.map(stage => (
                                            <option key={stage} value={stage}>Stage {stage}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="text-sm text-gray-600">
                                        Showing {filteredUnits.length} of {unitsData.length} units
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Units Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUnits.map((unit) => (
                                <div key={unit._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                                    #{unit.number}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${unit.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {unit.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="text-lg font-bold text-gray-900">
                                                ${unit.price}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-medium text-gray-900 mb-2">{unit.name}</h3>

                                        {unit.description && (
                                            <p className="text-sm text-gray-600 mb-4">{unit.description}</p>
                                        )}

                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>Stage {unit.stage}</span>
                                            <span>{new Date(unit.createdAt).toLocaleDateString()}</span>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Tag: {unit.tag}</span>
                                            <span className="text-xs text-gray-500">
                                                Tasks: {unit.orderedTasks ? 'Ordered' : 'Unordered'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Exams & Solutions Tab */}
                {activeTab === 'exams' && (
                    <div className="space-y-6">
                        {/* Filters and Download Button */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search exams..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                                    <select
                                        value={selectedStage}
                                        onChange={(e) => setSelectedStage(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Stages</option>
                                        {stages.map(stage => (
                                            <option key={stage} value={stage}>Stage {stage}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="text-sm text-gray-600">
                                        Showing {filteredSolutions.length} of {solutionsData.length} exams
                                    </div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={downloadExamData}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Exams JSON
                                    </button>
                                    <button
                                        onClick={downloadCourseData}
                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Courses JSON
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Exams Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredSolutions.map((solution) => (
                                <div key={solution._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                                    #{solution.number}
                                                </span>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded ${solution.done
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {solution.done ? 'Completed' : 'Pending'}
                                                </span>
                                                {solution.autoCorrect && (
                                                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                                                        Auto-Correct
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {solution.totalDegree}/{solution.fullDegree}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {Math.round((solution.totalDegree / solution.fullDegree) * 100)}%
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-medium text-gray-900 mb-2">{solution.name}</h3>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-sm text-gray-600">Stage: </span>
                                                <span className="text-sm font-medium">{solution.stage}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Unit: </span>
                                                <span className="text-sm font-medium">{solution.unit}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Year: </span>
                                                <span className="text-sm font-medium">{solution.year}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Tries: </span>
                                                <span className="text-sm font-medium">{solution.tries}</span>
                                            </div>
                                        </div>

                                        {solution.sections && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Sections:</h4>
                                                <div className="space-y-2">
                                                    {solution.sections.map((section, index) => (
                                                        <div key={section._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                            <span className="text-sm text-gray-700">{section.text || `Section ${index + 1}`}</span>
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                {section.questions?.length || 0} questions
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>Language: {solution.lang === '1' ? 'Arabic' : 'English'}</span>
                                                <span>Type: {solution.isTask ? 'Task' : 'Exam'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Exam Statistics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Year</h3>
                                <div className="space-y-3">
                                    {[...new Set(solutionsData.map(s => s.year))].sort((a, b) => b - a).map(year => {
                                        const yearExams = solutionsData.filter(s => s.year === year);
                                        const avgScore = yearExams.length > 0
                                            ? Math.round(yearExams.reduce((sum, exam) => sum + (exam.totalDegree / exam.fullDegree * 100), 0) / yearExams.length)
                                            : 0;
                                        return (
                                            <div key={year} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <span className="font-medium">{year}</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{avgScore}% avg</div>
                                                    <div className="text-xs text-gray-500">{yearExams.length} exams</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Unit</h3>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {[...new Set(solutionsData.map(s => s.unit))].sort((a, b) => parseInt(a) - parseInt(b)).map(unit => {
                                        const unitExams = solutionsData.filter(s => s.unit === unit);
                                        const avgScore = unitExams.length > 0
                                            ? Math.round(unitExams.reduce((sum, exam) => sum + (exam.totalDegree / exam.fullDegree * 100), 0) / unitExams.length)
                                            : 0;
                                        return (
                                            <div key={unit} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm font-medium">Unit {unit}</span>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{avgScore}%</div>
                                                    <div className="text-xs text-gray-500">{unitExams.length} exams</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-200">
                                <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Export Information
                                </h3>
                                <div className="space-y-3 text-sm text-blue-800">
                                    <div className="bg-white p-3 rounded border border-blue-200">
                                        <div className="font-medium mb-2">Exam Model Format</div>
                                        <div className="text-blue-700">
                                            The downloaded JSON follows the examModel schema with:
                                        </div>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                            <li>title: Exam name</li>
                                            <li>duration: Estimated duration in minutes</li>
                                            <li>questions: Array with title, options (a,b,c,d), correctAnswer, imageUrl</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-green-200">
                                        <div className="font-medium mb-2 text-green-700">Course Module Format</div>
                                        <div className="text-green-700">
                                            The course JSON follows the courseModule schema with:
                                        </div>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                            <li>name: Course title based on stage</li>
                                            <li>description: Course overview with lesson count</li>
                                            <li>level: Academic level (الصف الأول/الثاني/الثالث الثانوي)</li>
                                            <li>chapters: Organized by sections with lessons</li>
                                            <li>price: Calculated from related units</li>
                                            <li>isFree: Based on lesson payment status</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-blue-200">
                                        <div className="font-medium text-green-700">
                                            Ready for MongoDB Import
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                            Direct import into your collections using mongoimport or your preferred method
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Section Distribution */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Lessons by Section</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {sections.slice(0, 20).map(section => {
                                    const sectionLessons = lessonsData.filter(lesson => lesson.section.toString() === section);
                                    return (
                                        <div key={section} className="border rounded-lg p-4">
                                            <div className="text-sm font-medium text-gray-900">Section {section}</div>
                                            <div className="text-2xl font-bold text-blue-600">{sectionLessons.length}</div>
                                            <div className="text-xs text-gray-500">
                                                {sectionLessons.filter(l => l.paid).length} paid / {sectionLessons.filter(l => !l.paid).length} free
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Price Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Unit Price Ranges</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Free (0)', range: [0, 0] },
                                        { label: 'Low ($1-100)', range: [1, 100] },
                                        { label: 'Medium ($101-200)', range: [101, 200] },
                                        { label: 'High ($201-300)', range: [201, 300] },
                                        { label: 'Premium ($300+)', range: [301, Infinity] }
                                    ].map(({ label, range }) => {
                                        const count = unitsData.filter(unit => unit.price >= range[0] && unit.price <= range[1]).length;
                                        const percentage = Math.round((count / unitsData.length) * 100);
                                        return (
                                            <div key={label} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{label}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium">{count} ({percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Creation Timeline</h3>
                                <div className="space-y-3">
                                    {[2025, 2024, 2023].map(year => {
                                        const yearLessons = lessonsData.filter(lesson =>
                                            new Date(lesson.createdAt).getFullYear() === year
                                        );
                                        const yearUnits = unitsData.filter(unit =>
                                            new Date(unit.createdAt).getFullYear() === year
                                        );
                                        return (
                                            <div key={year} className="border-l-4 border-blue-500 pl-4">
                                                <div className="text-sm font-medium text-gray-900">{year}</div>
                                                <div className="text-xs text-gray-600">
                                                    {yearLessons.length} lessons, {yearUnits.length} units
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Latest Items */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Lessons</h3>
                                <div className="space-y-3">
                                    {lessonsData
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .slice(0, 5)
                                        .map(lesson => (
                                            <div key={lesson._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                        {lesson.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Section {lesson.section} • {lesson.paid ? 'Paid' : 'Free'}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(lesson.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Units</h3>
                                <div className="space-y-3">
                                    {unitsData
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .slice(0, 5)
                                        .map(unit => (
                                            <div key={unit._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                        {unit.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ${unit.price} • {unit.active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(unit.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataMapPage;
