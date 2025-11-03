// Global variables
let chartInstance = null;
let currentTaskType = 'report'; // single, multiple, report
let currentCompareMode = 'models'; // agents, models, patterns
let csvData = {
    methods: null,
    models: null,
    patterns: null,
    allPatterns: null
};

// Color schemes for different entities
const colorSchemes = {
    agents: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
    ],
    models: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9966', '#FF6633', '#FFB399', '#FF33FF'
    ],
    patterns: [
        '#66C2A5', '#FC8D62', '#8DA0CB', '#E78AC3'
    ]
};

// Metric mappings for different task types
const metricMappings = {
    single: 'EX_SC',
    multiple: 'EX_MC',
    report: ['R1', 'R2', 'RL'] // Multiple metrics for report
};

// Data agent names mapping
const agentNames = {
    'MLE-STAR': 'MLE-STAR',
    'Teable': 'Teable',
    'DeepAnalyze': 'DeepAnalyze',
    'Taiji': 'Taiji',
    'AOP': 'AOP',
    'AgenticData': 'AgenticData'
};

// Design pattern names
const patternNames = {
    'Multi-agent': 'Multi-agent',
    'Planning': 'Planning',
    'Reflection': 'Reflection',
    'Tool-use': 'Tool-use'
};

// Parse CSV data
async function loadCSVData() {
    try {
        // Load methods data
        const methodsResponse = await fetch('static/data/method_aggregated.csv');
        const methodsText = await methodsResponse.text();
        csvData.methods = parseCSV(methodsText);

        // Load models data
        const modelsResponse = await fetch('static/data/model_aggregated.csv');
        const modelsText = await modelsResponse.text();
        csvData.models = parseCSV(modelsText);

        // Load design patterns data
        const patternsResponse = await fetch('static/data/design_pattern_aggregated.csv');
        const patternsText = await patternsResponse.text();
        csvData.patterns = parseCSV(patternsText);

        // Load all design patterns data
        const allPatternsResponse = await fetch('static/data/all_design_patterns_metrics.csv');
        const allPatternsText = await allPatternsResponse.text();
        csvData.allPatterns = parseCSV(allPatternsText);

        console.log('CSV data loaded:', csvData);
    } catch (error) {
        console.error('Error loading CSV data:', error);
    }
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length > 1) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }
    }

    return data;
}

function getDataForCurrentFilters() {
    let data = [];
    let labels = [];
    let datasets = [];

    if (currentCompareMode === 'agents') {
        data = csvData.methods;
        labels = data.map(d => d.Method);

        if (currentTaskType === 'single') {
            datasets = [{
                label: 'Execution Accuracy (Single-Choice)',
                data: data.map(d => parseFloat(d.EX_SC) * 100),
                backgroundColor: colorSchemes.agents.slice(0, data.length),
                borderColor: colorSchemes.agents.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'multiple') {
            datasets = [{
                label: 'Execution Accuracy (Multiple-Choice)',
                data: data.map(d => parseFloat(d.EX_MC) * 100),
                backgroundColor: colorSchemes.agents.slice(0, data.length),
                borderColor: colorSchemes.agents.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'report') {
            datasets = [
                {
                    label: 'ROUGE-1',
                    data: data.map(d => parseFloat(d.R1) * 100),
                    backgroundColor: '#FF6B6B',
                    borderColor: '#FF6B6B',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-2',
                    data: data.map(d => parseFloat(d.R2) * 100),
                    backgroundColor: '#4ECDC4',
                    borderColor: '#4ECDC4',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-L',
                    data: data.map(d => parseFloat(d.RL) * 100),
                    backgroundColor: '#45B7D1',
                    borderColor: '#45B7D1',
                    borderWidth: 1
                }
            ];
        }
    } else if (currentCompareMode === 'models') {
        data = csvData.models;
        labels = data.map(d => d.model);

        if (currentTaskType === 'single') {
            datasets = [{
                label: 'Single-Choice Accuracy',
                data: data.map(d => parseFloat(d.single_choice_accuracy) * 100),
                backgroundColor: colorSchemes.models.slice(0, data.length),
                borderColor: colorSchemes.models.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'multiple') {
            datasets = [{
                label: 'Multiple-Choice Accuracy',
                data: data.map(d => parseFloat(d.multiple_choice_accuracy) * 100),
                backgroundColor: colorSchemes.models.slice(0, data.length),
                borderColor: colorSchemes.models.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'report') {
            datasets = [
                {
                    label: 'ROUGE-1',
                    data: data.map(d => parseFloat(d.R1) * 100),
                    backgroundColor: '#FF6B6B',
                    borderColor: '#FF6B6B',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-2',
                    data: data.map(d => parseFloat(d.R2) * 100),
                    backgroundColor: '#4ECDC4',
                    borderColor: '#4ECDC4',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-L',
                    data: data.map(d => parseFloat(d.RL) * 100),
                    backgroundColor: '#45B7D1',
                    borderColor: '#45B7D1',
                    borderWidth: 1
                }
            ];
        }
    } else if (currentCompareMode === 'patterns') {
        data = csvData.patterns;
        labels = data.map(d => d.design_pattern);

        if (currentTaskType === 'single') {
            datasets = [{
                label: 'Single-Choice Accuracy',
                data: data.map(d => parseFloat(d.single_choice_accuracy) * 100),
                backgroundColor: colorSchemes.patterns,
                borderColor: colorSchemes.patterns,
                borderWidth: 1
            }];
        } else if (currentTaskType === 'multiple') {
            datasets = [{
                label: 'Multiple-Choice Accuracy',
                data: data.map(d => parseFloat(d.multiple_choice_accuracy) * 100),
                backgroundColor: colorSchemes.patterns,
                borderColor: colorSchemes.patterns,
                borderWidth: 1
            }];
        } else if (currentTaskType === 'report') {
            datasets = [
                {
                    label: 'ROUGE-1',
                    data: data.map(d => parseFloat(d.R1) * 100),
                    backgroundColor: '#66C2A5',
                    borderColor: '#66C2A5',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-2',
                    data: data.map(d => parseFloat(d.R2) * 100),
                    backgroundColor: '#FC8D62',
                    borderColor: '#FC8D62',
                    borderWidth: 1
                },
                {
                    label: 'ROUGE-L',
                    data: data.map(d => parseFloat(d.RL) * 100),
                    backgroundColor: '#8DA0CB',
                    borderColor: '#8DA0CB',
                    borderWidth: 1
                }
            ];
        }
    }

    // Sort by first metric value
    if (datasets.length > 0) {
        const sortedIndices = datasets[0].data
            .map((value, index) => ({value, index}))
            .sort((a, b) => b.value - a.value)
            .map(item => item.index);

        labels = sortedIndices.map(i => labels[i]);
        datasets.forEach(dataset => {
            dataset.data = sortedIndices.map(i => dataset.data[i]);
            if (Array.isArray(dataset.backgroundColor)) {
                dataset.backgroundColor = sortedIndices.map(i => dataset.backgroundColor[i]);
                dataset.borderColor = sortedIndices.map(i => dataset.borderColor[i]);
            }
        });
    }

    return {labels, datasets};
}

function createChart() {
    const {labels, datasets} = getDataForCurrentFilters();

    if (!labels || labels.length === 0) {
        console.error('No data available for chart');
        return;
    }

    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = document.getElementById('chart-success-reward-rate');

    // Determine chart type based on compare mode
    const chartType = (currentCompareMode === 'patterns' && currentTaskType !== 'report') ? 'bar' : 'bar';

    chartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Noto Sans', sans-serif",
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: getXAxisTitle(),
                        font: {
                            size: 14,
                            family: "'Noto Sans', sans-serif",
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Noto Sans', sans-serif",
                            weight: 'bold'
                        }
                    },
                    title: {
                        display: true,
                        text: getYAxisTitle(),
                        font: {
                            size: 14,
                            family: "'Noto Sans', sans-serif",
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: "'Noto Sans', sans-serif",
                            weight: 'bold'
                        }
                    },
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.formattedValue + '%';
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function getXAxisTitle() {
    if (currentTaskType === 'report') {
        return 'ROUGE Score (%)';
    } else if (currentTaskType === 'single') {
        return 'Single-Choice Accuracy (%)';
    } else if (currentTaskType === 'multiple') {
        return 'Multiple-Choice Accuracy (%)';
    }
    return 'Performance (%)';
}

function getYAxisTitle() {
    if (currentCompareMode === 'agents') {
        return 'Data Agents';
    } else if (currentCompareMode === 'models') {
        return 'Models';
    } else if (currentCompareMode === 'patterns') {
        return 'Design Patterns';
    }
    return '';
}

// Event listeners for task type filters
document.querySelectorAll('.task-filter-selector .btn').forEach(btn => {
    if (!btn.disabled) {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.task-filter-selector .btn.active').forEach(active => {
                active.classList.remove('active');
            });

            // Add active class to clicked button
            btn.classList.add('active');

            // Update current task type
            if (btn.id === 'filter-by-single') {
                currentTaskType = 'single';
            } else if (btn.id === 'filter-by-multiple') {
                currentTaskType = 'multiple';
            } else if (btn.id === 'filter-by-report') {
                currentTaskType = 'report';
            }

            // Recreate chart
            createChart();
        });
    }
});

// Event listeners for compare mode filters
document.querySelectorAll('.compare-filter-selector .btn').forEach(btn => {
    if (!btn.disabled) {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.compare-filter-selector .btn.active').forEach(active => {
                active.classList.remove('active');
            });

            // Add active class to clicked button
            btn.classList.add('active');

            // Update current compare mode
            if (btn.id === 'compare-by-agents') {
                currentCompareMode = 'agents';
            } else if (btn.id === 'compare-by-models') {
                currentCompareMode = 'models';
            } else if (btn.id === 'compare-by-patterns') {
                currentCompareMode = 'patterns';
            }

            // Recreate chart
            createChart();
        });
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadCSVData();
    createChart();
});