import React, { useState } from 'react';
import { X, Send, Mail, User, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:6010';

/**
 * TicketRaiseWidget: Embedded widget component for customers to raise tickets
 * Only for registered users (requires authentication)
 */
export default function TicketRaiseWidget({ apiKey, user, onTicketCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pnr, setPnr] = useState(''); // New Airline Field
  const [category, setCategory] = useState('Booking');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to raise a ticket');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        channel: 'widget',
        title: subject, // Note: Backend expects 'subject', this might need adjustment if backend doesn't map title->subject
        subject: subject, // Send subject explicitly
        message: message, // Send message explicitly
        description: message, // Keep description for legacy
        customerEmail: user.email,
        customerName: user.name || user.user_name,
        category: category,
        pnr: pnr, // Airline PNR
        createdBy: user._id,
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Endpoint updated to match backend route
      const res = await axios.post(
        `${API_URL}/api/v1/email-ticketing/tickets`,
        payload,
        { headers }
      );

      toast.success(`Ticket created: ${res.data.data ? res.data.data.ticketId : 'Success'}`);

      // Reset form
      setSubject('');
      setMessage('');
      setPnr('');
      setCategory('Booking');
      setIsOpen(false);

      if (onTicketCreated) {
        onTicketCreated(res.data.ticket);
      }
    } catch (error) {
      console.error('Ticket creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null; // Don't show widget if user is not logged in
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 z-50 group"
          title="Raise a Ticket"
        >
          <Mail size={24} className="group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Ticket form modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] bg-card  rounded-lg shadow-2xl border border-border dark:border-gray-800 z-50 flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Mail size={20} />
              <h3 className="font-semibold text-sm">Raise a Support Ticket</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-card/20 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-2 bg-muted/50 /50 border-b border-border dark:border-gray-800 text-xs text-muted-foreground ">
            <div className="flex items-center gap-2">
              <User size={12} />
              <span>{user.name || user.user_name} ({user.email})</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border  rounded-lg bg-card  text-foreground  focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Booking">Booking</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Reschedule">Reschedule</option>
                  <option value="Refund">Refund</option>
                  <option value="Baggage">Baggage</option>
                  <option value="Check-in">Check-in</option>
                  <option value="Meal / Seat">Meal / Seat</option>
                  <option value="Visa / Travel Advisory">Visa / Travel Advisory</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Airline PNR */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Booking Reference / PNR
                </label>
                <input
                  type="text"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  className="w-full px-3 py-2 text-sm border border-border  rounded-lg bg-card  text-foreground  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 text-sm border border-border  rounded-lg bg-card  text-foreground  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  className="w-full px-3 py-2 text-sm border border-border  rounded-lg bg-card  text-foreground  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border dark:border-gray-800 bg-muted/50 /50">
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
