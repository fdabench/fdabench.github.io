// Global variables
let chartInstance = null;
let currentTaskType = 'single'; // single, multiple, report
let currentCompareMode = 'agents'; // agents, models, patterns
let csvData = {
    methods: null,
    models: null,
    patterns: null,
    allPatterns: null
};

// Color schemes for different entities
const colorSchemes = {
    agents: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#74B9FF', '#F39C12', '#E74C3C'
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
    report: 'RS' // Rubric Score for report tasks
};

// Data agent names mapping
const agentNames = {
    'MLE-STAR (2025.11.4)': 'MLE-STAR (2025.11.4)',
    'Teable (2025.11.4)': 'Teable (2025.11.4)',
    'DeepAnalyze (2025.11.4)': 'DeepAnalyze (2025.11.4)',
    'Taiji (2025.11.4)': 'Taiji (2025.11.4)',
    'AOP (2025.11.4)': 'AOP (2025.11.4)',
    'AgenticData (2025.11.4)': 'AgenticData (2025.11.4)',
    'ByteBrain-Agent (2025.11.5)': 'ByteBrain-Agent (2025.11.5)',
    'Data Analysis Agent (ByteDance Lark Base & Hydra & NovaBase Team)': 'Data Analysis Agent (ByteDance Lark Base & Hydra & NovaBase Team)'
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
    let links = [];

    if (currentCompareMode === 'agents') {
        data = csvData.methods;

        // Filter out agents without data for the current task type
        if (currentTaskType === 'single') {
            data = data.filter(d => d.EX_SC && d.EX_SC.trim() !== '');
            labels = data.map(d => d.Method);
            datasets = [{
                label: 'Execution Accuracy (Single-Choice)',
                data: data.map(d => parseFloat(d.EX_SC) * 100),
                backgroundColor: colorSchemes.agents.slice(0, data.length),
                borderColor: colorSchemes.agents.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'multiple') {
            data = data.filter(d => d.EX_MC && d.EX_MC.trim() !== '');
            labels = data.map(d => d.Method);
            datasets = [{
                label: 'Execution Accuracy (Multiple-Choice)',
                data: data.map(d => parseFloat(d.EX_MC) * 100),
                backgroundColor: colorSchemes.agents.slice(0, data.length),
                borderColor: colorSchemes.agents.slice(0, data.length),
                borderWidth: 1
            }];
        } else if (currentTaskType === 'report') {
            data = data.filter(d => d.RS && d.RS.trim() !== '');
            labels = data.map(d => d.Method);
            datasets = [{
                label: 'Rubric Score (RS)',
                data: data.map(d => parseFloat(d.RS) * 100),
                backgroundColor: colorSchemes.agents.slice(0, data.length),
                borderColor: colorSchemes.agents.slice(0, data.length),
                borderWidth: 1
            }];
        }
        links = data.map(d => (d.link && d.link.trim() !== '') ? d.link.trim() : '');
    } else if (currentCompareMode === 'models') {
        data = csvData.models;
        labels = data.map(d => d.model + ' (2025.11.4)');

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
            datasets = [{
                label: 'Rubric Score (RS)',
                data: data.map(d => parseFloat(d.RS) * 100),
                backgroundColor: colorSchemes.models.slice(0, data.length),
                borderColor: colorSchemes.models.slice(0, data.length),
                borderWidth: 1
            }];
        }
    } else if (currentCompareMode === 'patterns') {
        data = csvData.patterns;
        labels = data.map(d => d.design_pattern + ' (2025.11.4)');

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
            datasets = [{
                label: 'Rubric Score (RS)',
                data: data.map(d => parseFloat(d.RS) * 100),
                backgroundColor: colorSchemes.patterns,
                borderColor: colorSchemes.patterns,
                borderWidth: 1
            }];
        }
    }

    // Sort by first metric value
    if (datasets.length > 0) {
        const sortedIndices = datasets[0].data
            .map((value, index) => ({value, index}))
            .sort((a, b) => b.value - a.value)
            .map(item => item.index);

        labels = sortedIndices.map(i => labels[i]);
        if (links.length > 0) {
            links = sortedIndices.map(i => links[i]);
        }
        datasets.forEach(dataset => {
            dataset.data = sortedIndices.map(i => dataset.data[i]);
            if (Array.isArray(dataset.backgroundColor)) {
                dataset.backgroundColor = sortedIndices.map(i => dataset.backgroundColor[i]);
                dataset.borderColor = sortedIndices.map(i => dataset.borderColor[i]);
            }
        });
    }

    return {labels, datasets, links};
}

// Wrap a long category label onto a few short lines so it does not widen the
// y-axis gutter and push the bars to the right. Short labels are left as-is.
function wrapLabel(label) {
    if (typeof label !== 'string' || label.length <= 34) {
        return label;
    }
    const maxLen = 24;
    const words = label.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
        if (current && (current + ' ' + word).length > maxLen) {
            lines.push(current);
            current = word;
        } else {
            current = current ? current + ' ' + word : word;
        }
    });
    if (current) {
        lines.push(current);
    }
    return lines;
}

// Resolve the category index under a pointer event. Bars report it directly;
// clicks in the left label gutter are mapped through the category (y) scale.
function indexFromEvent(event, elements, chart, count) {
    if (elements.length > 0) {
        return elements[0].index;
    }
    if (chart && chart.chartArea && event.x != null && event.x < chart.chartArea.left) {
        const v = chart.scales.y.getValueForPixel(event.y);
        if (v != null && isFinite(v)) {
            return Math.max(0, Math.min(count - 1, Math.round(v)));
        }
    }
    return -1;
}

function createChart() {
    const {labels, datasets, links} = getDataForCurrentFilters();

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
            labels: labels.map(wrapLabel),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            onClick: function(event, elements, chart) {
                const idx = indexFromEvent(event, elements, chart, labels.length);
                const url = idx >= 0 && links && links[idx];
                if (url) {
                    window.open(url, '_blank', 'noopener');
                }
            },
            onHover: function(event, elements, chart) {
                const target = event.native && event.native.target;
                if (!target) return;
                const idx = indexFromEvent(event, elements, chart, labels.length);
                target.style.cursor = (idx >= 0 && links && links[idx]) ? 'pointer' : 'default';
            },
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
                        },
                        align: 'center'
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
                    display: false,  // single metric per task type; axis title states the metric
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
                        },
                        afterLabel: function(context) {
                            if (links && links[context.dataIndex]) {
                                return 'Click to open product page';
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

function getXAxisTitle() {
    if (currentTaskType === 'report') {
        return 'Rubric Score (RS, %)';
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