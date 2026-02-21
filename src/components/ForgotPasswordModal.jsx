import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { FaEnvelope, FaLock, FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const ForgotPasswordModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/forgot-password/send-otp`, {
        email: formData.email,
      });

      if (response.data.status) {
        toast.success('OTP sent to your email successfully!');
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to send OTP');
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/forgot-password/reset-password`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.data.status) {
        toast.success('Password reset successfully! You can now login with your new password.');
        handleClose();
      } else {
        setError(response.data.message || 'Failed to reset password');
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    onClose();
  };

  const handleBackToEmail = () => {
    setStep(1);
    setFormData({
      ...formData,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
  };

  // Dynamic styles based on theme
  const glassStyle = {
    background: isDark ? 'rgba(30, 30, 40, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.18)',
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
      color: isDark ? '#fff' : 'inherit',
      '& fieldset': {
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      },
      '&:hover fieldset': {
        borderColor: '#764ba2',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#764ba2',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      '&.Mui-focused': {
        color: '#764ba2',
      },
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#fff' : 'inherit',
    },
  };

  const iconColor = isDark ? '#a78bfa' : '#764ba2';
  const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          ...glassStyle,
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2.5,
        }}
      >
        <FaKey size={20} />
        <Typography variant="h6" component="span" fontWeight="600" letterSpacing="0.5px">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </Typography>
      </DialogTitle>

      <form onSubmit={step === 1 ? handleSendOTP : handleResetPassword}>
        <DialogContent
          dividers
          sx={{ py: 4, px: 4, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {step === 1 ? (
            // Step 1: Enter Email
            <Box>
              <Typography variant="body1" color={textColor} mb={3} sx={{ lineHeight: 1.6 }}>
                Enter your registered email address. We'll send you a secure OTP to reset your
                password.
              </Typography>
              <TextField
                fullWidth
                type="email"
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
                variant="outlined"
                sx={inputStyle}
                InputProps={{
                  startAdornment: <FaEnvelope style={{ marginRight: 12, color: iconColor }} />,
                }}
              />
            </Box>
          ) : (
            // Step 2: Enter OTP and New Password
            <Box>
              <Typography variant="body1" color={textColor} mb={3} sx={{ lineHeight: 1.6 }}>
                An OTP has been sent to{' '}
                <strong style={{ color: isDark ? '#fff' : 'inherit' }}>{formData.email}</strong>.
                Please enter it below along with your new password.
              </Typography>

              <TextField
                fullWidth
                type="text"
                name="otp"
                label="OTP Code"
                value={formData.otp}
                onChange={handleChange}
                required
                autoFocus
                inputProps={{ maxLength: 6 }}
                sx={{ mb: 3, ...inputStyle }}
                InputProps={{
                  startAdornment: <FaKey style={{ marginRight: 12, color: iconColor }} />,
                }}
                helperText="Enter the 6-digit OTP sent to your email"
              />

              <TextField
                fullWidth
                type="password"
                name="newPassword"
                label="New Password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                sx={{ mb: 3, ...inputStyle }}
                InputProps={{
                  startAdornment: <FaLock style={{ marginRight: 12, color: iconColor }} />,
                }}
                helperText="Minimum 6 characters"
              />

              <TextField
                fullWidth
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                sx={inputStyle}
                InputProps={{
                  startAdornment: <FaLock style={{ marginRight: 12, color: iconColor }} />,
                }}
              />

              <Button
                size="small"
                onClick={handleBackToEmail}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  color: isDark ? '#a78bfa' : '#667eea',
                  fontWeight: 600,
                }}
              >
                Change Email Address
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{ px: 4, py: 3, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: isDark ? 'rgba(255,255,255,0.6)' : '#666',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(118, 75, 162, 0.39)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px 0 rgba(118, 75, 162, 0.23)',
              },
            }}
          >
            {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Reset Password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ForgotPasswordModal;
