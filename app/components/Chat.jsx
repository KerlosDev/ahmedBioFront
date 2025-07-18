import { FaWhatsapp, FaTelegram } from 'react-icons/fa';

export default function ContactButtons() {
  return (
    <div className="min-h-screen text-white flex items-center justify-center ">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:border-white/30 transition-all max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">تواصل معنا</h2>
        
        <div className="space-y-4">
         
          
          <a 
            href="https://t.me/Ahmdology" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-xl text-blue-400 transition-all w-full group"
          >
            <FaTelegram className="text-2xl group-hover:scale-110 transition-transform" />
            <span className="font-medium">تواصل عبر تليجرام</span>
          </a>
        </div>
      </div>
    </div>
  );
}