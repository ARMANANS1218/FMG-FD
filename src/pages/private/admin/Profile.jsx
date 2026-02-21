import React, { useEffect, useState } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { toast } from 'react-toastify';
import ProfileImageUpload from '../../../components/common/ProfileImageUpload';

export default function AdminProfile() {
  const { data, refetch, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const user = data?.data;

  const [form, setForm] = useState({ name: '', user_name: '', email: '', mobile: '' });
  const [locationForm, setLocationForm] = useState({ city: '', region: '', country: '' });
  const [file, setFile] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        user_name: user.user_name || '',
        email: user.email || '',
        mobile: user.mobile || '',
      });
      setLocationForm({
        city: user?.location?.city || '',
        region: user?.location?.region || '',
        country: user?.location?.country || '',
      });
    }
  }, [user]);

  const [systemInfo, setSystemInfo] = useState({
    ip: user?.ip || '',
    timezone: user?.location?.timezone || '',
    browser: '',
    os: '',
    device: '',
    screen: `${window.screen.width}x${window.screen.height}`
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    let browser = 'Unknown';
    if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua)) browser = 'Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';

    let os = 'Unknown';
    if (/windows/i.test(platform)) os = 'Windows';
    else if (/mac/i.test(platform)) os = 'MacOS';
    else if (/linux/i.test(platform)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';

    const device = /mobile/i.test(ua) ? 'Mobile' : 'Desktop';
    setSystemInfo(si => ({ ...si, browser, os, device }));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      // Include location data if changed
      if (locationForm.city) fd.append('locationCity', locationForm.city);
      if (locationForm.region) fd.append('locationRegion', locationForm.region);
  if (locationForm.country) fd.append('locationCountry', locationForm.country);
  if (systemInfo.ip) fd.append('ip', systemInfo.ip);
  if (systemInfo.timezone) fd.append('locationTimezone', systemInfo.timezone);
  if (file) fd.append('profileImage', file);
      await updateProfile(fd).unwrap();
      toast.success('Profile updated successfully!');
      setFile(null);
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  // Fetch geolocation data (IP & Timezone)
  const fetchGeolocationData = async () => {
    setFetchingLocation(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data) {
        setLocationForm(prev => ({
          ...prev,
          city: data.city || prev.city,
          region: data.region || prev.region,
          country: data.country_code || prev.country,
        }));
        setSystemInfo(prev => ({
          ...prev,
          ip: data.ip || prev.ip,
          timezone: data.timezone || prev.timezone
        }));
        toast.success('Location data fetched successfully!');
      }
    } catch (err) {
      console.error('Failed to fetch geolocation:', err);
      toast.error('Failed to fetch location data');
    } finally {
      setFetchingLocation(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-2 bg-muted/50 ">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        {/* Profile Information Card */}
        <div className="mb-6 bg-card  border border-border  rounded-xl p-6">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                {user?.profileImage ? (
                  <img src={`${user?.profileImage?.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL || ''}${user?.profileImage}`}`} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || user?.user_name?.charAt(0) || 'U'
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Full Name</p>
                  <p className="text-lg font-bold text-foreground">{user?.name || user?.user_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Email</p>
                  <p className="text-lg font-bold text-foreground">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Employee ID</p>
                  <p className="text-lg font-bold text-foreground">{user?.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Department</p>
                  <p className="text-lg font-bold text-foreground">{user?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Login Time</p>
                  <p className="text-lg font-bold text-foreground">
                    {user?.login_time ? new Date(user.login_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground ">Location</p>
                  <p className="text-lg font-bold text-foreground">
                    {user?.location?.city ? `${user.location.city}${user?.location?.region ? ', ' + user.location.region : ''}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-6">
          <button type="button" onClick={fetchGeolocationData} disabled={fetchingLocation} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 font-medium">
            {fetchingLocation ? 'Fetching...' : 'Fetch My Location'}
          </button>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 rounded-lg bg-muted  text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 font-medium">
            Reset
          </button>
          <button type="button" onClick={onSubmit} disabled={isSaving} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-50 font-medium">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <form onSubmit={onSubmit} className="bg-card  border border-border  rounded-xl p-6 space-y-6">
        {/* Profile Picture Upload Component */}
        <ProfileImageUpload
          currentImage={user?.profileImage}
          userName={user?.name}
          onFileSelect={setFile}
          isLoading={isSaving}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              name="user_name"
              value={form.user_name}
              onChange={(e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
              placeholder="jdoe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              readOnly
              disabled
              className="w-full px-3 py-2 rounded-lg border-2 border-border  bg-muted  text-muted-foreground  cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={(e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
              placeholder="+91 00000 00000"
            />
          </div>
        </div>

        {/* Location Information Section */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Location Information (Editable)</h2>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {/* City - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <input
                type="text"
                value={locationForm.city}
                onChange={(e) => setLocationForm(s => ({ ...s, city: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
                placeholder="Gurugram"
              />
            </div>

            {/* Region - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region/State</label>
              <input
                type="text"
                value={locationForm.region}
                onChange={(e) => setLocationForm(s => ({ ...s, region: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
                placeholder="HR"
              />
            </div>

            {/* Country - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <input
                type="text"
                value={locationForm.country}
                onChange={(e) => setLocationForm(s => ({ ...s, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-card  text-foreground focus:outline-none focus:border-blue-500"
                placeholder="IN"
              />
            </div>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-4">Login & System Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Login Time - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login Time</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">
                  {user?.login_time ? new Date(user.login_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Employee ID - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{user?.employee_id || 'N/A'}</p>
              </div>
            </div>

            {/* Department - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{user?.department || 'N/A'}</p>
              </div>
            </div>

            {/* IP Address - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.ip || user?.ip || 'N/A'}</p>
              </div>
            </div>
            {/* Timezone - Read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.timezone || user?.location?.timezone || 'N/A'}</p>
              </div>
            </div>
            {/* Browser */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Browser</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.browser}</p>
              </div>
            </div>
            {/* OS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OS</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.os}</p>
              </div>
            </div>
            {/* Device */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.device}</p>
              </div>
            </div>
            {/* Screen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Screen</label>
              <div className="px-3 py-2 rounded-lg border-2 border-border dark:border-slate-600 bg-muted/50 ">
                <p className="text-foreground">{systemInfo.screen}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
