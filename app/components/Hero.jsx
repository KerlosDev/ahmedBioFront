'use client';
import React, { useState, useEffect } from 'react';
import { FaLightbulb, FaStar, FaGraduationCap, FaUsers, FaTrophy, FaPlay, FaLeaf, FaMicroscope, FaFlask } from "react-icons/fa";
import { GiTakeMyMoney, GiDna2, GiMicroscope, GiPlantSeed } from "react-icons/gi";
import { FaCalculator, FaSquareRootAlt, FaInfinity, FaChartLine, FaPrint, FaQuoteLeft, FaAward } from "react-icons/fa";
import { MdFunctions, MdVideoLibrary, MdSchool, MdBiotech } from "react-icons/md";
import { TbMathSymbols, TbMathIntegral, TbCertificate, TbDna } from "react-icons/tb";
import { BsCheckCircleFill } from "react-icons/bs";
import Link from 'next/link';
import styles from './Hero.module.css';

const Hero = () => {
    return (
        <div className="relative min-h-screen py-8 sm:py-12 px-2 sm:px-4 overflow-hidden">            {/* Enhanced Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-10 w-40 h-40 bg-blue-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-float">
                    <FaLeaf className="text-6xl text-blue-500/50 animate-spin-slow" />
                </div>
                <div className="absolute top-40 left-20 w-48 h-48 bg-red-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-float-delayed">
                    <GiMicroscope className="text-7xl text-red-500/50 animate-bounce" />
                </div>
                {/* New decorative elements */}
                <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-yellow-500/10 backdrop-blur-3xl rounded-full 
                              flex items-center justify-center animate-pulse">
                    <GiDna2 className="text-5xl text-yellow-500/50 animate-spin" />
                </div>
                <div className="absolute inset-0 opacity-10   bg-repeat mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-center">
                    {/* Image Section - Moved to top for mobile */}
                    <div className="relative order-1 lg:order-1 -mt-4 sm:mt-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-red-500/30 
                                      rounded-full blur-3xl transform -rotate-6 animate-pulse"></div>                        <div className="relative">
                            <img
                                src="/sha.png"
                                className="relative z-10 w-full h-[500px] sm:h-auto max-w-lg mx-auto 
                                         object-contain sm:object-cover drop-shadow-2xl 
                                         hover:scale-102 transition-transform duration-300"
                                alt="Ahmed Image"
                            />
                        </div>
                    </div>

                    {/* Content Section - Adjusted for mobile */}
                    <div className="relative z-10 order-2 lg:order-2 space-y-3 sm:space-y-4 lg:space-y-8 px-2 sm:px-0">                        {/* Title Section */}
                        <div dir='rtl' className="relative">
                            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl 
                                          p-4 sm:p-6 lg:p-8 rounded-3xl border border-blue-500/30 
                                          shadow-2xl hover:shadow-3xl transition-all duration-500
                                          hover:border-blue-400/50 group">

                                {/* Decorative elements */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 
                                              rounded-full animate-pulse"></div>
                                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-yellow-500 to-red-500 
                                              rounded-full animate-bounce"></div>

                                {/* Teacher's Name */}
                                <div className="flex flex-col items-center sm:items-start gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 
                                                      rounded-full flex items-center justify-center group-hover:scale-110 
                                                      transition-transform duration-300">
                                            <FaMicroscope className="text-2xl text-blue-600 animate-spin-slow" />
                                        </div>
                                        <h1 className={styles.teacherName}>
                                            احمد السيد                                        </h1>                                        <div className="hidden sm:flex w-12 h-12 bg-gradient-to-br from-yellow-500/30 to-red-500/30 
                                                      rounded-full items-center justify-center group-hover:scale-110 
                                                      transition-transform duration-300">
                                            <FaFlask className="text-2xl text-yellow-600 animate-pulse" />
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Titles */}
                                <div className="space-y-3">
                                    {/*   <div className="flex justify-center sm:justify-start items-center gap-3">
                                        <FaAward className="text-2xl text-yellow-500 animate-bounce" />
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-arabicUI3 
                                                     bg-gradient-to-l from-purple-600 via-blue-600 to-cyan-600 
                                                     bg-clip-text text-transparent font-bold">
                                            خبير الرياضيات الأول والمعلم المتميز
                                        </h2>
                                        <MdSchool className="text-2xl text-blue-500 animate-pulse" />
                                    </div>*/}


                                    <div className="flex justify-center sm:justify-start items-center gap-2">
                                        <FaTrophy className="text-yellow-500 text-lg animate-spin-slow" />
                                        <span className="text-base sm:text-lg font-arabicUI3 
                                                       text-slate-700 dark:text-slate-300">
                                            مدرس الاحياء والجيولوجيا  بخبرة +3 سنوات                                        </span>
                                    </div>
                                </div>

                                {/* Achievement badges */}
                                <div className="flex justify-center sm:justify-start items-center gap-4 mt-4 flex-wrap">
                                    <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/40">
                                        <FaGraduationCap className="text-blue-600 text-sm" />
                                        <span className="text-sm font-arabicUI3 text-blue-700 dark:text-blue-300">اولي ثانوي </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/40">
                                        <FaUsers className="text-green-600 text-sm" />
                                        <span className="text-sm font-arabicUI3 text-green-700 dark:text-green-300">تانية ثانوي</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/40">
                                        <FaStar className="text-purple-600 text-sm animate-pulse" />
                                        <span className="text-sm font-arabicUI3 text-purple-700 dark:text-purple-300">تالتة ثانوي</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rest of the content sections with mobile optimizations */}
                        <div dir='rtl' className="relative group">
                            <div className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 
                                          p-4 sm:p-6 lg:p-8 rounded-3xl border border-red-500/30 
                                          backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500
                                          hover:border-red-400/50">

                                {/* Decorative line */}
                                <div className="absolute -right-2 top-0 w-1 h-full bg-gradient-to-b 
                                              from-red-500 via-orange-500 to-yellow-500 rounded-full"></div>

                                {/* Welcome message */}
                                <div className="mb-6">
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-arabicUI3 
                                                 text-slate-800 dark:text-slate-200 mb-2">
                                        أهلاً بدفعة{' '}
                                        <span className={styles.year2026}>
                                            2026
                                        </span>
                                    </h1>
                                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                                        <FaChartLine className="text-3xl text-blue-500 animate-pulse" />
                                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-arabicUI3 
                                                     text-slate-600 dark:text-slate-300">
                                            شرح الاحياء بالنظام الجديد                                        </h3>
                                        <MdVideoLibrary className="text-3xl text-green-500 animate-bounce" />
                                    </div>
                                </div>

                                {/* Enhanced feature grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="group/item relative bg-gradient-to-br from-blue-500/20 to-blue-600/30 
                                                  p-4 rounded-2xl border border-blue-500/40 
                                                  hover:scale-105 transition-all duration-300 hover:shadow-lg">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center
                                                          group-hover/item:animate-spin">
                                                <GiDna2 className="text-2xl text-blue-500" />
                                            </div>
                                            <span className="text-sm font-arabicUI3 text-blue-700 dark:text-blue-300 font-semibold">
                                                حلول تفاعلية متقدمة
                                            </span>

                                        </div>
                                    </div>

                                    <div className="group/item relative bg-gradient-to-br from-red-500/20 to-red-600/30 
                                                  p-4 rounded-2xl border border-red-500/40 
                                                  hover:scale-105 transition-all duration-300 hover:shadow-lg">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center
                                                          group-hover/item:animate-bounce">
                                                <MdBiotech className="text-2xl text-red-500" />
                                            </div>
                                            <span className="text-sm font-arabicUI3 text-red-700 dark:text-red-300 font-semibold">
                                                شرح مبسط وواضح
                                            </span>

                                        </div>
                                    </div>

                                    <div className="group/item relative bg-gradient-to-br from-green-500/20 to-green-600/30 
                                                  p-4 rounded-2xl border border-green-500/40 
                                                  hover:scale-105 transition-all duration-300 hover:shadow-lg
                                                  sm:col-span-2 lg:col-span-1">
                                        <div className="flex flex-col items-center text-center space-y-2">
                                            <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center
                                                          group-hover/item:animate-pulse">
                                                <GiPlantSeed className="text-2xl text-green-500" />
                                            </div>
                                            <span className="text-sm font-arabicUI3 text-green-700 dark:text-green-300 font-semibold">
                                                أمثلة متنوعة شاملة
                                            </span>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Quote and Promotional sections - Hide some decorative elements on mobile */}
                        <div className="hidden sm:block">
                            <div dir='rtl' className="relative group px-2 sm:px-4">
                                {/* Animated background with molecule pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-red-500/20 to-orange-500/20 
                                          blur-2xl transform group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0   bg-repeat opacity-5 mix-blend-overlay"></div>
                                </div>


                            </div>
                        </div>


                        {/* Promotional Banner - Enhanced for all screens */}
                        {/* <div dir='rtl' className="relative group">
                            <div className="bg-gradient-to-br from-yellow-500/20 to-red-500/20 p-4 sm:p-6 rounded-2xl 
                                          border border-yellow-500/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                                <div className="flex flex-col sm:flex-row items-center gap-4">                                    <div className="flex-1 space-y-2">
                                    <h3 className="text-xl sm:text-2xl font-arabicUI2 text-yellow-600 dark:text-yellow-400">
                                        احصل على كتاب الرياضيات الآن!
                                    </h3>
                                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                                        كتاب شامل يغطي جميع المواضيع بأسلوب سهل وممتع
                                    </p>
                                </div>
                                    <Link
                                        href="/book-order"
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full 
                                                 font-arabicUI3 text-lg transition-colors duration-300 
                                                 flex items-center gap-2"
                                    >
                                        <span>اطلب الآن</span>
                                        <GiTakeMyMoney className="text-xl" />
                                    </Link>
                                </div>
                            </div>
                        </div>*/}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
