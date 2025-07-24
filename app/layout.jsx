import localFont from "next/font/local";
import "./globals.css";
const ArabicUI = localFont({ src: './fonts/DG-Gaza.ttf' })
const ArabicUI2 = localFont({ src: './fonts/LANTX.otf' })
const ArabicUI3 = localFont({ src: './fonts/Rubik.ttf' })
const ArabicUI4 = localFont({ src: './fonts/arabicc.otf' })
import { Anton } from 'next/font/google';


// Configure Anton font
const anton = Anton({
  subsets: ['latin'], // Include the subset you need
  weight: '400',      // Adjust weight if needed (Anton only has 400)
});

import { Rakkas } from 'next/font/google';

// Configure the font
const rakkas = Rakkas({
  subsets: ['latin'], // Choose the subset(s) you need
  weight: '400', // Specify the weight, if applicable
});
import { Abril_Fatface } from 'next/font/google';
import Footer from "./components/Footer";
import Header from "./components/Header";
import { SessionProvider } from "./components/SessionProvider";

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: '400', // Adjust based on the font options
});

export const metadata = {
  title: " احمد السيد احياء | Ahmed ElSayed Bio",
  description: " منصة تعليمية متخصصة في شرح منهج الأحياء لطلاب المرحلة الثانوية بأسلوب علمي ومنظم. يقدم الأستاذ أحمد السيد محتوى تعليمي شامل يشمل الشرح التفصيلي، المراجعات، وحلول الأسئلة، بهدف دعم الطالب لتحقيق أعلى الدرجات بأفضل الطرق.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`bg-gradient-to-br from-blue-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 antialiased`}
        style={{
          '--font-arabicUI': ArabicUI.style.fontFamily,
          '--font-arabicUI2': ArabicUI2.style.fontFamily,
          '--font-arabicUI3': ArabicUI3.style.fontFamily,
          '--font-arabicUI4': ArabicUI4.style.fontFamily,
          '--font-anton': anton.style.fontFamily,
          '--font-rakkas': rakkas.style.fontFamily,
          '--font-abril': abrilFatface.style.fontFamily,
        }}>
        <SessionProvider>
          <Header />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
