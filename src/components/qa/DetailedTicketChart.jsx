import React from 'react';
import { useListTicketEvaluationsQuery } from '../../features/qa/qaTicketEvaluationApi';
import { Line } from 'react-chartjs-2';
import { ChevronUp, Edit } from 'lucide-react';
import { format } from 'date-fns';
import RateTicketModal from '../qa/RateTicketModal';

export default function DetailedTicketChart({ agentId, agentName, onClose }) {
  const { data, isLoading, refetch } = useListTicketEvaluationsQuery({ agentId });
  const evaluations = data?.data || [];
  const [selectedEvaluation, setSelectedEvaluation] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleEditEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowEditModal(true);
  };

  // Calculate metric averages for email ticket evaluation (24 metrics)
  const metricKeys = [
    'grammarSpelling',
    'sentenceStructure',
    'professionalLanguage',
    'toneCourtesy',
    'properGreeting',
    'personalization',
    'standardClosing',
    'brandTone',
    'issueIdentified',
    'issueAcknowledged',
    'noAssumptions',
    'correctResolution',
    'allQueriesAddressed',
    'sopCompliance',
    'firstContactResolution',
    'empathyStatement',
    'ownershipTaken',
    'reassuranceProvided',
    'properFormatting',
    'readableStructure',
    'noOverFormatting',
    'dataPrivacy',
    'authenticationFollowed',
    'policyAdherence',
  ];

  const metricAverages = metricKeys.map((metric) => {
    const scores = evaluations
      .map((ev) => ev[metric] || 0)
      .filter((s) => s > 0);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
  });

  // Prepare chart data for metrics breakdown
  const metricsChartData = {
    labels: [
      'Grammar', 'Sentence', 'Professional', 'Tone', 'Greeting', 'Personal',
      'Closing', 'Brand', 'Issue ID', 'Acknowledged', 'No Assume', 'Resolution',
      'All Queries', 'SOP', 'FCR', 'Empathy', 'Ownership', 'Reassurance',
      'Formatting', 'Readable', 'No Over Format', 'Privacy', 'Auth', 'Policy'
    ],
    datasets: [
      {
        label: `${agentName} - Metric Scores`,
        data: metricAverages,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(107, 114, 128, 1)',
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: { color: 'rgba(107, 114, 128, 1)' },
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
      },
      x: {
        ticks: { color: 'rgba(107, 114, 128, 1)', font: { size: 9 } },
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
      },
    },
  };

  return (
    <div className="mt-1 p-1.5 bg-muted/50  border border-border  rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-foreground ">
          Detailed Performance: {capitalizeText(agentName)}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground  hover:text-foreground dark:hover:text-gray-100"
        >
          <ChevronUp size={20} />
        </button>
      </div>

      {isLoading && <p className="text-center text-muted-foreground ">Loading Evaluations…</p>}

      {!isLoading && evaluations.length === 0 && (
        <p className="text-center text-muted-foreground ">No Evaluations For This Agent.</p>
      )}

      {!isLoading && evaluations.length > 0 && (
        <div className="space-y-1.5">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-card dark:bg-blue-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Total Evals</p>
              <p className="text-xl font-bold text-foreground dark:text-blue-300">{evaluations.length}</p>
            </div>
            <div className="bg-primary/5 dark:bg-green-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Avg Score</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {(evaluations.reduce((sum, ev) => sum + (ev.totalScore || 0), 0) / evaluations.length).toFixed(2)}%
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">High Score</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-300">
                {Math.max(...evaluations.map((ev) => ev.totalScore || 0)).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="grid grid-cols-1 gap-1.5">
            {/* Metrics Breakdown - Full Width */}
            <div className="bg-card  border border-border  rounded-lg p-1.5" style={{ height: '250px' }}>
              <h4 className="text-xs font-bold text-foreground  mb-1.5 uppercase">Avg Metric Scores</h4>
              <div style={{ height: 'calc(100% - 30px)' }}>
                <Line data={metricsChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Detailed Evaluations Table */}
          <div className="bg-card  border border-border  rounded-lg overflow-hidden">
            <div className="px-1.5 py-1.5 bg-muted/50  border-b border-border dark:border-gray-600">
              <h4 className="text-xs font-bold text-foreground  uppercase">All Evaluations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-muted ">
                  <tr>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Ticket ID</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">By</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Score</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Category</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Crit Error</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Remarks</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Coaching</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Date</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {evaluations.map((ev) => {
                    const performanceCategory = ev.performanceCategory || 'N/A';
                    const categoryColor = 
                      performanceCategory === 'Excellent' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 
                      performanceCategory === 'Good' ? 'text-foreground bg-card dark:bg-blue-900/30' : 
                      performanceCategory === 'Needs Improvement' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' : 
                      'text-red-600 bg-red-50 dark:bg-red-900/30';
                    
                    return (
                      <tr key={ev._id} className="hover:bg-muted/50 dark:hover:bg-gray-700">
                        <td className="px-1 py-1 whitespace-nowrap text-xs font-medium text-foreground ">
                          {ev.ticketId || 'N/A'}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-foreground ">
                          {capitalizeText(ev.evaluatedBy?.name || 'N/A')}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs font-bold text-foreground ">
                          {ev.totalScore?.toFixed(2)}%
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${categoryColor}`}>
                            {capitalizeText(performanceCategory)}
                          </span>
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs">
                          {ev.hasCriticalError ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">YES</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-1 py-1 text-xs text-foreground  max-w-xs truncate">
                          {capitalizeText(ev.remarks || 'N/A')}
                        </td>
                        <td className="px-1 py-1 text-xs text-foreground  max-w-xs truncate">
                          {capitalizeText(ev.coachingArea || 'N/A')}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-foreground ">
                          {ev.createdAt ? format(new Date(ev.createdAt), 'dd MMM yy') : 'N/A'}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap">
                          <button
                            onClick={() => handleEditEvaluation(ev)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-card hover:bg-blue-100 bg-primary rounded border border-primary/20 font-medium"
                            title="Edit Evaluation"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Evaluation Modal */}
      {showEditModal && selectedEvaluation && (
        <RateTicketModal
          ticketId={selectedEvaluation.ticketId}
          readOnly={false}
          existingData={selectedEvaluation}
          onClose={(saved) => {
            setShowEditModal(false);
            setSelectedEvaluation(null);
            if (saved) {
              refetch();
            }
          }}
          isOpen={showEditModal}
        />
      )}
    </div>
  );
}
