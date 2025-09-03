import { ChartType } from './file-manager.model';

const activityDataChart: ChartType = {
    series: [{
        data: [30, 14, 26, 32, 24]
    }],
    chart: {
        toolbar: {
            show: false,
        },
        offsetX: -14,
        offsetY: 14,
        height: 250,
        type: 'bar',
        events: {
            click: function (chart, w, e) {
            }
        }
    },

   
    plotOptions: {
        bar: {
            columnWidth: '55%',
            distributed: true,
            endingShape: 'rounded',
           
        }
    },

    fill: {
      opacity: 1,
    },

    stroke: {
      show: false, 
    },
    dataLabels: {
        enabled: false,
    },
    legend: {
        show: false
    },
    colors: ['#34c38f','#f46a6a','#50a5f1','#5b73e8','#f1b44c'],
    xaxis: {
        categories: ['Images', 'Video','Music','Document','Others'],
    }
};

export {
    activityDataChart
};
