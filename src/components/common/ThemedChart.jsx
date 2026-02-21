import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { getChartColors } from '../../config/theme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ThemedChart = ({ type = 'line', data, options = {}, title }) => {
  const chartColors = getChartColors();
  const isDark = document.documentElement.classList.contains('dark');

  // Default styled data with theme colors
  const themedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors[index % chartColors.length] + '20',
      borderColor: dataset.borderColor || chartColors[index % chartColors.length],
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
      fill: dataset.fill !== undefined ? dataset.fill : true,
    })),
  };

  // Default options with theme colors
  const themedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: options.plugins?.legend?.display !== false,
        position: 'top',
        labels: {
          color: isDark ? '#F5EFFF' : '#1e1611',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(42, 35, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#F5EFFF' : '#1e1611',
        bodyColor: isDark ? '#F5EFFF' : '#1e1611',
        borderColor: isDark ? '#504540' : '#CDC1FF',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: options.plugins?.tooltip?.callbacks || {},
      },
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#F5EFFF' : '#1e1611',
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif',
        },
        padding: 20,
      },
    },
    scales:
      type !== 'doughnut'
        ? {
            x: {
              grid: {
                color: isDark ? 'rgba(80, 70, 65, 0.3)' : 'rgba(205, 193, 255, 0.3)',
                borderColor: isDark ? '#504540' : '#CDC1FF',
              },
              ticks: {
                color: isDark ? '#B4AAA5' : '#64625f',
                font: {
                  size: 11,
                },
              },
            },
            y: {
              grid: {
                color: isDark ? 'rgba(80, 70, 65, 0.3)' : 'rgba(205, 193, 255, 0.3)',
                borderColor: isDark ? '#504540' : '#CDC1FF',
              },
              ticks: {
                color: isDark ? '#B4AAA5' : '#64625f',
                font: {
                  size: 11,
                },
              },
            },
          }
        : undefined,
    ...options,
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
  }[type];

  return (
    <div className="w-full h-full">
      <ChartComponent data={themedData} options={themedOptions} />
    </div>
  );
};

export default ThemedChart;

// Example usage with sample data
export const SampleChartData = {
  line: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Queries',
        data: [65, 59, 80, 81, 56, 55],
      },
      {
        label: 'Resolved',
        data: [45, 49, 60, 71, 46, 45],
      },
    ],
  },
  bar: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tickets',
        data: [12, 19, 3, 5, 2, 3, 9],
      },
    ],
  },
  doughnut: {
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [30, 50, 100, 80],
      },
    ],
  },
};
