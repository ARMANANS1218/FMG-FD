import React, { useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Avatar
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { format } from 'date-fns';

const BreakDetailsModal = ({
    isOpen,
    onClose,
    employeeData
}) => {
    // Defensive check
    if (!employeeData) return null;

    const { name, employee_id, profileImage, activity, workStatus, break_time, breakReason } = employeeData;
    const { totalBreaks, breakDuration } = activity;

    // Consolidate break logs: combine saved logs with current ongoing break if it exists
    const allBreakLogs = useMemo(() => {
        const logs = [...(employeeData.breakLogs || [])];
        if (workStatus === 'break' && break_time) {
            const start = new Date(break_time);
            const now = new Date();
            const duration = Math.max(0, (now - start) / 1000 / 60);
            logs.unshift({
                start: break_time,
                end: null,
                duration: duration,
                reason: breakReason || 'Break'
            });
        }
        return logs;
    }, [employeeData.breakLogs, workStatus, break_time, breakReason]);

    // Format Duration string Helper
    const formatDurationString = (minutes) => {
        if (!minutes || minutes < 0) return '00:00:00';
        const totalSeconds = Math.round(minutes * 60);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    };

    // Group break data by reason for the chart
    const chartData = useMemo(() => {
        const reasonGroups = allBreakLogs.reduce((acc, log) => {
            const reason = log.reason || 'Break';
            if (!acc[reason]) {
                acc[reason] = 0;
            }
            acc[reason] += log.duration || 0;
            return acc;
        }, {});

        return Object.keys(reasonGroups).map(reason => ({
            name: reason,
            duration: reasonGroups[reason],
            tooltipDuration: formatDurationString(reasonGroups[reason])
        }));
    }, [allBreakLogs]);

    // Format Y-axis ticks
    const formatYAxis = (tickItem) => {
        const totalSeconds = Math.round(tickItem * 60);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Custom Tooltip for the bar chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-sm mb-1">{label}</p>
                    <p className="text-sm text-indigo-500">
                        Duration: {payload[0].payload.tooltipDuration}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                className: "bg-background rounded-xl overflow-hidden shadow-2xl"
            }}
        >
            <div className="flex justify-between items-center p-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <Avatar src={profileImage} alt={name} className="w-12 h-12 bg-primary">
                        {name?.charAt(0)}
                    </Avatar>
                    <div>
                        <DialogTitle className="p-0 text-2xl font-bold text-foreground">
                            Break Details
                        </DialogTitle>
                        <Typography variant="body2" className="text-muted-foreground mt-1">
                            {name} : {employee_id} • Total: {formatDurationString(breakDuration)}
                        </Typography>
                    </div>
                </div>
                <IconButton onClick={onClose} size="small" className="text-muted-foreground hover:bg-muted">
                    <CloseIcon />
                </IconButton>
            </div>

            <DialogContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Chart */}
                    <div className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-1">
                                Total Break Duration
                            </p>
                            <h3 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                                {formatDurationString(breakDuration)}
                            </h3>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-6">
                                BREAK DISTRIBUTION
                            </h4>
                            <div className="h-64 mt-4 text-xs">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={{ stroke: '#e2e8f0' }}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                tickFormatter={formatYAxis}
                                                axisLine={{ stroke: '#e2e8f0' }}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                domain={[0, 'auto']}
                                                width={70}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="duration" radius={[6, 6, 0, 0]} barSize={35}>
                                                {chartData.map((entry, index) => {
                                                    const colors = {
                                                        'Meeting': '#a78bfa',
                                                        'Lunch': '#4ade80',
                                                        'Coffee': '#f472b6',
                                                        'Personal': '#fb923c',
                                                        'Other': '#94a3b8',
                                                        'Break': '#818cf8'
                                                    };
                                                    return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#818cf8'} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        No break data to display
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History List */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-500 mb-1">
                                Total Breaks Taken
                            </p>
                            <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                                {totalBreaks}
                            </h3>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                                Break History
                            </h4>
                            <div className="space-y-3">
                                {allBreakLogs && allBreakLogs.length > 0 ? (
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-sm border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">Time (Start to End)</th>
                                                        <th className="px-4 py-3 text-left font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">Reason</th>
                                                        <th className="px-4 py-3 text-right font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">Duration</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                    {allBreakLogs.map((log, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                    {format(new Date(log.start), 'hh:mm a')} - {log.end ? format(new Date(log.end), 'hh:mm a') : 'Now'}
                                                                </div>
                                                                <div className="text-xs text-slate-500">
                                                                    {format(new Date(log.start), 'MMM dd, yyyy')}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 uppercase tracking-wider">
                                                                    {log.reason || 'Break'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                                                                {log.end ? formatDurationString(log.duration) : (
                                                                    <span className="text-amber-600 dark:text-amber-400 animate-pulse font-bold">
                                                                        Ongoing
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                                        No break history recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BreakDetailsModal;
