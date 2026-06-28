// Emotional Needs Assessment - Core Logic & UI Control (Single Question Version)

// Configuration & Static Data
const CATEGORY_COLORS = [
    '#3b82f6', // 힘, 성취 (Blue)
    '#10b981', // 자유, 모험 (Green)
    '#f43f5e', // 관능 추구 (Rose)
    '#8b5cf6', // 휴식, 에너지 (Violet)
    '#f59e0b', // 즐거움 (Amber)
    '#64748b', // 안전, 생존 (Slate)
    '#ec4899'  // 친밀감, 소속 (Pink)
];

const OPTION_LABELS = ['전혀\n아니다', '아닌\n편이다', '보통\n이다', '그런\n편이다', '매우\n그렇다'];

const CATEGORY_DESCRIPTIONS = {
    "힘, 성취의 욕구": "목표 달성, 리더십, 타인의 인정, 자기 주장과 주도권을 중요하게 생각하는 욕구입니다. 에너지가 넘치고 상황을 통제하고 이끌어 나가는 데서 만족감을 얻지만, 때로 주위 사람들에게 권위적으로 보일 수 있습니다.",
    "자유와 모험의 욕구": "새로운 경험 탐색, 독립성, 변화와 도전, 얽매이지 않는 자유를 중요하게 생각하는 욕구입니다. 반복되는 일상보다는 미지의 영역을 개척하는 데 흥미를 느끼며 임기응변에 뛰어납니다.",
    "관능 추구의 욕구": "감각적인 즐거움, 열정적인 관계, 신체적 매력과 친밀감의 성적 측면을 중요하게 생각하는 욕구입니다. 감정에 솔직하고 열정적인 사랑과 삶의 활력을 추구합니다.",
    "휴식, 에너지 충족의 욕구": "체력 관리, 건강, 충분한 휴식과 수면, 신체 에너지의 균형을 중요하게 생각하는 욕구입니다. 자기 관리가 철저하며 신체 컨디션 조율과 삶의 안정적인 페이스 유지를 중요시합니다.",
    "즐거움의 욕구": "유머, 게임, 긍정적인 감정 교류, 타인을 기쁘게 하고 함께 즐거운 시간을 보내는 것을 중요하게 생각하는 욕구입니다. 낙천적인 성향으로 주변 사람들에게 에너지를 전달하며 어울림을 즐깁니다.",
    "안전과 생존의 욕구": "안정성, 계획성, 위험 회복 및 방지, 질서와 완벽주의를 통해 심리적 안전을 도모하는 욕구입니다. 돌발 상황을 피하기 위해 철저한 계획과 안정을 지향하며 조심성이 많습니다.",
    "친밀감과 소속의 욕구": "깊은 유대감, 가족과 친구 돌봄, 소속감, 정서적인 깊은 결합을 갈망하는 욕구입니다. 다른 이의 필요에 민감하며, 따뜻한 관심과 보살핌을 주고받을 때 큰 행복을 느낍니다."
};

// Application State
let surveyData = null;
let flatQuestions = [];
let answers = {};
let currentQuestionIndex = 0; // 0 to 69
let username = "";
let chartInstance = null;
let autoAdvanceTimer = null;

// DOM Elements
const introSection = document.getElementById('intro-section');
const surveySection = document.getElementById('survey-section');
const resultSection = document.getElementById('result-section');

const usernameInput = document.getElementById('username');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');

const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');

const pageIndicator = document.getElementById('page-indicator');
const categoryBadge = document.getElementById('category-badge');
const questionTextEl = document.getElementById('question-text');
const optionsRow = document.getElementById('options-row');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageStepIndicator = document.getElementById('page-step-indicator');

const resultUsername = document.getElementById('result-username');
const scoresList = document.getElementById('scores-list');
const primaryNeedTitle1 = document.getElementById('primary-need-title-1');
const primaryNeedDesc1 = document.getElementById('primary-need-desc-1');
const primaryNeedTitle2 = document.getElementById('primary-need-title-2');
const primaryNeedDesc2 = document.getElementById('primary-need-desc-2');
const reflectionAdvice = document.getElementById('reflection-advice');

const copyResultBtn = document.getElementById('copy-result-btn');
const printBtn = document.getElementById('print-btn');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadQuestions();
    checkSavedState();
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('ena_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('ena_theme', newTheme);
    if (chartInstance) updateChartTheme(newTheme);
}

// Load Questions from JSON File
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        surveyData = response.ok ? await response.json() : getFallbackQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
        surveyData = getFallbackQuestions();
    }
    parseQuestions();
    startBtn.removeAttribute('disabled');
}

function parseQuestions() {
    flatQuestions = [];
    let globalId = 1;
    surveyData.categories.forEach((cat, catIndex) => {
        cat.questions.forEach((q) => {
            flatQuestions.push({
                globalId: globalId++,
                category: cat.category,
                categoryIndex: catIndex,
                localId: q.id,
                text: q.text
            });
        });
    });
}

// Check if there is a saved state in localStorage
function checkSavedState() {
    const savedState = localStorage.getItem('ena_survey_state');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.answers && Object.keys(state.answers).length > 0) {
                resumeBtn.classList.remove('hidden');
                usernameInput.value = state.username || "";
            }
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
    }
}

// Event Listeners
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);

    startBtn.addEventListener('click', () => {
        username = usernameInput.value.trim() || "참여자";
        answers = {};
        currentQuestionIndex = 0;
        saveState();
        startSurvey();
    });

    resumeBtn.addEventListener('click', () => {
        const savedState = localStorage.getItem('ena_survey_state');
        if (savedState) {
            const state = JSON.parse(savedState);
            username = state.username || "참여자";
            answers = state.answers || {};
            currentQuestionIndex = state.currentQuestionIndex || 0;
            if (currentQuestionIndex >= flatQuestions.length) {
                currentQuestionIndex = flatQuestions.length - 1;
            }
            startSurvey();
        }
    });

    prevBtn.addEventListener('click', navigatePrev);
    nextBtn.addEventListener('click', navigateNext);

    copyResultBtn.addEventListener('click', copyTextResult);
    printBtn.addEventListener('click', () => window.print());
    restartBtn.addEventListener('click', resetSurvey);
}

// Navigation Logic
function startSurvey() {
    showSection('survey-section');
    renderQuestion();
}

function showSection(sectionId) {
    [introSection, surveySection, resultSection].forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render a single question for the current index
function renderQuestion() {
    if (flatQuestions.length === 0) return;

    const q = flatQuestions[currentQuestionIndex];
    const color = CATEGORY_COLORS[q.categoryIndex];
    const total = flatQuestions.length;

    // Category badge with category-specific color
    categoryBadge.textContent = q.category;
    categoryBadge.style.backgroundColor = color + '22';
    categoryBadge.style.color = color;
    categoryBadge.style.borderColor = color + '55';

    // Question number indicators
    pageIndicator.textContent = `${currentQuestionIndex + 1} / ${total}`;
    pageStepIndicator.textContent = `${currentQuestionIndex + 1} / ${total}`;

    // Animate question text swap
    questionTextEl.classList.remove('question-slide-in');
    void questionTextEl.offsetWidth; // force reflow to restart animation
    questionTextEl.textContent = q.text;
    questionTextEl.classList.add('question-slide-in');

    // Render option buttons
    optionsRow.innerHTML = '';
    const savedVal = answers[q.globalId];

    for (let val = 1; val <= 5; val++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'option-wrapper';

        const btn = document.createElement('button');
        btn.className = 'single-option-btn';
        if (savedVal === val) btn.classList.add('selected');
        btn.textContent = val;
        btn.setAttribute('data-value', val);
        btn.addEventListener('click', () => handleSingleSelect(q.globalId, val));

        const label = document.createElement('span');
        label.className = 'option-label';
        label.textContent = OPTION_LABELS[val - 1];

        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        optionsRow.appendChild(wrapper);
    }

    // Navigation button states
    prevBtn.disabled = currentQuestionIndex === 0;

    const isLast = currentQuestionIndex === total - 1;
    const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
    nextBtn.innerHTML = isLast ? `결과 보기 ${arrowSvg}` : `다음 ${arrowSvg}`;
    nextBtn.disabled = !savedVal;

    updateProgress();
}

// Handle option selection — save answer and auto-advance
function handleSingleSelect(globalId, value) {
    answers[globalId] = value;

    // Update button visual state immediately
    const buttons = optionsRow.querySelectorAll('.single-option-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.getAttribute('data-value')) === value);
    });

    saveState();
    updateProgress();
    nextBtn.disabled = false;

    // Auto-advance after short visual feedback delay
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
        navigateNext();
    }, 380);
}

// Update progress bar and text
function updateProgress() {
    const answeredCount = Object.keys(answers).length;
    const percent = Math.round((answeredCount / flatQuestions.length) * 100);

    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${answeredCount} / ${flatQuestions.length}문항 완료`;
    progressPercent.textContent = `${percent}%`;
}

function navigatePrev() {
    clearTimeout(autoAdvanceTimer);
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function navigateNext() {
    const currentQ = flatQuestions[currentQuestionIndex];
    if (!answers[currentQ.globalId]) return;

    if (currentQuestionIndex < flatQuestions.length - 1) {
        currentQuestionIndex++;
        saveState();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showResults();
    }
}

// State Management
function saveState() {
    localStorage.setItem('ena_survey_state', JSON.stringify({
        username,
        answers,
        currentQuestionIndex
    }));
}

function resetSurvey() {
    if (confirm("정말 처음부터 다시 검사를 시작하시겠습니까? 저장된 기록이 사라집니다.")) {
        localStorage.removeItem('ena_survey_state');
        resumeBtn.classList.add('hidden');
        usernameInput.value = "";
        answers = {};
        currentQuestionIndex = 0;
        showSection('intro-section');
    }
}

// Results Calculation & Presentation
function showResults() {
    showSection('result-section');
    resultUsername.textContent = username;

    const categoryScores = [];
    surveyData.categories.forEach((cat, catIdx) => {
        let sum = 0;
        const catQuestions = flatQuestions.filter(q => q.category === cat.category);
        catQuestions.forEach(q => { sum += answers[q.globalId] || 0; });

        categoryScores.push({
            name: cat.category,
            avg: parseFloat((sum / 10).toFixed(2)),
            color: CATEGORY_COLORS[catIdx],
            index: catIdx
        });
    });

    const sortedScores = [...categoryScores].sort((a, b) => b.avg - a.avg);
    const top1 = sortedScores[0];
    const top2 = sortedScores[1];

    // Render score list
    scoresList.innerHTML = '';
    categoryScores.forEach(score => {
        const percent = (score.avg / 5) * 100;
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        scoreItem.innerHTML = `
            <div class="score-info">
                <span class="score-name">${score.name}</span>
                <span class="score-value" style="color: ${score.color}">${score.avg} / 5.0</span>
            </div>
            <div class="score-bar-bg">
                <div class="score-bar-fill" style="width: ${percent}%; background-color: ${score.color}"></div>
            </div>
        `;
        scoresList.appendChild(scoreItem);
    });

    primaryNeedTitle1.textContent = `1순위: ${top1.name} (평균 ${top1.avg}점)`;
    primaryNeedDesc1.textContent = CATEGORY_DESCRIPTIONS[top1.name];

    primaryNeedTitle2.textContent = `2순위: ${top2.name} (평균 ${top2.avg}점)`;
    primaryNeedDesc2.textContent = CATEGORY_DESCRIPTIONS[top2.name];

    reflectionAdvice.textContent = generateReflectionAdvice(top1, top2, categoryScores);

    renderRadarChart(categoryScores);
}

function generateReflectionAdvice(top1, top2, scores) {
    let advice = "";

    if (top1.avg >= 4.0 && top2.avg >= 4.0) {
        advice = `${username}님은 대인관계에서 '${top1.name}'와 '${top2.name}'에 대한 동기가 매우 뚜렷하게 발달해 있습니다. 이 두 욕구는 삶의 강력한 엔진이 되지만, 강도가 높은 만큼 좌절되었을 때 실망감이나 스트레스도 크게 올 수 있습니다. 욕구 충족을 위해 타인을 지나치게 압박하거나 혼자서만 애쓰고 있지 않은지 점검해보세요.`;
    } else if (top1.avg - scores[scores.length - 1].avg <= 1.0) {
        advice = `${username}님은 7가지 정서적 욕구가 전반적으로 평탄하고 균형 잡힌 분포를 보이고 있습니다. 특정한 하나의 욕구에 지나치게 편중되지 않아 주변 상황이나 관계 변화에 유연하게 대처할 수 있는 장점이 있습니다. 다만, 때로는 본인이 진정으로 원하고 양보할 수 없는 핵심 욕구가 무엇인지 명확히 선언하고 주장하는 연습이 필요할 수 있습니다.`;
    } else {
        advice = `${username}님의 핵심적인 관계 욕구는 '${top1.name}'입니다. 일상과 대인관계 속에서 이 욕구가 안전하게 채워질 때 심리적 안정감과 큰 만족감을 느끼게 됩니다. 상대방에게도 본인의 이러한 욕구를 건강한 방식으로 표현하고 소통하면 한층 더 풍요로운 관계를 맺으실 수 있습니다.`;
    }

    const safetyScore = scores.find(s => s.name === "안전과 생존의 욕구").avg;
    const freedomScore = scores.find(s => s.name === "자유와 모험의 욕구").avg;

    if (safetyScore >= 3.8 && freedomScore <= 2.2) {
        advice += ` 특히 '안전과 생존'에 비해 '자유와 모험'의 욕구가 현저히 낮아, 지나치게 통제 중심적이거나 모험을 극도로 회피하고 계실 수 있습니다. 가끔은 사소한 일탈이나 계획하지 않은 무작위의 즐거움을 수용해 보는 시도를 추천드립니다.`;
    } else if (freedomScore >= 3.8 && safetyScore <= 2.2) {
        advice += ` 특히 '자유와 모험'의 욕구는 높으나 '안전과 생존'의 욕구가 낮아, 규칙적이고 통제된 환경에서 심한 답답함이나 책임 회피 경향을 보일 수 있습니다. 본인의 장점인 창의성을 살리되, 기본적인 약속과 울타리를 지키는 인내심을 훈련하는 것이 좋습니다.`;
    }

    return advice;
}

// Chart.js Radar Render
function renderRadarChart(scores) {
    const ctx = document.getElementById('radarChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: scores.map(s => s.name),
            datasets: [{
                label: `${username}님의 욕구 분포`,
                data: scores.map(s => s.avg),
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6',
                pointRadius: 4,
                pointHitRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}점`
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { color: angleLineColor },
                    grid: { color: gridColor },
                    pointLabels: {
                        color: textColor,
                        font: { family: 'Noto Sans KR', size: 12, weight: '600' }
                    },
                    ticks: {
                        color: textColor,
                        backdropColor: 'transparent',
                        font: { size: 10 }
                    },
                    min: 1,
                    max: 5,
                    stepSize: 1
                }
            }
        }
    });
}

function updateChartTheme(theme) {
    if (!chartInstance) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

    chartInstance.options.scales.r.pointLabels.color = textColor;
    chartInstance.options.scales.r.ticks.color = textColor;
    chartInstance.options.scales.r.grid.color = gridColor;
    chartInstance.options.scales.r.angleLines.color = angleLineColor;
    chartInstance.update();
}

// Copy Results to Clipboard
function copyTextResult() {
    let text = `[관계상의 정서적 욕구 파악 검사 결과 보고서]\n`;
    text += `참여자: ${username} 님\n\n`;
    text += `■ 욕구별 상세 평균 점수 (5.0 만점)\n`;

    scoresList.querySelectorAll('.score-item').forEach(item => {
        const name = item.querySelector('.score-name').textContent;
        const val = item.querySelector('.score-value').textContent;
        text += `- ${name}: ${val}\n`;
    });

    text += `\n■ 주요 정서적 욕구\n`;
    text += `- 1순위: ${primaryNeedTitle1.textContent.split(': ')[1]}\n`;
    text += `  설명: ${primaryNeedDesc1.textContent}\n`;
    text += `- 2순위: ${primaryNeedTitle2.textContent.split(': ')[1]}\n`;
    text += `  설명: ${primaryNeedDesc2.textContent}\n\n`;
    text += `■ 정서적 욕구 균형을 위한 제안\n`;
    text += `${reflectionAdvice.textContent}\n\n`;
    text += `* 온라인 관계상의 정서적 욕구 파악 검사`;

    navigator.clipboard.writeText(text).then(() => {
        alert("결과가 클립보드에 복사되었습니다! 메모장이나 SNS에 붙여넣어 보세요.");
    }).catch(() => {
        alert("클립보드 복사에 실패했습니다. 텍스트를 직접 드래그하여 복사해 주세요.");
    });
}

// Fallback Questions Data
function getFallbackQuestions() {
    return {
        "title": "관계상의 정서적 욕구 파악 검사",
        "description": "본 검사는 대인관계 및 일상생활에서 나타나는 여러분의 정서적 욕구를 파악하기 위한 도구입니다. 각 문항을 읽고 자신에게 해당하는 정도를 솔직하게 응답해 주세요.",
        "categories": [
            {
                "category": "힘, 성취의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 목표를 성취하기 위해 완전히 몰입하는 스타일이다." },
                    { "id": 2, "text": "나는 옳지 않은 일을 보면 몹시 분개하여 그냥 지나치지 못할 때가 많다." },
                    { "id": 3, "text": "나는 다른 사람에게 지시나 충고를 잘 하는 편이다." },
                    { "id": 4, "text": "나는 다른 사람의 지시나 명령을 받으면 마음이 불편해진다." },
                    { "id": 5, "text": "나는 집단 내에서 리더의 역할을 하는 것이 좋다." },
                    { "id": 6, "text": "나는 내가 성취한 것을 다른 사람에게 인정받고 싶은 욕구가 강하다." },
                    { "id": 7, "text": "반대 의견에 부딪혔을 때 나는 쉽게 뒤로 물러서지 않는다." },
                    { "id": 8, "text": "나는 목표를 성취해 냈을 때 강한 희열을 느낀다." },
                    { "id": 9, "text": "경제적으로 성공하는 것이 내게는 무엇보다도 중요하다." },
                    { "id": 10, "text": "나는 때때로 권위적으로 될 때가 있다." }
                ]
            },
            {
                "category": "자유와 모험의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 뭔가 새로운 것을 배우기를 좋아한다." },
                    { "id": 2, "text": "나는 내 자신의 자유로운 선택의 능력을 믿는다." },
                    { "id": 3, "text": "나는 반복되는 일에는 쉽게 싫증을 느끼는 편이다." },
                    { "id": 4, "text": "나는 매사에 호기심이 많은 편이다." },
                    { "id": 5, "text": "나는 내 삶에서 예측 가능한 것들에는 별로 흥미가 안생긴다." },
                    { "id": 6, "text": "나는 낯선 곳을 여행하고 새로운 것에 도전하는 데 별 두려움이 없는 편이다." },
                    { "id": 7, "text": "나는 안정성보다는 가능성을 추구하는 성향이 있다." },
                    { "id": 8, "text": "나는 임기응변에 강한 편이다." },
                    { "id": 9, "text": "나는 일단 뭔가를 배우고 나면 또 뭔가 익힐 새로운 것을 찾아 나선다." },
                    { "id": 10, "text": "나는 새로운 환경에 잘 적응하는 편이다." }
                ]
            },
            {
                "category": "관능 추구의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 솔직히 성적인 욕구가 왕성한 편이다" },
                    { "id": 2, "text": "나는 혼자 있을 때 성적인 상상을 자주 한다." },
                    { "id": 3, "text": "나는 연인 또는 부부관계에서 성적인 즐거움을 나누는 것이 중요하다고 생각한다." },
                    { "id": 4, "text": "나는 쉽게 성적으로 흥분하는 편이다" },
                    { "id": 5, "text": "나는 열정적인 사랑을 꿈꾼다" },
                    { "id": 6, "text": "나는 여러 상황에서 성적인 가능성을 찾는다." },
                    { "id": 7, "text": "나는 진정으로 성관계를 즐기기 위해 새로운 성적 시도를 하고 싶다" },
                    { "id": 8, "text": "나는 자위행위를 자주 하는 편이다." },
                    { "id": 9, "text": "나는 일단 성적인 충동을 느끼면 참기가 어렵다" },
                    { "id": 10, "text": "나는 지금보다 성관계를 더 많이 하고 싶다." }
                ]
            },
            {
                "category": "휴식, 에너지 충족의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 평상 시 체력에 자신이 있는 편이다." },
                    { "id": 2, "text": "나는 지쳤다가도 에너지 재충전을 잘 하는 편이다." },
                    { "id": 3, "text": "나는 너무 피로해지지 않도록 생활을 잘 조절하는 편이다" },
                    { "id": 4, "text": "나는 밤에 충분한 수면을 취하는 편이다" },
                    { "id": 5, "text": "나는 자신의 건강 유지에 매우 관심이 많다" },
                    { "id": 6, "text": "나는 비타민이나 영양제를 잘 복용하는 편이다" },
                    { "id": 7, "text": "나는 자기관리를 철저히 하는 편이다" },
                    { "id": 8, "text": "나는 목표를 이루기 위한 의욕이 넘친다" },
                    { "id": 9, "text": "나는 균형 잡힌 식사, 규칙적인 운동을 하려고 노력한다" },
                    { "id": 10, "text": "나는 기본적인 신체적 욕구를 매우 중요시한다." }
                ]
            },
            {
                "category": "즐거움의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 매사에 낙관적인 편이다" },
                    { "id": 2, "text": "나는 다른 사람의 실수에 관대한 편이다" },
                    { "id": 3, "text": "나는 대체로 태평하고 느긋한 상태를 즐기는 편이다" },
                    { "id": 4, "text": "나는 여러 사람들과 함께 있는 것이 좋다." },
                    { "id": 5, "text": "나는 다른 사람들을 기쁘게 하는 것이 좋다" },
                    { "id": 6, "text": "나는 아이들과 장난치며 노는 것이 좋다" },
                    { "id": 7, "text": "나는 큰 소리로 웃기를 좋아한다." },
                    { "id": 8, "text": "나는 농담을 주고 받는 것을 즐기는 편이다" },
                    { "id": 9, "text": "나는 게임이나 놀이를 다른 사람과 함께 하기를 좋아한다" },
                    { "id": 10, "text": "영화나 드라마를 보고 난 뒤에 다른 사람에게 말해주는 것을 좋아한다." }
                ]
            },
            {
                "category": "안전과 생존의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 매사에 보수적인 사람이다" },
                    { "id": 2, "text": "나는 세상은 위험한 곳이라고 생각한다" },
                    { "id": 3, "text": "가족을 안전하게 보호하는 것이 나의 중요한 역할이라고 생각한다" },
                    { "id": 4, "text": "나는 대충 넘어가지 못하는 완벽주의자다" },
                    { "id": 5, "text": "위험한 상황에 빠졌을 때를 대비하여 늘 준비를 철저히 한다" },
                    { "id": 6, "text": "일상생활에도 이런 저런 위험에 대해서 염려하고 걱정하는 편이다" },
                    { "id": 7, "text": "나는 가능하면 모험이나 변화를 피하는 편이다" },
                    { "id": 8, "text": "나는 갑작스러운 실수를 피하기 위해 늘 주변을 통제하려 한다" },
                    { "id": 9, "text": "나는 경제적인 안정감을 취하는 것이 가장 중요하다" },
                    { "id": 10, "text": "나는 어떤 일들이 계획대로 되지 않을 때 매우 불쾌해진다" }
                ]
            },
            {
                "category": "친밀감과 소속의 욕구",
                "questions": [
                    { "id": 1, "text": "나는 다른 사람들을 돌보는 것이 좋다" },
                    { "id": 2, "text": "나는 종종 다른 사람들의 요구를 잘 알아차린다" },
                    { "id": 3, "text": "나는 아이들이 성장해 가는 것을 보는 것이 좋다" },
                    { "id": 4, "text": "단란한 가정을 꾸미는 것은 나에게 중요하다" },
                    { "id": 5, "text": "나는 연인, 배우자와 많은 것을 나누고 싶다" },
                    { "id": 6, "text": "나는 부모 혹은 양육자(caregiver)로서의 역할을 잘하는 것 같다" },
                    { "id": 7, "text": "나는 내가 혼자라고 느낄 때 외롭고 슬프다" },
                    { "id": 8, "text": "나는 새로운 친구를 사귀는 것을 잘 하는 편이다" },
                    { "id": 9, "text": "인생에서의 가장 중요한 성취는 가족을 꾸리고 아이를 잘 키우는 것이라고 생각한다" },
                    { "id": 10, "text": "나는 관계의 친밀함을 위한 단란한 시간에 매우 가치를 둔다" }
                ]
            }
        ]
    };
}
