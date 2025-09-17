import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LabTrendsChart = ({ labData }) => {
  // labData: [{ label, value, flag }]
  const labels = labData.map(item => item.label);
  const values = labData.map(item => item.value);
  const colors = labData.map(item =>
    item.flag === 'High' ? 'rgba(255, 99, 132, 0.8)' :
    item.flag === 'Low' ? 'rgba(255, 206, 86, 0.8)' :
    'rgba(54, 162, 235, 0.8)'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Lab Value',
        data: values,
        backgroundColor: colors,
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointRadius: 6,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Lab Results Visualization',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const flag = labData[context.dataIndex].flag;
            return `${context.dataset.label}: ${context.parsed.y} ${flag ? '(' + flag + ')' : ''}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LabTrendsChart;
