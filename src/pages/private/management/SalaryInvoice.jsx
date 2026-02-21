import React, { useState, useContext } from 'react';
import { format, parse, isValid } from 'date-fns';
import {
  Download,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Calculator,
  AlertCircle,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useGetInvoiceForManagementQuery } from '../../../features/invoice/invoiceApi';
import ColorModeContext from '../../../context/ColorModeContext';

// Simple Loading Component if not available globally
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Minimal Stat Card Component
const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="text-muted-foreground" size={20} />
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-bold text-foreground">{value ?? 0}</p>
        </div>
      </div>
    </div>
  );
};

const SalaryInvoice = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Parse selected month
  const selectedDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const monthNum = isValid(selectedDate) ? selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const yearNum = isValid(selectedDate) ? selectedDate.getFullYear() : new Date().getFullYear();

  // Fetch published invoice for Management
  const { data: invoiceResponse, isLoading } = useGetInvoiceForManagementQuery({
    month: monthNum,
    year: yearNum,
  });

  const invoice = invoiceResponse?.data;
  const employees = invoice?.employees || [];
  const grandTotal = invoice?.grandTotal || 0;

  // Stats
  const totalEmployees = employees.length;
  const totalPresentDays = employees.reduce((sum, e) => sum + (e.presentDays || 0), 0);
  const totalHalfDays = employees.reduce((sum, e) => sum + (e.halfDays || 0), 0);
  const totalPayableDays = employees.reduce((sum, e) => sum + (e.payableDays || 0), 0);

  // Generate Full Invoice PDF with all employees
  const generateFullInvoicePdf = () => {
    const invoiceNumber = `INV-${yearNum}${String(monthNum).padStart(2, '0')}-001`;
    const issueDate = format(new Date(), 'dd MMM yyyy');

    const employeeRows = employees
      .map(
        (emp, index) => `
        <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 8px 12px; text-align: center; color: #374151;">${index + 1}</td>
          <td style="padding: 8px 12px; font-weight: 500; color: #1f2937;">${emp.name}</td>
          <td style="padding: 8px 12px; text-align: center; color: #374151;">${emp.role}</td>
          <td style="padding: 8px 12px; text-align: center; color: #059669; font-weight: 500;">${emp.presentDays}</td>
          <td style="padding: 8px 12px; text-align: center; color: #d97706; font-weight: 500;">${emp.halfDays}</td>
          <td style="padding: 8px 12px; text-align: center; color: #dc2626; font-weight: 500;">${emp.absentDays}</td>
          <td style="padding: 8px 12px; text-align: center; color: #1e40af; font-weight: 600;">${emp.payableDays}</td>
          <td style="padding: 8px 12px; text-align: right; color: #374151;">₹${emp.dailyRate?.toFixed(2)}</td>
          <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #1f2937;">₹${emp.totalSalary?.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 100%; background: white; padding: 20px 0;">
        <!-- Header -->
        <div style="background: #0f4c75; padding: 24px 32px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">SALARY INVOICE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 13px;">${format(selectedDate, 'MMMM yyyy')}</p>
          </div>
          <div style="text-align: right; color: white;">
            <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600;">Odilia CRM</h3>
            <p style="margin: 0; font-size: 11px; opacity: 0.85;">hr@odiliacrm.com</p>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 24px 32px;">
          <!-- Invoice Meta -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Invoice No.</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #1f2937;">${invoiceNumber}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Issue Date</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #1f2937;">${issueDate}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Total Employees</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #1f2937;">${totalEmployees}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Payable Days</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #1f2937;">${totalPayableDays.toFixed(1)}</p>
            </div>
          </div>

          <!-- Employee Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; page-break-inside: auto;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">S.No</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #374151;">Employee Name</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">Role</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">Present</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">Half Days</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">Absent</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #374151;">Payable</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Rate</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${employeeRows}
            </tbody>
          </table>

          <!-- Totals Section -->
          <div style="display: flex; justify-content: flex-end;">
            <div style="min-width: 280px; border: 1px solid #e5e7eb; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 13px;">Subtotal</span>
                <span style="color: #1f2937; font-weight: 500;">₹${grandTotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 13px;">TDS (0%)</span>
                <span style="color: #1f2937;">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 13px;">Professional Tax</span>
                <span style="color: #1f2937;">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 13px;">PF Deduction</span>
                <span style="color: #1f2937;">₹0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: #0f4c75;">
                <span style="color: white; font-weight: 600; font-size: 14px;">Net Payable</span>
                <span style="color: white; font-weight: 700; font-size: 15px;">₹${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Terms -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280; font-weight: 600;">Terms & Notes</p>
            <p style="margin: 0; font-size: 10px; color: #9ca3af; line-height: 1.5;">
              1. Salary calculated based on attendance records for ${format(selectedDate, 'MMMM yyyy')}.<br/>
              2. Half days are counted as 0.5 payable days.<br/>
              3. This is a computer-generated document and does not require signature.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #0f4c75; padding: 12px 32px; text-align: center;">
          <p style="margin: 0; color: white; font-size: 12px;">Thank you!</p>
        </div>
      </div>
    `;

    html2pdf()
      .set({
        margin: [5, 5, 5, 5],
        filename: `Salary_Invoice_${format(selectedDate, 'MMM_yyyy')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  if (isLoading) {
    return <Loading />;
  }

  // No published invoice
  if (!invoice) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted">
              <FileText className="text-muted-foreground" size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Salary Invoice</h1>
              <p className="text-sm text-muted-foreground">View published salary invoices</p>
            </div>
          </div>
        </div>

        {/* Month Picker */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground" size={18} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* No Invoice Message */}
        <div className="p-12 rounded-xl bg-card border border-border shadow-sm text-center">
          <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h2 className="text-lg font-semibold mb-2 text-foreground">No Invoice Available</h2>
          <p className="text-sm text-muted-foreground">
            The salary invoice for {format(selectedDate, 'MMMM yyyy')} has not been published yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted">
              <FileText className="text-muted-foreground" size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Salary Invoice - {format(selectedDate, 'MMMM yyyy')}
              </h1>
              <p className="text-sm text-muted-foreground">
                Published on{' '}
                {invoice.publishedAt ? format(new Date(invoice.publishedAt), 'dd MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={generateFullInvoicePdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm"
          >
            <Download size={18} />
            Download Invoice
          </button>
        </div>
      </div>

      {/* Stats Row - Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} />
        <StatCard title="Present Days" value={totalPresentDays} icon={CheckCircle} />
        <StatCard title="Half Days" value={totalHalfDays} icon={Clock} />
        <StatCard title="Grand Total" value={`₹${grandTotal.toFixed(2)}`} icon={Calculator} />
      </div>

      {/* Month Filter */}
      <div className="p-3 rounded-xl bg-card border border-border shadow-sm mb-4 inline-flex items-center gap-2">
        <Calendar className="text-muted-foreground" size={16} />
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-2 py-1 rounded bg-transparent border-0 text-foreground focus:ring-0 outline-none text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {['#', 'Name', 'Role', 'Present', 'Half', 'Absent', 'Payable', 'Rate', 'Total'].map(
                  (header, i) => (
                    <th
                      key={header}
                      className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${i >= 7 ? 'text-right' : i === 0 ? 'text-center' : 'text-left'}`}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((employee, index) => (
                <tr key={employee.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-center text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{employee.name}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-muted-foreground">{employee.role}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-green-600 dark:text-green-400">
                    {employee.presentDays}
                  </td>
                  <td className="px-3 py-2 text-center text-amber-600 dark:text-amber-400">
                    {employee.halfDays}
                  </td>
                  <td className="px-3 py-2 text-center text-red-600 dark:text-red-400">
                    {employee.absentDays}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                    {employee.payableDays}
                  </td>
                  <td className="px-3 py-2 text-right text-foreground">₹{employee.dailyRate}</td>
                  <td className="px-3 py-2 text-right font-semibold text-foreground">
                    ₹{employee.totalSalary?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Subtotal Footer */}
            {employees.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50">
                  <td colSpan={8} className="px-3 py-3 text-right">
                    <span className="font-semibold text-foreground">TOTAL</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-bold text-lg text-foreground">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryInvoice;
