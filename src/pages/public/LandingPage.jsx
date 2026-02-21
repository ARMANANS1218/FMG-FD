import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import LaserFlow from "../../components/effects/LaserFlow";
import { ArrowRight, Users, BarChart3, Shield, Sun, Moon } from "lucide-react";
import ColorModeContext from '../../context/ColorModeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  return (
    <div className="relative w-full min-h-screen bg-background overflow-hidden transition-colors duration-300">

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleColorMode}
          className="p-3 rounded-full bg-card/30 backdrop-blur-md border border-border 
                     text-foreground hover:bg-card/50 transition-all shadow-lg cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      {/* Laser Background */}
      <div className={`fixed inset-0 z-0 ${isDark ? "opacity-50" : "opacity-70"}`}>
        <LaserFlow
          className="w-screen h-svh translate-x-16"
          horizontalBeamOffset={0.05}
          color={isDark ? "#F97316" : "#7C3AED"}
          flowSpeed={0.45}
          verticalSizing={3.2}
          fogIntensity={isDark ? 0.8 : 1.0}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 z-10 bg-gradient-to-b 
                      from-background/60 via-background/40 to-background/85 pointer-events-none" />

      {/* CONTENT */}
      <div className="relative z-20 flex flex-col items-center 
                      justify-start min-h-screen px-6 pt-36 pb-24">

        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center font-extrabold leading-tight mb-6 drop-shadow-xl"
        >
          <span className={`text-4xl sm:text-5xl md:text-6xl block ${
            isDark ? "text-white" : "text-black"
          }`}>
            Welcome to
          </span>

          {/* Glowing Animated BITMAX Name */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className={`text-5xl sm:text-6xl md:text-7xl 
                       bg-clip-text text-transparent 
                       font-extrabold tracking-tight block mt-3 ${
              isDark 
                ? "bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 drop-shadow-[0_0_25px_rgba(249,115,22,0.7)]" 
                : "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 drop-shadow-[0_0_25px_rgba(124,58,237,0.7)]"
            }`}
          >
            BITMAX LIVE CHAT CRM
          </motion.span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-muted-foreground text-lg sm:text-xl text-center max-w-2xl"
        >
          A unified platform for real-time support, advanced analytics,
          and intelligent team collaboration.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-4xl px-2"
        >
          {[
            {
              title: "Live Chat Support",
              icon: <Users className={`w-9 h-9 mx-auto mb-3 ${isDark ? "text-orange-400" : "text-violet-500"}`} />,
              desc: "Real-time messaging with instant customer engagement"
            },
            {
              title: "Query Resolution",
              icon: <BarChart3 className={`w-9 h-9 mx-auto mb-3 ${isDark ? "text-red-400" : "text-purple-500"}`} />,
              desc: "Smart ticket system for tracking & resolving issues"
            },
            {
              title: "Ticket Management",
              icon: <Shield className={`w-9 h-9 mx-auto mb-3 ${isDark ? "text-pink-400" : "text-fuchsia-500"}`} />,
              desc: "Organized workflow with priority & status tracking"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="bg-card/5 backdrop-blur-lg border border-border p-5 
                         rounded-xl text-center shadow-lg hover:shadow-primary/20 
                         transition-all duration-300 cursor-pointer"
            >
              {item.icon}
              <h3 className="text-foreground font-semibold text-lg">{item.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.7 }}
          onClick={() => navigate("/login")}
          className={`group relative mt-14 px-10 py-4 text-white text-lg 
                     font-semibold rounded-full shadow-xl 
                     hover:scale-105 transition-all duration-300 flex items-center gap-3 ${
            isDark 
              ? "bg-gradient-to-r from-orange-600 to-red-600" 
              : "bg-gradient-to-r from-violet-600 to-purple-600"
          }`}
        >
          <span>GET STARTED</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all duration-300" />

          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-full opacity-0 
                          group-hover:opacity-30 blur-xl transition-all duration-300 ${
            isDark 
              ? "bg-gradient-to-r from-orange-400 to-red-400" 
              : "bg-gradient-to-r from-violet-400 to-purple-400"
          }`} />
        </motion.button>

        {/* Bottom Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-8 text-muted-foreground text-sm"
        >
          Empower your team • Resolve queries faster • Scale effortlessly
        </motion.p>
      </div>

      {/* Decorative Glow Blobs */}
      <div className={`hidden md:block absolute top-10 right-20 
                      w-48 h-48 rounded-full blur-3xl ${
        isDark ? "bg-orange-500/20" : "bg-violet-500/20"
      }`} />
      <div className={`hidden md:block absolute bottom-16 left-16 
                      w-40 h-40 rounded-full blur-3xl ${
        isDark ? "bg-red-500/20" : "bg-purple-500/20"
      }`} />
    </div>
  );
}
