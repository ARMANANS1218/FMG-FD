import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Tooltip } from '@mui/material';
import { format, startOfMonth, endOfMonth, parse, isValid, getDaysInMonth } from 'date-fns';
import {
  Download,
  FileText,
  Search,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Calculator,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-toastify';
import { useGetAllEmployeesQuery } from '../../../features/admin/adminApi';
import { useGetAllAttendanceQuery } from '../../../features/attendance/attendanceApi';
import {
  useGenerateInvoiceMutation,
  usePublishInvoiceMutation,
  useUnpublishInvoiceMutation,
  useGetInvoiceByMonthQuery,
} from '../../../features/invoice/invoiceApi';
import Loading from '../../../components/common/Loading';
import ColorModeContext from '../../../context/ColorModeContext';

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const colorMap = {
    blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600',
    amber: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600',
    purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600',
  };

  return (
    <div
      className={`p-5 rounded-xl border ${
        isDark ? 'bg-card border-border' : 'bg-card border-border'
      } shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-sm font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
          >
            {title}
          </p>
          <h3
            className={`text-2xl font-bold mt-1 ${isDark ? 'text-foreground' : 'text-foreground'}`}
          >
            {value ?? 0}
          </h3>
          {subtitle && (
            <p
              className={`text-xs mt-1 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

import { jwtDecode } from 'jwt-decode';

// ... (existing imports)

const SalaryInvoice = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');

  // Get user role
  const userRole = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        return decoded.role;
      }
      return null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  // Fetch data
  const { data: employees, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery();

  // Parse selected month
  const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const monthNum = isValid(selectedDate) ? selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const yearNum = isValid(selectedDate) ? selectedDate.getFullYear() : new Date().getFullYear();
  const startDate = isValid(selectedDate) ? startOfMonth(selectedDate) : startOfMonth(new Date());
  const endDate = isValid(selectedDate) ? endOfMonth(selectedDate) : endOfMonth(new Date());
  const totalDaysInMonth = isValid(selectedDate)
    ? getDaysInMonth(selectedDate)
    : getDaysInMonth(new Date());

  const { data: attendanceData, isLoading: isLoadingAttendance } = useGetAllAttendanceQuery({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });

  // Invoice API hooks
  const { data: existingInvoice, refetch: refetchInvoice } = useGetInvoiceByMonthQuery({
    month: monthNum,
    year: yearNum,
  });
  const [generateInvoice, { isLoading: isSaving }] = useGenerateInvoiceMutation();
  const [publishInvoice, { isLoading: isPublishing }] = usePublishInvoiceMutation();
  const [unpublishInvoice, { isLoading: isUnpublishing }] = useUnpublishInvoiceMutation();

  const savedInvoice = existingInvoice?.data;

  // Calculate attendance stats per employee
  const employeeStats = useMemo(() => {
    const allEmployees = employees?.data || [];
    const employeesList = allEmployees.filter((emp) => !['Admin', 'Management'].includes(emp.role));
    const attendanceList = attendanceData?.attendance || [];

    if (!employeesList.length) return [];

    return employeesList.map((employee) => {
      const employeeAttendance = attendanceList.filter(
        (record) => record.userId === employee._id || record.userId?._id === employee._id
      );

      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;

      employeeAttendance.forEach((record) => {
        if (['Present', 'On Time', 'Late'].includes(record.status)) {
          presentDays += 1;
        } else if (record.status === 'Half Day') {
          halfDays += 1;
        } else if (record.status === 'Absent') {
          absentDays += 1;
        }
      });

      const recordedDays = presentDays + halfDays + absentDays;
      const unrecordedDays = Math.max(0, totalDaysInMonth - recordedDays);
      const totalAbsentDays = absentDays + unrecordedDays;
      const totalPayableDays = presentDays + halfDays * 0.5;
      const rate = employee.salary || 0;
      const totalSalary = totalPayableDays * rate;

      return {
        ...employee,
        presentDays,
        halfDays,
        absentDays: totalAbsentDays,
        totalPayableDays,
        dailyRate: rate,
        totalSalary,
      };
    });
  }, [employees, attendanceData, totalDaysInMonth]);

  const filteredEmployees = employeeStats.filter(
    (employee) =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = filteredEmployees.length;
  const totalPresentDays = filteredEmployees.reduce((sum, e) => sum + e.presentDays, 0);
  const totalHalfDays = filteredEmployees.reduce((sum, e) => sum + e.halfDays, 0);
  const grandTotal = filteredEmployees.reduce((sum, e) => sum + e.totalSalary, 0);

  // Save Invoice
  const handleSaveInvoice = async () => {
    try {
      const invoiceData = {
        month: monthNum,
        year: yearNum,
        employees: employeeStats.map((emp) => ({
          userId: emp._id,
          name: emp.name,
          email: emp.email,
          employee_id: emp.employee_id,
          role: emp.role,
          presentDays: emp.presentDays,
          halfDays: emp.halfDays,
          absentDays: emp.absentDays,
          payableDays: emp.totalPayableDays,
          dailyRate: emp.dailyRate,
          totalSalary: emp.totalSalary,
        })),
      };

      await generateInvoice(invoiceData).unwrap();
      toast.success('Invoice saved successfully!');
      refetchInvoice();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save invoice');
    }
  };

  // Publish/Unpublish Invoice
  const handleTogglePublish = async () => {
    if (!savedInvoice?._id) {
      toast.error('Please save the invoice first');
      return;
    }

    try {
      if (savedInvoice.isPublished) {
        await unpublishInvoice(savedInvoice._id).unwrap();
        toast.success('Invoice unpublished');
      } else {
        await publishInvoice(savedInvoice._id).unwrap();
        toast.success('Invoice published for Management');
      }
      refetchInvoice();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update publish status');
    }
  };

  // Generate PDF
  const generatePdfInvoice = (employee) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
          <div>
            <h1 style="color: #1e40af; margin: 0; font-size: 32px; font-weight: 700;">SALARY INVOICE</h1>
            <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">${format(selectedDate, 'MMMM yyyy')}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">Odilia CRM</h3>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Salary Disbursement</p>
          </div>
        </div>
        <div style="margin-bottom: 32px; background: #f8fafc; padding: 24px; border-radius: 12px;">
          <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Employee Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div><p style="margin: 0; color: #64748b; font-size: 12px;">Name</p><p style="margin: 4px 0 0 0; font-weight: 600; color: #1f2937;">${employee.name}</p></div>
            <div><p style="margin: 0; color: #64748b; font-size: 12px;">Role</p><p style="margin: 4px 0 0 0; font-weight: 600; color: #1f2937;">${employee.role}</p></div>
            <div><p style="margin: 0; color: #64748b; font-size: 12px;">Email</p><p style="margin: 4px 0 0 0; font-weight: 600; color: #1f2937;">${employee.email}</p></div>
            <div><p style="margin: 0; color: #64748b; font-size: 12px;">Employee ID</p><p style="margin: 4px 0 0 0; font-weight: 600; color: #1f2937;">${employee.employee_id || 'N/A'}</p></div>
          </div>
        </div>
        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f1f5f9;"><td style="padding: 14px 16px; border: 1px solid #e2e8f0;">Present Days</td><td style="padding: 14px 16px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #059669;">${employee.presentDays}</td></tr>
            <tr><td style="padding: 14px 16px; border: 1px solid #e2e8f0;">Half Days</td><td style="padding: 14px 16px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #d97706;">${employee.halfDays}</td></tr>
            <tr style="background: #fef2f2;"><td style="padding: 14px 16px; border: 1px solid #e2e8f0;">Absent Days</td><td style="padding: 14px 16px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626;">${employee.absentDays}</td></tr>
            <tr style="background: #eff6ff;"><td style="padding: 14px 16px; border: 1px solid #e2e8f0; font-weight: 600; color: #1e40af;">Payable Days</td><td style="padding: 14px 16px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #1e40af;">${employee.totalPayableDays}</td></tr>
          </table>
        </div>
        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 14px 16px; border: 1px solid #e2e8f0;">Daily Rate</td><td style="padding: 14px 16px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${employee.dailyRate}</td></tr>
            <tr style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);"><td style="padding: 18px 16px; border: none; font-size: 16px; font-weight: 600; color: white;">Total Salary</td><td style="padding: 18px 16px; border: none; text-align: right; font-weight: 700; color: white; font-size: 20px;">₹${employee.totalSalary.toFixed(2)}</td></tr>
          </table>
        </div>
        <div style="margin-top: 48px; text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 11px;">Generated on ${format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
      </div>
    `;

    html2pdf()
      .set({
        margin: 10,
        filename: `Salary_Invoice_${employee.name}_${format(selectedDate, 'MMM_yyyy')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  if (isLoadingEmployees || isLoadingAttendance) {
    return <Loading />;
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}
            >
              <FileText size={28} />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${isDark ? 'text-foreground' : 'text-foreground'}`}
              >
                Salary Invoice Generator
              </h1>
              <p
                className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
              >
                Generate and publish invoices for Management
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {userRole !== 'Management' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveInvoice}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50`}
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </button>

              {savedInvoice && (
                <button
                  onClick={handleTogglePublish}
                  disabled={isPublishing || isUnpublishing}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    savedInvoice.isPublished
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50`}
                >
                  {savedInvoice.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                  {savedInvoice.isPublished ? 'Unpublish' : 'Publish for Management'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        {savedInvoice && (
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                savedInvoice.isPublished
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {savedInvoice.isPublished ? (
                <>
                  <Eye size={14} /> Published - Management can view
                </>
              ) : (
                <>
                  <EyeOff size={14} /> Draft - Not visible to Management
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} color="blue" />
        <StatCard title="Present Days" value={totalPresentDays} icon={CheckCircle} color="green" />
        <StatCard title="Half Days" value={totalHalfDays} icon={Clock} color="amber" />
        <StatCard
          title="Grand Total"
          value={`₹${grandTotal.toFixed(2)}`}
          icon={Calculator}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div
        className={`p-4 rounded-xl border mb-6 ${
          isDark ? 'bg-card border-border' : 'bg-card border-border'
        } shadow-sm`}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar
              className={isDark ? 'text-muted-foreground' : 'text-muted-foreground'}
              size={20}
            />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-4 py-2.5 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none`}
            />
          </div>
          <div className="relative flex-1 w-full md:max-w-md">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDark ? 'text-muted-foreground' : 'text-muted-foreground'
              }`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary outline-none`}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-card border-border' : 'bg-card border-border'
        } shadow-sm`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-muted/50' : 'bg-muted/50'}>
                {[
                  'S.No',
                  'Employee',
                  'Role',
                  'Present',
                  'Half Days',
                  'Absent',
                  'Payable',
                  'Daily Rate',
                  'Total',
                  'Action',
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider ${
                      isDark ? 'text-muted-foreground' : 'text-muted-foreground'
                    } ${header === 'Total' || header === 'Action' ? 'text-right' : 'text-left'}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((employee, index) => (
                <tr key={employee._id} className={`transition-colors hover:bg-muted/50`}>
                  <td
                    className={`px-4 py-4 text-center ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                  >
                    {index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <p className={`font-medium ${isDark ? 'text-foreground' : 'text-foreground'}`}>
                      {employee.name}
                    </p>
                    <p
                      className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                    >
                      {employee.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-4 text-center font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}
                  >
                    {employee.presentDays}
                  </td>
                  <td
                    className={`px-4 py-4 text-center font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                  >
                    {employee.halfDays}
                  </td>
                  <td
                    className={`px-4 py-4 text-center font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}
                  >
                    {employee.absentDays}
                  </td>
                  <td
                    className={`px-4 py-4 text-center font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    {employee.totalPayableDays}
                  </td>
                  <td className={`px-4 py-4 ${isDark ? 'text-foreground' : 'text-foreground'}`}>
                    ₹{employee.dailyRate || 'N/A'}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-bold text-lg ${isDark ? 'text-foreground' : 'text-foreground'}`}
                  >
                    ₹{employee.totalSalary.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Tooltip title="Download PDF" arrow>
                      <button
                        onClick={() => generatePdfInvoice(employee)}
                        disabled={!employee.dailyRate}
                        className={`p-2 rounded-lg transition-all ${
                          employee.dailyRate
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                      >
                        <Download size={18} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className={`px-6 py-12 text-center ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                  >
                    <Users className="mx-auto mb-3 opacity-50" size={40} />
                    <p className="font-medium">No employees found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryInvoice;
