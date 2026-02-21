import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Clock, AlertCircle, CheckCircle, LogIn, LogOut, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

// Convert fractional hours to HH:MM:SS for consistent display
const formatHoursToHMS = (hoursValue) => {
  const totalSeconds = Math.floor((hoursValue || 0) * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function AttendanceMark() {
  const [shifts, setShifts] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedShift, setSelectedShift] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [liveHours, setLiveHours] = useState(0);
  const [liveLabel, setLiveLabel] = useState('00:00:00');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchShifts();
    fetchTodayAttendance();
    fetchStats();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const formatDuration = (ms) => {
      if (!ms || ms <= 0) return { hours: 0, label: '00:00:00' };
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return { hours: Number((ms / (1000 * 60 * 60)).toFixed(2)), label };
    };

    const calculateLive = () => {
      if (!todayAttendance?.checkInTime) return { hours: 0, label: '00:00:00' };
      const start = new Date(todayAttendance.checkInTime).getTime();
      const end = todayAttendance.checkOutTime
        ? new Date(todayAttendance.checkOutTime).getTime()
        : Date.now();
      if (isNaN(start) || isNaN(end) || end <= start) return { hours: 0, label: '00:00:00' };
      return formatDuration(end - start);
    };

    const updateLive = () => {
      const { hours, label } = calculateLive();
      setLiveHours(hours);
      setLiveLabel(label);
    };

    updateLive();
    const interval = setInterval(updateLive, 1000);
    return () => clearInterval(interval);
  }, [todayAttendance]);

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/shift`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShifts(response.data.shifts || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Today Attendance Data:', response.data.attendance);
      console.log('Check-in Image:', response.data.attendance?.checkInImage);
      console.log('Check-out Image:', response.data.attendance?.checkOutImage);
      setTodayAttendance(response.data.attendance);
      
      // Set the shift if already checked in
      if (response.data.attendance?.shiftId) {
        setSelectedShift(response.data.attendance.shiftId._id);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const todayStr = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API_URL}/api/v1/attendance/stats/summary`, {
        params: { startDate: todayStr, endDate: todayStr },
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            setLocation({
              latitude,
              longitude,
              address: data.display_name || 'Address not found'
            });
          } catch (err) {
            setLocation({
              latitude,
              longitude,
              address: 'Address not available'
            });
          }
        },
        (error) => {
          setError('Please enable location access to mark attendance');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      console.log('📸 Image captured, length:', imageData.length);
      setCapturedImage(imageData);
      
      // Stop camera
      const stream = video.srcObject;
      const tracks = stream?.getTracks();
      tracks?.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleCheckIn = async () => {
    if (!selectedShift) {
      setError('Please select a shift');
      return;
    }

    if (!location) {
      setError('Location not available. Please enable location access.');
      return;
    }

    if (!capturedImage) {
      setError('Please capture your photo');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();

      console.log('📤 Sending check-in with image, length:', capturedImage?.length || 0);
      
      const response = await axios.post(
        `${API_URL}/api/v1/attendance/check-in`,
        {
          shiftId: selectedShift,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          ip: ipData.ip,
          imageBase64: capturedImage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Check-in response:', response.data);
      setSuccess('Check-in successful!');
      setTodayAttendance(response.data.attendance);
      setCapturedImage(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Check-in error:', err);
      setError(err.response?.data?.message || 'Error during check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      setError('Location not available. Please enable location access.');
      return;
    }

    if (!capturedImage) {
      setError('Please capture your photo');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();

      const response = await axios.post(
        `${API_URL}/api/v1/attendance/check-out`,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          ip: ipData.ip,
          imageBase64: capturedImage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Check-out successful!');
      setTodayAttendance(response.data.attendance);
      setCapturedImage(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error during check-out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Time': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'Late': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Half Day': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'Absent': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="p-6 min-h-screen ">
      {/* Status + hours hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card  rounded-xl shadow p-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground ">Today's Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(todayAttendance?.status || 'N/A')}`}>
                {todayAttendance?.status || 'N/A'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground ">Shift</p>
              <p className="text-base font-semibold text-foreground">{todayAttendance?.shiftId?.shiftName || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/10">
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="text-lg font-semibold text-foreground">{formatTime(todayAttendance?.checkInTime)}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
              <p className="text-xs text-orange-600 dark:text-orange-300">Check-out</p>
              <p className="text-lg font-semibold text-foreground">{formatTime(todayAttendance?.checkOutTime)}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <p className="text-xs text-green-600 dark:text-green-300">Worked Time</p>
              <p className="text-lg font-semibold text-foreground">{liveLabel}</p>
              <p className="text-xs text-muted-foreground">Total hours: {formatHoursToHMS(Math.max(stats?.totalHoursWorked || 0, liveHours || 0))}</p>
            </div>
          </div>
        </div>
        <div className="bg-card  rounded-xl shadow p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground ">Today's Proofs</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground ">Check-in</p>
              {todayAttendance?.checkInImage ? (
                <img
                  src={todayAttendance.checkInImage}
                  alt="Check-in"
                  className="w-full h-24 object-cover rounded-lg border border-border  cursor-pointer"
                  onClick={() => setSelectedImage(todayAttendance.checkInImage)}
                />
              ) : (
                <div className="w-full h-24 rounded-lg border border-dashed border-border  flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground ">Check-out</p>
              {todayAttendance?.checkOutImage ? (
                <img
                  src={todayAttendance.checkOutImage}
                  alt="Check-out"
                  className="w-full h-24 object-cover rounded-lg border border-border  cursor-pointer"
                  onClick={() => setSelectedImage(todayAttendance.checkOutImage)}
                />
              ) : (
                <div className="w-full h-24 rounded-lg border border-dashed border-border  flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance */}
      {todayAttendance && (
        <div className="bg-card  rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground ">
            Today's Attendance
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <LogIn className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground ">Check-in</p>
                <p className="font-semibold text-foreground ">
                  {formatTime(todayAttendance.checkInTime)}
                </p>
                {todayAttendance.checkInImage && (
                  <button
                    onClick={() => setSelectedImage(todayAttendance.checkInImage)}
                    className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Camera size={12} />
                    View Image
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LogOut className="text-red-600" size={20} />
              <div>
                <p className="text-sm text-muted-foreground ">Check-out</p>
                <p className="font-semibold text-foreground ">
                  {formatTime(todayAttendance.checkOutTime)}
                </p>
                {todayAttendance.checkOutImage && (
                  <button
                    onClick={() => setSelectedImage(todayAttendance.checkOutImage)}
                    className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <Camera size={12} />
                    View Image
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-foreground" size={20} />
              <div>
                <p className="text-sm text-muted-foreground ">Shift</p>
                <p className="font-semibold text-foreground ">
                  {todayAttendance.shiftId?.shiftName || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              <div>
                <p className="text-sm text-muted-foreground ">Worked Time</p>
                <p className="font-semibold text-foreground ">{liveLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(todayAttendance.status)}`}>
                {todayAttendance.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-primary/5 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Mark Attendance Form */}
      {(!todayAttendance || !todayAttendance.checkOutTime) && (
        <div className="bg-card  rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground ">
            {todayAttendance?.checkInTime ? 'Check-out' : 'Check-in'}
          </h2>

          {/* Shift Selection - Only for check-in */}
          {!todayAttendance?.checkInTime && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Select Shift *
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 "
                disabled={loading}
              >
                <option value="">Choose a shift</option>
                {shifts.map((shift) => (
                  <option key={shift._id} value={shift._id}>
                    {shift.shiftName} ({shift.startTime} - {shift.endTime})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location Info */}
          {location && (
            <div className="mb-6 p-4 bg-muted/50 dark:bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="text-foreground mt-1" size={20} />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Location
                  </p>
                  <p className="text-xs text-muted-foreground  mt-1">
                    {location.address}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Capture Photo *
            </label>
            
            {showCamera && (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <button
                  onClick={capturePhoto}
                  className="mt-2 w-full max-w-md mx-auto block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Capture Photo
                </button>
              </div>
            )}

            {capturedImage && (
              <div className="mb-4">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <button
                  onClick={retakePhoto}
                  className="mt-2 w-full max-w-md mx-auto block px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Retake Photo
                </button>
              </div>
            )}

            {!showCamera && !capturedImage && (
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                disabled={loading}
              >
                <Camera size={20} />
                Open Camera
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={todayAttendance?.checkInTime ? handleCheckOut : handleCheckIn}
            disabled={loading || !location || !capturedImage || (!todayAttendance && !selectedShift)}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'Processing...' : todayAttendance?.checkInTime ? 'Check-out' : 'Check-in'}
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-card rounded-full hover:bg-muted"
            >
              <X size={20} />
            </button>
            <img
              src={selectedImage}
              alt="Attendance"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
