import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCheck,
  ShieldCheck,
  Bot,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface WhatsAppAssistantPreviewProps {
  onClose?: () => void;
  isLiveConfigured?: boolean;
}

export const WhatsAppAssistantPreview: React.FC<WhatsAppAssistantPreviewProps> = ({
  onClose,
  isLiveConfigured = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text:
        '🎓 *Welcome to CareerBridge – Your Career Companion!*\n\n' +
        'Choose what you want to explore:\n\n' +
        '*1.* Find Jobs & Internships (Reply *1* or *JOBS*)\n' +
        '*2.* My Applications (Reply *2* or *APPLICATIONS*)\n' +
        '*3.* Interview Updates (Reply *3* or *INTERVIEWS*)\n' +
        '*4.* My Profile (Reply *4* or *PROFILE*)\n' +
        '*5.* Skill Development (Reply *5* or *SKILLS*)\n' +
        '*6.* AI Career Guidance (Reply *6* or *GUIDANCE*)\n' +
        '*7.* Help & Support (Reply *7* or *HELP*)',
      timestamp: '10:30 AM',
    },
  ]);

  const [input, setInput] = useState('');

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Generate responsive assistant answer
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let reply = '';
      const normalized = query.toUpperCase();

      if (normalized === '1' || normalized === 'JOBS') {
        reply =
          '💼 *Active Placement Opportunities (Recent Drives)*\n\n' +
          '*1. Junior Cloud Engineer*\n' +
          '🏢 *Company:* Bharat Cloud Tech\n' +
          '📍 *Type:* JOB · Indore, MP\n' +
          '🛠️ *Skills:* AWS, Linux, Python\n' +
          '💰 *Package:* ₹3.6 - ₹4.5 LPA\n' +
          '⏳ *Deadline:* 30 Nov 2026\n\n' +
          '*2. Frontend Developer Trainee*\n' +
          '🏢 *Company:* TechBharat Labs\n' +
          '📍 *Type:* INTERNSHIP · Remote\n' +
          '🛠️ *Skills:* React, TypeScript, Tailwind\n' +
          '💰 *Stipend:* ₹15,000 / month\n\n' +
          '_Reply MENU to return to main menu._';
      } else if (normalized === '2' || normalized === 'APPLICATIONS') {
        reply =
          '📋 *My Applications (Live Status)*\n\n' +
          '*1. Junior Cloud Engineer*\n' +
          '🏢 Bharat Cloud Tech\n' +
          '📊 Status: ⭐ *SHORTLISTED*\n' +
          '📅 Applied: 20 Oct 2026\n\n' +
          '*2. Frontend Developer Trainee*\n' +
          '🏢 TechBharat Labs\n' +
          '📊 Status: ⏳ *UNDER REVIEW*\n\n' +
          '_View details on portal: https://careerbridge.in_';
      } else if (normalized === '3' || normalized === 'INTERVIEWS') {
        reply =
          '📅 *Upcoming Interviews*\n\n' +
          '*Technical Round 1: Bharat Cloud Tech*\n' +
          '🕒 Time: Friday, 14 Nov 2026 at 3:00 PM\n' +
          '🏢 Format: Virtual Google Meet\n' +
          '🔗 Link: https://meet.google.com/abc-xyz\n\n' +
          '_Log in to practice interview questions with your AI coach!_';
      } else if (normalized === '4' || normalized === 'PROFILE') {
        reply =
          '👤 *Student Career Profile*\n\n' +
          '*Course:* Diploma in Computer Engineering\n' +
          '*College:* Govt Polytechnic Ambikapur\n' +
          '*Profile Strength:* 85/100 (Job Ready)\n' +
          '*Skills:* React, Node.js, Git, Python\n\n' +
          '_Download your ATS Resume at careerbridge.in_';
      } else if (normalized === '5' || normalized === 'SKILLS') {
        reply =
          '🚀 *Skill Development & Assessments*\n\n' +
          'Top in-demand skills for Tier-2/3 placements:\n' +
          '- Full-Stack Web: React, Node.js, MongoDB\n' +
          '- Cloud & DevOps: Linux, Docker, AWS basics\n' +
          '- Core CS: Data Structures & Problem Solving\n\n' +
          'Take verified skill tests on CareerBridge to boost your recruiter shortlist rates!';
      } else if (normalized === '6' || normalized === 'GUIDANCE') {
        reply =
          '🤖 *AI Career Guidance Assistant*\n\n' +
          'Ask any question! For example:\n' +
          '- "What questions are asked in junior react interviews?"\n' +
          '- "How to explain diploma final year projects?"\n' +
          '- "Which free certifications add value to my resume?"';
      } else if (normalized === 'STOP') {
        reply =
          '🛑 *WhatsApp Notifications Paused*\n\nYou will not receive automated alerts. Reply *START* anytime to resume.';
      } else if (normalized === 'START') {
        reply = '✅ *Welcome Back!*\n\nYour notifications are active. Reply *MENU* to view options.';
      } else if (normalized === 'MENU') {
        reply =
          '🎓 *CareerBridge Menu*\n\n' +
          '*1.* Find Jobs & Internships\n' +
          '*2.* My Applications\n' +
          '*3.* Interview Updates\n' +
          '*4.* My Profile\n' +
          '*5.* Skill Development\n' +
          '*6.* AI Career Guidance\n' +
          '*7.* Help & Support';
      } else {
        reply =
          `💡 *AI Career Coach Advice:*\n\n` +
          `Great question regarding "${query}"! For entry-level technical roles in Tier-2/3 regions:\n\n` +
          `- Build 2 verified, full-stack projects showcasing clean database schemas and responsive UI.\n` +
          `- Practice explaining your code line-by-line.\n` +
          `- Add your GitHub and portfolio URL to your CareerBridge resume.\n\n` +
          `_Tip: Log in to CareerBridge for mock interview practice and milestone roadmaps!_`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          timestamp: replyTime,
        },
      ]);
    }, 400);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-100 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-300 flex flex-col h-[600px]">
        {/* WhatsApp Mobile Top Bar */}
        <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm">
              CB
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1">
                <span>CareerBridge</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
              </div>
              <div className="text-[10px] text-emerald-200">Official Business Account</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveConfigured && (
              <span className="text-[9px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                DEMO SIMULATOR
              </span>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notice Header */}
        <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-200 text-[10px] text-amber-900 text-center font-medium">
          Interactive WhatsApp Assistant Simulator · Test commands like <strong>JOBS</strong>, <strong>1</strong>, <strong>INTERVIEWS</strong>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#e5ddd5] bg-opacity-70">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-xs relative ${
                  m.sender === 'user'
                    ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                    : 'bg-white text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                  <span>{m.timestamp}</span>
                  {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Action Chips */}
        <div className="p-2 bg-white/90 border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-none">
          {['MENU', 'JOBS', 'APPLICATIONS', 'INTERVIEWS', 'GUIDANCE'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleSend(cmd)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 whitespace-nowrap cursor-pointer transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message or command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-full focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-[#075e54] text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
