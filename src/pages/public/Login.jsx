import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  MessageSquare,
  Ticket,
  Clock,
  ShieldCheck,
  Users,
  BarChart3,
  FileText,
  Activity,
  Settings,
} from 'lucide-react';

import { useLoginUserMutation, useAcceptTermsMutation } from '../../features/auth/authApi';
import TermsContent from '../../components/TermsContent';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';
import { connectSocket } from '../../hooks/socket';
import ColorModeContext from '../../context/ColorModeContext';
import Loading from '../../components/common/Loading';
import loginBgLight from '../../assets/images/login_bg_light.jpg';
import loginBgDark from '../../assets/images/login_bg_dark.jpg';

export default function Login() {
  const navigate = useNavigate();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [acceptTerms] = useAcceptTermsMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [mode] = useState('employee');
  const [termsChecked, setTermsChecked] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { mode: themeMode, toggleColorMode } = useContext(ColorModeContext);
  const isDark = themeMode === 'dark';

  const validationSchema = Yup.object().shape({
    employee_id: Yup.string().notRequired(),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const getBrowserLocation = () =>
    new Promise((resolve) => {
      try {
        if (!navigator?.geolocation) return resolve(null);
        let best = null;
        let watchId = null;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (watchId != null) navigator.geolocation.clearWatch(watchId);
          resolve(best);
        };
        const onPos = (pos) => {
          const current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters:
              typeof pos.coords.accuracy === 'number' ? Math.round(pos.coords.accuracy) : undefined,
            timestamp: pos.timestamp || Date.now(),
          };
          if (!best || (current.accuracyMeters || 99999) < (best.accuracyMeters || 99999)) {
            best = current;
          }
          if ((current.accuracyMeters || 99999) <= 30) finish();
        };
        const onErr = () => finish();
        navigator.geolocation.getCurrentPosition(onPos, onErr, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
        watchId = navigator.geolocation.watchPosition(onPos, onErr, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
        setTimeout(finish, 8000);
      } catch (e) {
        resolve(null);
      }
    });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { employee_id: '', email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (mode === 'employee' && !termsChecked) {
          toast.warn('Please accept the Terms & Conditions to continue');
          return;
        }
        const payload =
          mode === 'employee'
            ? {
                ...(values.employee_id && values.employee_id.trim()
                  ? { employee_id: values.employee_id.trim() }
                  : {}),
                email: values.email,
                password: values.password,
              }
            : { email: values.email, password: values.password };

        let locToastId;
        if (mode === 'employee') {
          try {
            locToastId = toast.loading(' Fetching your location...', { closeOnClick: false });
          } catch {}
        }

        const coords = await getBrowserLocation();

        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
          if (coords.accuracyMeters != null) payload.accuracyMeters = coords.accuracyMeters;
          if (coords.timestamp) payload.locationTimestamp = coords.timestamp;

          if (mode === 'employee' && locToastId) {
            try {
              toast.update(locToastId, {
                render: ' Location fetched',
                type: 'success',
                isLoading: false,
                autoClose: 1500,
              });
            } catch {}
          }
        } else {
          if (mode === 'employee' && locToastId) {
            try {
              toast.dismiss(locToastId);
            } catch {}
          }
        }

        let ipToastId;
        try {
          if (mode === 'employee') {
            ipToastId = toast.loading(' Checking your IP access...', { closeOnClick: false });
          }
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          if (ipData?.ip) {
            payload.clientPublicIp = ipData.ip;
            if (mode === 'employee' && ipToastId) {
              try {
                toast.update(ipToastId, {
                  render: ` IP verified: ${ipData.ip}`,
                  type: 'success',
                  isLoading: false,
                  autoClose: 1500,
                });
              } catch {}
            }
          }
        } catch (ipErr) {
          if (mode === 'employee' && ipToastId) {
            try {
              toast.update(ipToastId, {
                render: ' IP check failed',
                type: 'warning',
                isLoading: false,
                autoClose: 1500,
              });
            } catch {}
          }
        }

        const res = await loginUser(payload).unwrap();
        const userId = res.data?._id || res?.data?.id;
        const token = res.token;

        localStorage.setItem('token', token);
        connectSocket({ token, id: userId });

        const roleRoutes = {
          Admin: '/admin',
          Agent: '/agent',
          QA: '/qa',
          TL: '/tl',
          Customer: '/customer',
          Management: '/management',
        };

        const employeeRoles = ['Admin', 'Agent', 'QA', 'TL', 'Management'];
        const role = res?.data?.role;
        if (employeeRoles.includes(role) && !res?.data?.acceptedTerms) {
          try {
            await acceptTerms().unwrap();
          } catch (e) {}
        }

        const redirectPath = roleRoutes[role];
        if (redirectPath) {
          toast.success(`${role} login successful!`);
          navigate(redirectPath);
        } else {
          toast.error('Access denied: Unauthorized role');
        }
      } catch (error) {
        try {
          toast.dismiss();
        } catch {}
        if (error?.status === 401) {
          toast.warning(error?.data?.message || 'Wrong password', { autoClose: 5000 });
        } else {
          toast.error(error?.data?.message || 'Login failed');
        }
      }
    },
  });

  const features = [
    { icon: MessageSquare, title: 'Live Chat', subtitle: 'Support' },
    { icon: Ticket, title: 'Tickets', subtitle: 'Management' },
    { icon: Clock, title: 'Attendance', subtitle: 'Tracking' },
    { icon: ShieldCheck, title: 'Secure', subtitle: 'Platform' },
    { icon: Users, title: 'Team Monitor', subtitle: 'Real-time' },
    { icon: BarChart3, title: 'Analytics', subtitle: 'Insights' },
    { icon: FileText, title: 'Reports', subtitle: 'Detailed' },
    { icon: Activity, title: 'Activity', subtitle: 'Logs' },
    { icon: Settings, title: 'Management', subtitle: 'Tools' },
  ];

  return (
    <>
      <div
        className={`min-h-screen flex items-center justify-center p-4 lg:p-8 transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-zinc-950 via-stone-900 to-orange-800'
            : 'bg-gradient-to-br from-indigo-50 via-violet-100 to-violet-400'
        }`}
      >
        <button
          onClick={toggleColorMode}
          className={`absolute top-6 right-6 p-3 rounded-full ${
            isDark
              ? 'bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800'
              : 'bg-white border border-gray-200 text-violet-600 hover:bg-gray-50'
          } shadow-lg transition-all duration-300 z-50`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-[1600px] aspect-video lg:aspect-[21/9] min-h-[700px] flex overflow-hidden rounded-3xl shadow-2xl border ${
            isDark ? 'bg-zinc-900/50 border-white/5' : 'bg-white/40 border-white/20'
          } backdrop-blur-xl`}
        >
          <div className="hidden lg:flex flex-col relative w-3/5 p-12 text-white">
            <div className="absolute inset-0 z-0">
              <img
                src={isDark ? loginBgDark : loginBgLight}
                alt="Login Background"
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              <div
                className={`absolute inset-0 ${isDark ? 'bg-black/30' : 'bg-violet-990/10'} mix-blend-multiply`}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-center gap-16">
              <Motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white/10 backdrop-blur-md inline-block px-4 py-1.5 rounded-full border border-white/10 mb-6">
                  <span className="text-sm font-medium tracking-wide">ENTERPRISE EDITION</span>
                </div>
                <h1 className="text-6xl font-black mb-4 tracking-tight drop-shadow-lg">
                  BITMAX CRM
                </h1>
                <p className="text-2xl text-white/90 font-light max-w-xl drop-shadow">
                  Complete Customer Relationship Management Platform
                </p>
              </Motion.div>

              <Motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="grid grid-cols-3 gap-4"
              >
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <Motion.div
                      key={feature.title}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="p-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <IconComponent className="w-6 h-6 mb-3 text-orange-400 group-hover:text-white transition-colors" />
                      <h3 className="font-bold text-sm text-white mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-300 group-hover:text-white/80">
                        {feature.subtitle}
                      </p>
                    </Motion.div>
                  );
                })}
              </Motion.div>
            </div>
          </div>

          <div
            className={`w-full lg:w-2/5 flex flex-col relative  ${
              isDark ? 'bg-zinc-900/60' : 'bg-white/60'
            } backdrop-blur-2xl p-6 lg:p-12 overflow-hidden`}
          >
            <div className="my-auto w-full max-w-md mx-auto">
              <div className="mb-10">
                <h2
                  className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  Sign In
                </h2>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Access your CRM dashboard
                </p>
              </div>

              <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Staff ID
                  </label>
                  <div className="relative group">
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500 group-focus-within:text-orange-500' : 'text-gray-400 group-focus-within:text-violet-600'} transition-colors`}
                    />
                    <input
                      name="employee_id"
                      type="text"
                      placeholder="Enter your staff ID"
                      value={formik.values.employee_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl font-medium outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-zinc-800/50 border-2 border-transparent focus:border-orange-500 text-white placeholder-gray-600 hover:bg-zinc-800'
                          : 'bg-white border-2 border-transparent focus:border-violet-500 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Email
                  </label>
                  <div className="relative group">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500 group-focus-within:text-orange-500' : 'text-gray-400 group-focus-within:text-violet-600'} transition-colors`}
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl font-medium outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-zinc-800/50 border-2 border-transparent focus:border-orange-500 text-white placeholder-gray-600 hover:bg-zinc-800'
                          : 'bg-white border-2 border-transparent focus:border-violet-500 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow'
                      }`}
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-500 text-xs pl-1">{formik.errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500 group-focus-within:text-orange-500' : 'text-gray-400 group-focus-within:text-violet-600'} transition-colors`}
                    />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full pl-12 pr-12 py-4 rounded-xl font-medium outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-zinc-800/50 border-2 border-transparent focus:border-orange-500 text-white placeholder-gray-600 hover:bg-zinc-800'
                          : 'bg-white border-2 border-transparent focus:border-violet-500 text-gray-900 placeholder-gray-400 shadow-sm hover:shadow'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded-full transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff
                          className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                        />
                      ) : (
                        <Eye className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-red-500 text-xs pl-1">{formik.errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className={`text-sm font-medium ${
                      isDark
                        ? 'text-orange-400 hover:text-orange-300'
                        : 'text-violet-600 hover:text-violet-700'
                    } transition-colors`}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="relative flex items-center h-6">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      className={`w-5 h-5 rounded border-2 ${
                        isDark
                          ? 'border-zinc-600 bg-zinc-800 checked:bg-orange-500 checked:border-orange-500'
                          : 'border-gray-300 checked:bg-violet-600 checked:border-violet-600'
                      } transition-all cursor-pointer`}
                    />
                  </div>
                  <label
                    htmlFor="terms"
                    className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className={`font-semibold underline underline-offset-2 ${
                        isDark
                          ? 'text-white hover:text-orange-400'
                          : 'text-gray-900 hover:text-violet-600'
                      } transition-colors`}
                    >
                      Terms & Conditions
                    </button>
                  </label>
                </div>

                <Motion.button
                  type="submit"
                  disabled={isLoading || !termsChecked}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl shadow-orange-900/10 ${
                    isDark
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Motion.button>
              </form>
            </div>
          </div>
        </Motion.div>
      </div>

      <AnimatePresence>
        {showTermsModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          >
            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white'
              }`}
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Terms of Service
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-1 rounded opacity-50 hover:opacity-100 transition"
                ></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <TermsContent />
              </div>
              <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Decline
                </button>
                <button
                  onClick={() => {
                    setTermsChecked(true);
                    setShowTermsModal(false);
                  }}
                  className={`px-5 py-2.5 rounded-lg font-medium text-white transition-colors ${
                    isDark
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-violet-600 hover:bg-violet-700'
                  }`}
                >
                  Accept & Continue
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <ForgotPasswordModal open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
      {isLoading && <Loading fullScreen={true} size="lg" />}
    </>
  );
}
