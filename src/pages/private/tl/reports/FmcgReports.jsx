import React, { useState } from 'react';
import {
    useGetDailyOpsReportQuery,
    useGetWeeklyQualityReportQuery,
    useGetRefundReportQuery,
    useGetBatchTrendReportQuery,
    useGetMonthlyPerformanceReviewQuery,
    useGetRegulatoryReportQuery,
    useGetProductivityReportQuery,
    useGetRootCauseReportQuery,
} from '@/features/fmcgReporting/fmcgReportingApi';
import { useSelector } from 'react-redux';

const tabs = [
    { key: 'daily', label: '📊 Daily Ops' },
    { key: 'weekly', label: '📈 Weekly Quality' },
    { key: 'mpr', label: '📅 Monthly (MPR)' },
    { key: 'refund', label: '💷 Refunds' },
    { key: 'batch', label: '📦 Batch Trends' },
    { key: 'regulatory', label: '⚖️ Compliance' },
    { key: 'productivity', label: '👥 Productivity' },
    { key: 'rootcause', label: '🔍 Root Cause' },
];

const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1 border border-gray-100">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <span className="text-2xl font-bold text-gray-800">{value ?? '—'}</span>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
);

const TableView = ({ data = [], columns = [] }) => (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow">
        <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                    {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3">{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-gray-400">No data available</td></tr>
                ) : data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                        {columns.map((col) => (
                            <td key={col.key} className="px-4 py-3 text-gray-700">{row[col.key] ?? '—'}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default function FmcgReports() {
    const [activeTab, setActiveTab] = useState('daily');
    const orgId = useSelector((s) => s.auth?.user?.organizationId);

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: dailyData, isFetching: dlFetching } = useGetDailyOpsReportQuery({ organizationId: orgId, date: today }, { skip: activeTab !== 'daily' });
    const { data: weeklyData, isFetching: wkFetching } = useGetWeeklyQualityReportQuery({ organizationId: orgId }, { skip: activeTab !== 'weekly' });
    const { data: refundData, isFetching: rfFetching } = useGetRefundReportQuery({ organizationId: orgId }, { skip: activeTab !== 'refund' });
    const { data: batchData, isFetching: btFetching } = useGetBatchTrendReportQuery({ organizationId: orgId }, { skip: activeTab !== 'batch' });
    const { data: mprData, isFetching: mprFetching } = useGetMonthlyPerformanceReviewQuery({ organizationId: orgId, month, year }, { skip: activeTab !== 'mpr' });
    const { data: regData, isFetching: rgFetching } = useGetRegulatoryReportQuery({ organizationId: orgId }, { skip: activeTab !== 'regulatory' });
    const { data: prodData, isFetching: pdFetching } = useGetProductivityReportQuery({ organizationId: orgId, startDate: `${year}-01-01`, endDate: today }, { skip: activeTab !== 'productivity' });
    const { data: rcData, isFetching: rcFetching } = useGetRootCauseReportQuery({ organizationId: orgId }, { skip: activeTab !== 'rootcause' });

    const isLoading = dlFetching || wkFetching || rfFetching || btFetching || mprFetching || rgFetching || pdFetching || rcFetching;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📊 FMCG Reports</h1>
                <p className="text-sm text-gray-500 mt-1">UK Chat Support — Team Leader Dashboard</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === t.key
                                ? 'bg-blue-600 text-white border-blue-600 shadow'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {isLoading && (
                    <div className="flex items-center justify-center py-12 text-gray-400">Loading report...</div>
                )}

                {/* 1. Daily Ops */}
                {activeTab === 'daily' && !dlFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Daily Operations</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Chats" value={dailyData?.data?.totalChats} />
                            <StatCard label="Resolved" value={dailyData?.data?.resolved} />
                            <StatCard label="Avg FRT (s)" value={dailyData?.data?.avgFrt?.toFixed(1)} sub="First Response Time" />
                            <StatCard label="SLA Breaches" value={dailyData?.data?.slaBreaches} />
                            <StatCard label="Refund Value" value={dailyData?.data?.totalRefundValue ? `£${dailyData.data.totalRefundValue.toFixed(2)}` : '£0'} />
                            <StatCard label="Escalations" value={dailyData?.data?.escalations} />
                            <StatCard label="Open Cases" value={dailyData?.data?.openCases} />
                            <StatCard label="Closed Cases" value={dailyData?.data?.closedCases} />
                        </div>
                    </div>
                )}

                {/* 2. Weekly Quality */}
                {activeTab === 'weekly' && !wkFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Weekly Quality Report</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Avg QA Score" value={weeklyData?.data?.avgQaScore?.toFixed(1)} sub="/ 100" />
                            <StatCard label="CSAT %" value={weeklyData?.data?.csatPercent} />
                            <StatCard label="DSAT %" value={weeklyData?.data?.dsatPercent} />
                            <StatCard label="Repeat Contact Rate" value={weeklyData?.data?.repeatContactRate} />
                            <StatCard label="Compliance Errors" value={weeklyData?.data?.complianceErrors} />
                            <StatCard label="Critical Errors" value={weeklyData?.data?.criticalErrors} />
                        </div>
                    </div>
                )}

                {/* 3. MPR */}
                {activeTab === 'mpr' && !mprFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Monthly Performance Review — {month}/{year}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Chats" value={mprData?.data?.totalChats} />
                            <StatCard label="Resolved" value={mprData?.data?.resolved} />
                            <StatCard label="Avg FRT (s)" value={mprData?.data?.avgFrt?.toFixed(1)} />
                            <StatCard label="Total Refunds" value={mprData?.data?.totalRefundValue ? `£${mprData.data.totalRefundValue.toFixed(2)}` : '£0'} />
                        </div>
                    </div>
                )}

                {/* 4. Refunds */}
                {activeTab === 'refund' && !rfFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Refund & Compensation Report</h2>
                        <TableView
                            data={refundData?.data || []}
                            columns={[
                                { key: '_id', label: 'Agent' },
                                { key: 'totalRefunds', label: 'Total Cases' },
                                { key: 'totalValue', label: 'Refund Value (£)' },
                                { key: 'avgRefund', label: 'Avg Refund (£)' },
                            ]}
                        />
                    </div>
                )}

                {/* 5. Batch Trends */}
                {activeTab === 'batch' && !btFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Batch Issue Trends</h2>
                        <TableView
                            data={batchData?.data || []}
                            columns={[
                                { key: '_id', label: 'Batch/Lot No.' },
                                { key: 'productName', label: 'Product' },
                                { key: 'count', label: 'Complaints' },
                            ]}
                        />
                    </div>
                )}

                {/* 6. Regulatory */}
                {activeTab === 'regulatory' && !rgFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Regulatory Compliance (GDPR & FSA)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <StatCard label="FSA Reportable Cases" value={regData?.data?.fsaReportableCases} />
                            <StatCard label="GDPR Requests Pending" value={regData?.data?.gdprRequestsPending} />
                            <StatCard label="Compliance Errors" value={regData?.data?.complianceErrors} />
                        </div>
                    </div>
                )}

                {/* 7. Productivity */}
                {activeTab === 'productivity' && !pdFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Workforce Productivity</h2>
                        <TableView
                            data={prodData?.data || []}
                            columns={[
                                { key: 'agentName', label: 'Agent' },
                                { key: 'chatsHandled', label: 'Chats Handled' },
                                { key: 'resolvedCount', label: 'Resolved' },
                                { key: 'avgResponseTime', label: 'Avg FRT (s)' },
                            ]}
                        />
                    </div>
                )}

                {/* 8. Root Cause */}
                {activeTab === 'rootcause' && !rcFetching && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Root Cause Analysis</h2>
                        <TableView
                            data={rcData?.data || []}
                            columns={[
                                { key: '_id', label: 'Category' },
                                { key: 'count', label: 'Cases' },
                                { key: 'avgScore', label: 'Avg CSAT' },
                            ]}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
