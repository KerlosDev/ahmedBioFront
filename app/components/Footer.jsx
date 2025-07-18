import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaTelegram, FaYoutube } from "react-icons/fa";
import { BsWhatsapp } from "react-icons/bs";
import { BiMath } from "react-icons/bi";
import { TbMathFunction, TbMathIntegral, TbMathPi } from "react-icons/tb";
import { FiInstagram } from 'react-icons/fi';

const Footer = () => {
    const quickLinks = [
        { name: "الرئيسية", href: "/" },
        { name: "كورساتي", href: "/profile?tab=courses" },
    ];

    const socials = [
        { icon: <FaYoutube size={24} />, href: "https://youtube.com/@hossammirah?si=okHxGI_hKoYzqUcc", label: "YouTube", color: "hover:text-red-500" },
        { icon: <FaFacebook size={24} />, href: "https://www.facebook.com/share/16hNBr3APE/?mibextid=wwXIfr", label: "Facebook", color: "hover:text-blue-500" },
        { icon: <FaTelegram size={24} />, href: "https://t.me/+ELVrCqJYCeZiYmVk", label: "Telegram", color: "hover:text-blue-500" },
        { icon: <FiInstagram size={24} />, href: "https://www.instagram.com/hossammirah", label: "Telegram", color: "hover:text-orange-500" },
    ];

    const mathSymbols = ['∑', '∫', 'π', '∞', '√', '∆', 'θ', 'α', 'β', 'γ']; return (
        <footer dir="rtl" className="relative bg-slate-900/95 font-arabicUI3 overflow-hidden border-t border-gray-800">
            {/* Subtle Mathematical Background */}
            <div className="absolute inset-0 opacity-3">
                <div className="absolute top-4 left-8 text-3xl text-blue-500/30">π</div>
                <div className="absolute top-6 right-12 text-2xl text-purple-500/30">∑</div>
                <div className="absolute bottom-4 left-12 text-2xl text-green-500/30">∫</div>
                <div className="absolute bottom-6 right-8 text-xl text-blue-500/30">∞</div>
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-8">
                {/* Main Content - Compact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">

                    {/* Brand Section - Compact */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                <TbMathFunction size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">د احمد السيد </h3>
                                <p className="text-blue-400 text-xs">منصة تعليم الاحياء</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            تعلم الاحياء بطريقة مبتكرة وممتعة مع د / احمد السيد   .
                        </p>
                    </div>

                    {/* Quick Links - Compact */}
                    <div className="space-y-3">
                        <h4 className="text-base font-semibold text-white flex items-center gap-2">
                            <TbMathIntegral size={16} className="text-blue-400" />
                            روابط سريعة
                        </h4>
                        <ul className="space-y-2">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm flex items-center gap-2 group"
                                    >
                                        <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"></span>
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact & Social - Compact */}
                    <div className="space-y-3">
                        <h4 className="text-base font-semibold text-white flex items-center gap-2">
                            <TbMathPi size={16} className="text-blue-400" />
                            تواصل معنا
                        </h4>
                        <div className="space-y-3">
                            <div className="text-gray-400 text-sm">
                                <a href="https://t.me/Hossammirah" dir='rtl' className="text-blue-400 hover:text-blue-300 transition-colors">
                                    تواصل تيليجرام
                                </a>
                            </div>

                            {/* Social Media - Compact */}
                            <div className="flex gap-3">
                                {socials.map((social, index) => (
                                    <a
                                        target='-blank'
                                        key={index}
                                        href={social.href}
                                        aria-label={social.label}
                                        className={`p-2 bg-gray-900/50 rounded-lg text-gray-400 ${social.color} 
                                                   transition-all duration-200 hover:scale-105 hover:bg-gray-800/50 
                                                   border border-gray-800 hover:border-gray-700`}
                                    >
                                        {React.cloneElement(social.icon, { size: 18 })}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Bottom Bar */}
                <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">
                        © {new Date().getFullYear()} منصة احمد السيد للاحياء - جميع الحقوق محفوظة
                    </p>

                    <a href="https://kerlos.site/"
                        className="group flex items-center gap-2 px-4 py-1 rounded-full 
                                   bg-gradient-to-r from-green-600/20 to-blue-600/20 
                                   border border-green-600/30 backdrop-blur-sm
                                   hover:from-green-600/30 hover:to-blue-600/30 
                                   transition-all duration-200 hover:scale-105">
                        <span className="text-sm font-medium text-blue-400">
                            by Kerlos Hany
                        </span>
                        <span className="animate-pulse text-red-500 text-sm">❤️</span>
                        <span className="text-xs font-medium text-green-400">
                            Developed with
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;