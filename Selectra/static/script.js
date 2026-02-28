/**
 * ════════════════════════════════════════════════════
 * SELECTRA – AI Decision Intelligence Platform (Frontend)
 * "Where interviews meet insight."
 *
 * Connects to Flask backend via fetch() API
 * Handles: Landing Page, Login, Chat, Live Scorecard,
 *          XAI Panel, Suggestions, Report Generation
 * ════════════════════════════════════════════════════
 */

// ─── State ───
const state = {
  sessionId: "session_" + Date.now(),
  user: null,
  role: "general",
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  isWaiting: false,
  interviewComplete: false,
  reportData: null,
  latestScores: null,
  latestSuggestions: null,
  latestExplanations: null,
  readiness: null,
};

// ─── DOM References ───
const $ = (id) => document.getElementById(id);

const DOM = {
  // Landing
  landingPage: $("landingPage"),
  mainNav: $("mainNav"),
  navStartBtn: $("navStartBtn"),
  heroStartBtn: $("heroStartBtn"),
  heroLearnBtn: $("heroLearnBtn"),
  // Login
  loginScreen: $("loginScreen"),
  loginName: $("loginName"),
  loginEmail: $("loginEmail"),
  loginRole: $("loginRole"),
  loginBtn: $("loginBtn"),
  // App
  appContainer: $("appContainer"),
  headerUser: $("headerUser"),
  themeToggle: $("themeToggle"),
  logoutBtn: $("logoutBtn"),
  // Chat
  chatMessages: $("chatMessages"),
  answerInput: $("answerInput"),
  sendBtn: $("sendBtn"),
  inputHint: $("inputHint"),
  // Sidebar (Right Scorecard)
  progressText: $("progressText"),
  progressDetail: $("progressDetail"),
  progressRingFill: $("progressRingFill"),
  progressRingText: $("progressRingText"),
  overallScoreCard: $("overallScoreCard"),
  overallScoreValue: $("overallScoreValue"),
  scoresContainer: $("scoresContainer"),
  readinessBadge: $("readinessBadge"),
  suggestionsContainer: $("suggestionsContainer"),
  xaiPanel: $("xaiPanel"),
  // Report
  reportSection: $("reportSection"),
  reportContent: $("reportContent"),
};

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  initLandingPage();
  // Check for Vaultoo URL params first (auto-login from Vaultoo dashboard)
  checkVaultooParams();
  checkExistingSession();
  restoreVaultooSession();
});

function bindEvents() {
  // Landing page buttons
  DOM.navStartBtn.addEventListener("click", showLogin);
  DOM.heroStartBtn.addEventListener("click", showLogin);
  DOM.heroLearnBtn.addEventListener("click", () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
  });

  // Login
  DOM.loginBtn.addEventListener("click", handleLogin);

  // Chat
  DOM.sendBtn.addEventListener("click", sendAnswer);
  DOM.logoutBtn.addEventListener("click", handleLogout);

  DOM.answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  });

  // Auto-resize textarea
  DOM.answerInput.addEventListener("input", () => {
    DOM.answerInput.style.height = "auto";
    DOM.answerInput.style.height = DOM.answerInput.scrollHeight + "px";
  });

  // Login form enter key
  DOM.loginEmail.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  DOM.loginRole.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
}

// ═══════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════

function initLandingPage() {
  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      DOM.mainNav.classList.add("scrolled");
    } else {
      DOM.mainNav.classList.remove("scrolled");
    }
  });

  // Fade-in on scroll (Intersection Observer)
  const fadeElements = document.querySelectorAll(".fade-in-section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  fadeElements.forEach((el) => observer.observe(el));
}

function showLogin() {
  DOM.loginScreen.classList.add("active");
  DOM.loginName.focus();
}

function hideLogin() {
  DOM.loginScreen.classList.remove("active");
}

function hideLandingPage() {
  DOM.landingPage.style.display = "none";
  DOM.mainNav.style.display = "none";
}

function showLandingPage() {
  DOM.landingPage.style.display = "block";
  DOM.mainNav.style.display = "flex";
}

// ═══════════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════════

function checkExistingSession() {
  const saved = localStorage.getItem("selectra_user");
  if (saved) {
    state.user = JSON.parse(saved);
    state.role = localStorage.getItem("selectra_role") || "general";
    hideLandingPage();
    hideLogin();
    startApp();
  }
}

function handleLogout() {
  if (state.answers.length > 0 && !state.interviewComplete) {
    if (
      !confirm(
        "You have an interview in progress. Are you sure you want to logout?",
      )
    )
      return;
  }
  localStorage.removeItem("selectra_user");
  localStorage.removeItem("selectra_role");
  state.user = null;
  state.role = "general";
  state.questions = [];
  state.answers = [];
  state.currentQuestionIndex = 0;
  state.isWaiting = false;
  state.interviewComplete = false;
  state.reportData = null;
  state.latestScores = null;
  state.latestSuggestions = null;
  state.latestExplanations = null;
  state.readiness = null;
  state.sessionId = "session_" + Date.now();

  DOM.chatMessages.innerHTML = "";
  DOM.answerInput.value = "";
  DOM.answerInput.disabled = true;
  DOM.sendBtn.disabled = true;
  DOM.inputHint.textContent = "Waiting to start...";
  DOM.loginName.value = "";
  DOM.loginEmail.value = "";
  DOM.loginRole.value = "general";

  DOM.appContainer.classList.remove("active");
  DOM.appContainer.style.display = "none";
  DOM.reportSection.classList.remove("active");
  DOM.reportSection.style.display = "none";
  showLandingPage();
}

// ═══════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════

function handleLogin() {
  const name = DOM.loginName.value.trim();
  const email = DOM.loginEmail.value.trim();

  if (!name || !email) {
    shakeElement(DOM.loginBtn);
    return;
  }

  if (!email.includes("@")) {
    shakeElement(DOM.loginEmail);
    return;
  }

  state.user = { name, email };
  state.role = DOM.loginRole.value;
  localStorage.setItem("selectra_user", JSON.stringify(state.user));
  localStorage.setItem("selectra_role", state.role);
  hideLogin();
  hideLandingPage();
  startApp();
}

function shakeElement(el) {
  el.style.animation = "none";
  el.offsetHeight; // trigger reflow
  el.style.animation = "shake 0.4s ease";
  setTimeout(() => {
    el.style.animation = "";
  }, 400);
}

// ═══════════════════════════════════════════════
// APP START
// ═══════════════════════════════════════════════

async function startApp() {
  DOM.appContainer.classList.add("active");
  DOM.headerUser.textContent = state.user.name;

  // Fetch questions from backend
  try {
    const res = await fetch(
      `/api/questions?role=${state.role}&sessionId=${state.sessionId}`,
    );
    const data = await res.json();
    state.questions = data.questions;
  } catch (err) {
    addMessage("ai", "⚠️ Failed to load questions. Please refresh the page.");
    return;
  }

  // Role label for display
  const roleLabels = {
    frontend: "Frontend Developer",
    backend: "Backend Developer",
    fullstack: "Full Stack Developer",
    data_science: "Data Science / ML",
    devops: "DevOps / Cloud",
    cybersecurity: "Cybersecurity",
    general: "General",
  };
  const roleDisplay = roleLabels[state.role] || state.role;

  // Welcome message
  addMessage(
    "ai",
    `Welcome to <strong>Selectra</strong>, ${state.user.name}! 🎯<br><br>
        I'm your AI Interview Agent. You've selected the <strong>${roleDisplay}</strong> track.<br>
        I'll ask you <strong>${state.questions.length} questions</strong> tailored to this role 
        and provide real-time scoring with explainable feedback.<br><br>
        Let's begin when you're ready!`,
  );

  setTimeout(() => askNextQuestion(), 1200);
}

// ═══════════════════════════════════════════════
// CHAT – MESSAGE HANDLING
// ═══════════════════════════════════════════════

function addMessage(sender, content, category) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "ai" ? "S" : state.user.name[0].toUpperCase();

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (category) {
    const catBadge = document.createElement("div");
    catBadge.className = "question-category";
    catBadge.textContent = category;
    bubble.appendChild(catBadge);
  }

  const textSpan = document.createElement("div");
  textSpan.innerHTML = content;
  bubble.appendChild(textSpan);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  DOM.chatMessages.appendChild(msgDiv);

  scrollToBottom();
  return bubble;
}

function addTypingIndicator() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message ai";
  msgDiv.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "S";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  bubble.appendChild(typing);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  DOM.chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function scrollToBottom() {
  setTimeout(() => {
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
  }, 50);
}

// ═══════════════════════════════════════════════
// INTERVIEW FLOW
// ═══════════════════════════════════════════════

function askNextQuestion() {
  if (state.currentQuestionIndex >= state.questions.length) {
    finishInterview();
    return;
  }

  const q = state.questions[state.currentQuestionIndex];
  addMessage(
    "ai",
    `<strong>Question ${q.id} of ${state.questions.length}:</strong><br>${q.text}`,
    q.category,
  );

  DOM.answerInput.disabled = false;
  DOM.sendBtn.disabled = false;
  DOM.answerInput.focus();
  DOM.inputHint.textContent = `Question ${q.id} of ${state.questions.length} · Press Enter to submit`;
}

async function sendAnswer() {
  if (state.isWaiting || state.interviewComplete) return;

  const answer = DOM.answerInput.value.trim();
  if (!answer) return;

  const question = state.questions[state.currentQuestionIndex];

  // Log to Vaultoo
  logVaultooActivity(
    "ANSWER_SUBMITTED",
    "/interview",
    `Q${state.currentQuestionIndex + 1}: ${question.text.substring(0, 50)}...`,
  );

  // Show user message
  addMessage("user", answer);
  DOM.answerInput.value = "";
  DOM.answerInput.style.height = "auto";
  DOM.answerInput.disabled = true;
  DOM.sendBtn.disabled = true;
  state.isWaiting = true;

  // Typing indicator
  addTypingIndicator();

  try {
    // Send to backend
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        questionId: question.id,
        answer: answer,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Evaluation failed");
    }

    removeTypingIndicator();

    // Store response
    state.answers.push({
      question,
      answer,
      scores: data.scores,
      explanations: data.explanations,
      suggestions: data.suggestions,
      signals: data.signals,
      runningAverages: data.runningAverages,
      readiness: data.readiness,
    });

    state.latestScores = data.scores;
    state.latestSuggestions = data.suggestions;
    state.latestExplanations = data.explanations;
    state.readiness = data.readiness;

    // Show feedback message
    showFeedbackMessage(data);

    // Update sidebar
    updateSidebar(data);

    // Move to next question
    state.currentQuestionIndex++;
    state.isWaiting = false;

    setTimeout(() => askNextQuestion(), 1500);
  } catch (err) {
    removeTypingIndicator();
    addMessage("ai", `⚠️ Error: ${err.message}. Please try again.`);
    DOM.answerInput.disabled = false;
    DOM.sendBtn.disabled = false;
    state.isWaiting = false;
  }
}

function showFeedbackMessage(data) {
  const avg =
    (data.scores.clarity +
      data.scores.accuracy +
      data.scores.completeness +
      data.scores.confidence) /
    4;

  let feedbackClass, feedbackText;
  if (avg >= 7) {
    feedbackClass = "feedback-great";
    feedbackText = "Excellent response! 🌟";
  } else if (avg >= 4.5) {
    feedbackClass = "feedback-good";
    feedbackText = "Good answer 👍";
  } else {
    feedbackClass = "feedback-improve";
    feedbackText = "Room for improvement 📝";
  }

  const bubble = addMessage(
    "ai",
    `${feedbackText}<br><br>` +
      `<strong>Scores:</strong> ` +
      `Clarity ${data.scores.clarity}/10 · ` +
      `Accuracy ${data.scores.accuracy}/10 · ` +
      `Completeness ${data.scores.completeness}/10 · ` +
      `Confidence ${data.scores.confidence}/10`,
  );

  const badge = document.createElement("span");
  badge.className = `answer-feedback ${feedbackClass}`;
  badge.textContent = `Average: ${avg.toFixed(1)}/10`;
  bubble.appendChild(badge);
}

// ═══════════════════════════════════════════════
// SIDEBAR UPDATES
// ═══════════════════════════════════════════════

function updateSidebar(data) {
  updateProgress();
  updateScoreBars(data.runningAverages);
  updateOverallScore(data.runningAverages.overall);
  updateReadinessBadge(data.readiness);
  updateSuggestions(data.suggestions);
  updateXAIPanel(data.explanations, data.signals);
}

function updateProgress() {
  const answered = state.currentQuestionIndex + 1;
  const total = state.questions.length;
  const pct = Math.round((answered / total) * 100);

  DOM.progressText.textContent = `${answered} of ${total} Answered`;
  DOM.progressDetail.textContent = `${pct}% Complete`;
  DOM.progressRingText.textContent = `${answered}/${total}`;

  // Update SVG ring (radius = 20 in new HTML)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  DOM.progressRingFill.style.strokeDasharray = circumference;
  DOM.progressRingFill.style.strokeDashoffset = offset;
}

function updateScoreBars(averages) {
  const dims = [
    { key: "clarity", label: "Clarity" },
    { key: "accuracy", label: "Technical Accuracy" },
    { key: "completeness", label: "Completeness" },
    { key: "confidence", label: "Confidence" },
  ];

  DOM.scoresContainer.innerHTML = "";

  dims.forEach(({ key, label }) => {
    const score = averages[key];
    const level = score >= 7 ? "high" : score >= 4 ? "medium" : "low";

    const item = document.createElement("div");
    item.className = `score-item score-${level} score-flash`;

    item.innerHTML = `
            <div class="score-label-row">
                <span class="score-dim-name">${label}</span>
                <span class="score-value">${score}/10</span>
            </div>
            <div class="score-bar">
                <div class="score-bar-fill" style="width: ${score * 10}%"></div>
            </div>
        `;

    DOM.scoresContainer.appendChild(item);
  });
}

function updateOverallScore(overall) {
  DOM.overallScoreCard.style.display = "block";
  DOM.overallScoreValue.textContent = overall;
  DOM.overallScoreCard.classList.add("score-flash");
  setTimeout(() => DOM.overallScoreCard.classList.remove("score-flash"), 600);
}

function updateReadinessBadge(readiness) {
  if (!readiness) return;
  DOM.readinessBadge.style.display = "flex";
  DOM.readinessBadge.className = `readiness-badge ${readiness.className}`;
  DOM.readinessBadge.innerHTML = `
        <div class="readiness-dot"></div>
        <div class="readiness-info">
            <div class="readiness-label">${readiness.label}</div>
            <div class="readiness-desc">${readiness.description}</div>
        </div>
    `;
}

function updateSuggestions(suggestions) {
  DOM.suggestionsContainer.innerHTML = "";

  Object.entries(suggestions).forEach(([dim, s]) => {
    const card = document.createElement("div");
    card.className = `suggestion-card suggestion-level-${s.level}`;
    card.innerHTML = `
            <div class="suggestion-header">
                <span class="suggestion-icon">${s.icon}</span>
                <span class="suggestion-dim">${s.dimension}</span>
            </div>
            <div class="suggestion-text">${s.text}</div>
        `;
    DOM.suggestionsContainer.appendChild(card);
  });
}

function updateXAIPanel(explanations, signals) {
  DOM.xaiPanel.innerHTML = `
        <h4>🔍 Explainable AI Analysis</h4>
    `;

  explanations.forEach((exp) => {
    const item = document.createElement("div");
    item.className = "xai-item";

    let signalsHtml = "";
    if (exp.signalsDetected && exp.signalsDetected.length > 0) {
      signalsHtml = `<div class="xai-signals">
                ${exp.signalsDetected.map((s) => `<span class="xai-signal-tag">${s}</span>`).join("")}
            </div>`;
    }

    item.innerHTML = `
            <div class="xai-dim">${exp.dimension} — ${exp.score}/10</div>
            <div class="xai-explanation">${exp.text}</div>
            ${signalsHtml}
        `;
    DOM.xaiPanel.appendChild(item);
  });

  // Add key signal summary
  if (signals) {
    const summary = document.createElement("div");
    summary.className = "xai-item";
    summary.style.marginTop = "8px";
    summary.style.paddingTop = "8px";
    summary.style.borderTop = "1px solid var(--border)";
    summary.innerHTML = `
            <div class="xai-dim">Signal Summary</div>
            <div class="xai-signals">
                <span class="xai-signal-tag">📝 ${signals.wordCount} words</span>
                <span class="xai-signal-tag">📄 ${signals.sentenceCount} sentences</span>
                <span class="xai-signal-tag">🔑 ${signals.matchedKeywords.length} keywords</span>
                ${signals.hasExamples ? '<span class="xai-signal-tag">✅ Has examples</span>' : ""}
                ${signals.fillerWordsFound.length > 0 ? `<span class="xai-signal-tag">⚠️ ${signals.fillerWordsFound.length} filler words</span>` : ""}
                ${signals.isGibberish ? '<span class="xai-signal-tag" style="background:rgba(248,81,73,0.1);color:var(--score-low);">🚫 Gibberish detected</span>' : ""}
            </div>
        `;
    DOM.xaiPanel.appendChild(summary);
  }
}

// ═══════════════════════════════════════════════
// INTERVIEW COMPLETION & REPORT
// ═══════════════════════════════════════════════

async function finishInterview() {
  state.interviewComplete = true;
  DOM.answerInput.disabled = true;
  DOM.sendBtn.disabled = true;
  DOM.inputHint.textContent = "Interview complete!";

  addMessage(
    "ai",
    `🎉 <strong>Interview Complete!</strong><br><br>
        Thank you, ${state.user.name}! All ${state.questions.length} questions have been answered.<br>
        Your final report is being generated...<br><br>
        <em>Click the button below to view your full scorecard report.</em>`,
  );

  // Add report button in chat
  const btnWrapper = document.createElement("div");
  btnWrapper.style.cssText = "text-align: left; margin-top: 12px;";

  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.style.cssText = "width: auto; padding: 10px 24px; font-size: 0.88rem;";
  btn.textContent = "📊 View Full Report";
  btn.addEventListener("click", generateReport);

  btnWrapper.appendChild(btn);

  const lastMsg = DOM.chatMessages.lastElementChild;
  if (lastMsg) {
    lastMsg.querySelector(".message-bubble").appendChild(btnWrapper);
  }
}

async function generateReport() {
  try {
    const res = await fetch("/api/final-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        interviewer: state.user,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Report generation failed");
    }

    state.reportData = data;
    renderReport(data);
  } catch (err) {
    alert("Failed to generate report: " + err.message);
  }
}

function renderReport(data) {
  DOM.reportSection.classList.add("active");

  const readiness = data.readinessIndicator;
  const insights = data.interviewInsights;

  let html = `
        <div class="report-container">
            <!-- Header -->
            <div class="report-header">
                <h1>Selectra</h1>
                <p class="report-tagline">${data.tagline}</p>
                <div class="report-meta">
                    <span class="report-meta-item"><strong>Candidate:</strong> ${data.interviewer.name}</span>
                    <span class="report-meta-item"><strong>Email:</strong> ${data.interviewer.email}</span>
                    <span class="report-meta-item"><strong>Date:</strong> ${new Date(data.generatedAt).toLocaleDateString()}</span>
                </div>
            </div>

            <!-- Overall Score -->
            <div class="report-card">
                <h3>📊 Overall Performance</h3>
                <div class="report-dim-grid">
                    <div class="report-dim-card">
                        <div class="report-dim-score" style="color: ${getScoreColor(data.dimensionAverages.clarity)}">${data.dimensionAverages.clarity}</div>
                        <div class="report-dim-name">Clarity</div>
                    </div>
                    <div class="report-dim-card">
                        <div class="report-dim-score" style="color: ${getScoreColor(data.dimensionAverages.accuracy)}">${data.dimensionAverages.accuracy}</div>
                        <div class="report-dim-name">Technical Accuracy</div>
                    </div>
                    <div class="report-dim-card">
                        <div class="report-dim-score" style="color: ${getScoreColor(data.dimensionAverages.completeness)}">${data.dimensionAverages.completeness}</div>
                        <div class="report-dim-name">Completeness</div>
                    </div>
                    <div class="report-dim-card">
                        <div class="report-dim-score" style="color: ${getScoreColor(data.dimensionAverages.confidence)}">${data.dimensionAverages.confidence}</div>
                        <div class="report-dim-name">Confidence</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 12px;">
                    <div class="readiness-badge ${readiness.className}" style="display: inline-flex;">
                        <div class="readiness-dot"></div>
                        <div class="readiness-info">
                            <div class="readiness-label">${readiness.label} — Overall: ${data.overallScore}/10</div>
                            <div class="readiness-desc">${readiness.description}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Insights -->
            <div class="report-card">
                <h3>💡 Interview Insights</h3>
                <div class="report-insights-grid">
                    <div class="insight-block strengths">
                        <h4>🌟 Strengths</h4>
                        ${insights.strengths
                          .map(
                            (s) => `
                            <div class="insight-item">
                                <span class="insight-icon">✅</span>
                                <div><strong>${s.name}</strong> (${s.score}/10): ${s.note}</div>
                            </div>
                        `,
                          )
                          .join("")}
                        ${insights.strengths.length === 0 ? '<div class="insight-item"><span class="insight-icon">—</span><div>Keep practicing to build strengths!</div></div>' : ""}
                    </div>
                    <div class="insight-block improvements">
                        <h4>📈 Areas for Improvement</h4>
                        ${insights.improvementAreas
                          .map(
                            (s) => `
                            <div class="insight-item">
                                <span class="insight-icon">🔧</span>
                                <div><strong>${s.name}</strong> (${s.score}/10): ${s.note}</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>

            <!-- Next Steps -->
            <div class="report-card">
                <h3>🚀 Actionable Next Steps</h3>
                <ol class="next-steps-list">
                    ${insights.actionableNextSteps
                      .map(
                        (step, i) => `
                        <li>
                            <span class="step-number">${i + 1}</span>
                            <span>${step}</span>
                        </li>
                    `,
                      )
                      .join("")}
                </ol>
            </div>

            <!-- Detailed Responses -->
            <div class="report-card">
                <h3>📝 Detailed Responses</h3>
                ${data.responses
                  .map(
                    (r, i) => `
                    <div class="report-qa-item">
                        <div class="report-qa-header">
                            <span class="report-qa-q">Q${i + 1}: ${r.question}</span>
                            <span class="report-qa-cat">${r.category}</span>
                        </div>
                        <div class="report-qa-answer">${r.answer}</div>
                        <div class="report-qa-scores">
                            <span class="report-qa-score-chip" style="color: ${getScoreColor(r.scores.clarity)}">Clarity: ${r.scores.clarity}</span>
                            <span class="report-qa-score-chip" style="color: ${getScoreColor(r.scores.accuracy)}">Accuracy: ${r.scores.accuracy}</span>
                            <span class="report-qa-score-chip" style="color: ${getScoreColor(r.scores.completeness)}">Completeness: ${r.scores.completeness}</span>
                            <span class="report-qa-score-chip" style="color: ${getScoreColor(r.scores.confidence)}">Confidence: ${r.scores.confidence}</span>
                        </div>
                        ${Object.entries(r.suggestions)
                          .map(
                            ([dim, s]) => `
                            <div class="suggestion-card suggestion-level-${s.level}" style="margin-top: 8px;">
                                <div class="suggestion-header">
                                    <span class="suggestion-icon">${s.icon}</span>
                                    <span class="suggestion-dim">${s.dimension}</span>
                                </div>
                                <div class="suggestion-text">${s.text}</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `,
                  )
                  .join("")}
            </div>

            <!-- Actions -->
            <div class="report-actions">
                <button class="btn-report btn-report-primary" onclick="exportJSON()">📥 Export JSON</button>
                <button class="btn-report btn-report-primary" onclick="printReport()">🖨️ Print Report</button>
                <button class="btn-report btn-report-secondary" onclick="closeReport()">← Back to Chat</button>
                <button class="btn-report btn-report-secondary" onclick="newInterview()">🔄 New Interview</button>
            </div>
        </div>
    `;

  DOM.reportContent.innerHTML = html;
}

function getScoreColor(score) {
  if (score >= 7) return "var(--score-high)";
  if (score >= 4) return "var(--score-medium)";
  return "var(--score-low)";
}

// ═══════════════════════════════════════════════
// EXPORT & ACTIONS
// ═══════════════════════════════════════════════

function exportJSON() {
  if (!state.reportData) return;

  const blob = new Blob([JSON.stringify(state.reportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Selectra_Report_${state.user.name.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport() {
  window.print();
}

function closeReport() {
  DOM.reportSection.classList.remove("active");
}

async function newInterview() {
  // Reset session on backend
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId }),
    });
  } catch (e) {
    /* ignore */
  }

  // Reset frontend state
  state.sessionId = "session_" + Date.now();
  state.currentQuestionIndex = 0;
  state.answers = [];
  state.isWaiting = false;
  state.interviewComplete = false;
  state.reportData = null;
  state.latestScores = null;
  state.latestSuggestions = null;
  state.latestExplanations = null;
  state.readiness = null;
  state.role = localStorage.getItem("selectra_role") || "general";

  // Reset UI
  DOM.chatMessages.innerHTML = "";
  DOM.scoresContainer.innerHTML = "";
  DOM.suggestionsContainer.innerHTML = "";
  DOM.xaiPanel.innerHTML =
    '<h4>🔍 Explainable AI Analysis</h4><p style="font-size:0.74rem;color:var(--text-muted);">Submit your first answer to see analysis.</p>';
  DOM.overallScoreCard.style.display = "none";
  DOM.readinessBadge.style.display = "none";
  DOM.reportSection.classList.remove("active");
  DOM.answerInput.disabled = false;
  DOM.sendBtn.disabled = false;

  // Reset progress
  DOM.progressText.textContent = "0 of 0 Answered";
  DOM.progressDetail.textContent = "0% Complete";
  DOM.progressRingText.textContent = "0/0";
  const radius = 20;
  DOM.progressRingFill.style.strokeDashoffset = 2 * Math.PI * radius;

  // Restart
  startApp();
}

// ═══════════════════════════════════════════════
// VAULTOO INTEGRATION — Zero-Trust Access Layer
// ═══════════════════════════════════════════════

const VAULTOO_API =
  window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://vaultoo.vercel.app";
let vaultooSession = null;
let vaultooTimerInterval = null;
let vaultooStatusInterval = null;

/**
 * Check URL params for Vaultoo auto-login
 * (When user clicks "Open Selectra" from Vaultoo dashboard)
 */
function checkVaultooParams() {
  const params = new URLSearchParams(window.location.search);
  const sessionToken = params.get("vaultoo_session");
  const user = params.get("vaultoo_user");
  const role = params.get("vaultoo_role");

  if (sessionToken && user && role) {
    // Auto-login via Vaultoo session
    vaultooSession = {
      sessionToken,
      credentials: { username: user, role },
    };

    state.user = { name: user, email: "vaultoo-session@temp" };
    state.role = mapVaultooRole(role);
    localStorage.setItem("selectra_user", JSON.stringify(state.user));
    localStorage.setItem("selectra_role", state.role);
    localStorage.setItem("vaultoo_session", JSON.stringify(vaultooSession));

    // Clean URL params
    window.history.replaceState({}, "", window.location.pathname);

    hideLogin();
    hideLandingPage();
    startApp();
    startVaultooSessionMonitor();

    // Log session start
    logVaultooActivity(
      "SESSION_STARTED",
      "/",
      "Auto-login via Vaultoo redirect",
    );
  }
}

/**
 * Map Vaultoo role keys to Selectra role keys
 */
function mapVaultooRole(vaultooRole) {
  const roleMap = {
    frontend_developer: "frontend",
    backend_developer: "backend",
    data_scientist: "data_science",
    devops_engineer: "devops",
    ui_ux_designer: "general",
    product_manager: "general",
    cybersecurity_analyst: "cybersecurity",
  };
  return roleMap[vaultooRole] || "general";
}

/**
 * Show Vaultoo OTP login panel
 */
function showVaultooOTP() {
  document.getElementById("standardLogin").style.display = "none";
  document.getElementById("vaultooOTPLogin").style.display = "block";
  document.getElementById("vaultooOTP").focus();
}

/**
 * Show standard login panel
 */
function showStandardLogin() {
  document.getElementById("standardLogin").style.display = "block";
  document.getElementById("vaultooOTPLogin").style.display = "none";
}

/**
 * Verify OTP via Vaultoo API
 */
async function verifyVaultooOTP() {
  const otp = document.getElementById("vaultooOTP").value.trim();
  const accountId = document.getElementById("vaultooAccountId").value.trim();
  const errorEl = document.getElementById("vaultooError");
  const verifyBtn = document.getElementById("vaultooVerifyBtn");

  if (!otp || otp.length !== 6) {
    showVaultooError("Please enter a valid 6-digit OTP");
    return;
  }

  if (!accountId) {
    showVaultooError("Please enter the account ID");
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";

  try {
    const res = await fetch(`${VAULTOO_API}/api/v1/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp, accountId }),
    });

    const data = await res.json();

    if (data.success && data.data) {
      // OTP verified! Store session and auto-login
      vaultooSession = data.data;
      localStorage.setItem("vaultoo_session", JSON.stringify(vaultooSession));

      // Set Selectra state with Vaultoo user info
      state.user = {
        name: data.data.requesterName || data.data.credentials.email,
        email: data.data.credentials.email,
      };
      state.role = "general";
      localStorage.setItem("selectra_user", JSON.stringify(state.user));
      localStorage.setItem("selectra_role", state.role);

      hideLogin();
      hideLandingPage();
      startApp();
      startVaultooSessionMonitor();

      logVaultooActivity("SESSION_STARTED", "/", "OTP verified manually");
    } else {
      showVaultooError(
        data.message || data.error || "Invalid OTP. Please try again.",
      );
    }
  } catch (err) {
    showVaultooError(
      "Cannot connect to Vaultoo. Please check the server is running.",
    );
    console.error("Vaultoo OTP verify error:", err);
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify & Start Session 🔓";
  }
}

function showVaultooError(msg) {
  const errorEl = document.getElementById("vaultooError");
  errorEl.textContent = msg;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 5000);
}

/**
 * Start session timer and monitoring bar
 */
function startVaultooSessionMonitor() {
  if (!vaultooSession || !vaultooSession.expiresAt) return;

  document.body.classList.add("vaultoo-active");

  // Create session bar
  const bar = document.createElement("div");
  bar.className = "vaultoo-session-bar";
  bar.id = "vaultooSessionBar";
  bar.innerHTML = `
        <div class="session-info">
            <span>🛡️ Vaultoo Session</span>
            <span>•</span>
            <span>Access granted by ${vaultooSession.owner?.name || "Owner"}</span>
        </div>
        <div class="session-info">
            <span class="session-timer" id="vaultooSessionTimer">--:--</span>
            <button class="session-extend-btn" onclick="showExtensionRequestModal()" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;margin-right:4px;">⏱️ More Time</button>
            <button class="session-end-btn" onclick="endVaultooSession()">End Session</button>
        </div>
    `;
  document.body.prepend(bar);

  // Start screen sharing
  startScreenShare();

  // Update timer every second
  updateVaultooTimer();
  vaultooTimerInterval = setInterval(updateVaultooTimer, 1000);

  // Check session status immediately, then every 5 seconds
  checkVaultooSessionActive();
  vaultooStatusInterval = setInterval(checkVaultooSessionActive, 5000);
}

/**
 * Poll Vaultoo to check if session is still active
 */
async function checkVaultooSessionActive() {
  if (!vaultooSession || !vaultooSession.sessionToken) return;
  try {
    const res = await fetch(`${VAULTOO_API}/api/v1/session-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: vaultooSession.sessionToken }),
    });
    const data = await res.json();
    if (!data.active) {
      console.log("Vaultoo session terminated:", data.reason);
      forceVaultooLogout(data.reason || "Session ended");
    } else if (data.expiresAt && data.expiresAt !== vaultooSession.expiresAt) {
      // Session was extended — update local timer
      console.log("[Vaultoo] Session extended to:", data.expiresAt);
      vaultooSession.expiresAt = data.expiresAt;
      localStorage.setItem("vaultoo_session", JSON.stringify(vaultooSession));

      // Show extension notification
      showVaultooModal({
        icon: "⏱️",
        title: "Session Extended!",
        message: "The account owner has granted you more time.",
        type: "info",
      });
    }
  } catch (err) {
    console.error("Vaultoo status check error:", err);
  }
}

function updateVaultooTimer() {
  if (!vaultooSession || !vaultooSession.expiresAt) return;

  const remaining = new Date(vaultooSession.expiresAt).getTime() - Date.now();
  const timerEl = document.getElementById("vaultooSessionTimer");
  const barEl = document.getElementById("vaultooSessionBar");

  if (!timerEl || !barEl) return;

  if (remaining <= 0) {
    timerEl.textContent = "EXPIRED";
    barEl.classList.add("expired");
    barEl.classList.remove("urgent");
    clearInterval(vaultooTimerInterval);
    clearInterval(vaultooStatusInterval);

    // Auto-terminate
    setTimeout(() => {
      showVaultooModal({
        icon: "⏱️",
        title: "Session Expired",
        message: "Your Vaultoo session has expired. You will be logged out.",
        type: "warning",
        onClose: () => endVaultooSession(),
      });
    }, 2000);
    return;
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Urgent state when < 2 minutes
  if (remaining < 120000) {
    barEl.classList.add("urgent");
  }
}

/**
 * End Vaultoo session
 */
async function endVaultooSession() {
  if (vaultooSession && vaultooSession.sessionToken) {
    try {
      await fetch(`${VAULTOO_API}/api/v1/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: vaultooSession.sessionToken,
          reason: "USER_ENDED",
        }),
      });
    } catch (err) {
      console.error("Vaultoo terminate error:", err);
    }
  }

  // Cleanup all intervals
  clearInterval(vaultooTimerInterval);
  clearInterval(vaultooStatusInterval);
  stopScreenShare();
  vaultooSession = null;
  localStorage.removeItem("vaultoo_session");

  const bar = document.getElementById("vaultooSessionBar");
  if (bar) bar.remove();
  document.body.classList.remove("vaultoo-active");

  // Logout from Selectra too
  forceSelectraLogout();
}

/**
 * Force logout from Selectra — called when session is killed by owner
 * Bypasses the confirm dialog that handleLogout() has
 */
function forceVaultooLogout(reason) {
  // Stop all monitoring
  clearInterval(vaultooTimerInterval);
  clearInterval(vaultooStatusInterval);
  stopScreenShare();

  // Clear Vaultoo state
  vaultooSession = null;
  localStorage.removeItem("vaultoo_session");

  const bar = document.getElementById("vaultooSessionBar");
  if (bar) bar.remove();
  document.body.classList.remove("vaultoo-active");

  // Show styled alert to the user
  showVaultooModal({
    icon: "🛡️",
    title: "Session Terminated",
    message: reason,
    type: "danger",
    onClose: () => forceSelectraLogout(),
  });
}

/**
 * Force logout from Selectra without confirmation prompts
 */
function forceSelectraLogout() {
  localStorage.removeItem("selectra_user");
  localStorage.removeItem("selectra_role");
  state.user = null;
  state.role = "general";
  state.questions = [];
  state.answers = [];
  state.currentQuestionIndex = 0;
  state.isWaiting = false;
  state.interviewComplete = false;
  state.reportData = null;
  state.latestScores = null;
  state.latestSuggestions = null;
  state.latestExplanations = null;
  state.readiness = null;
  state.sessionId = "session_" + Date.now();

  if (DOM.chatMessages) DOM.chatMessages.innerHTML = "";
  if (DOM.answerInput) {
    DOM.answerInput.value = "";
    DOM.answerInput.disabled = true;
  }
  if (DOM.sendBtn) DOM.sendBtn.disabled = true;
  if (DOM.inputHint) DOM.inputHint.textContent = "Waiting to start...";
  if (DOM.loginName) DOM.loginName.value = "";
  if (DOM.loginEmail) DOM.loginEmail.value = "";
  if (DOM.loginRole) DOM.loginRole.value = "general";

  if (DOM.appContainer) {
    DOM.appContainer.classList.remove("active");
    DOM.appContainer.style.display = "none";
  }
  if (DOM.reportSection) {
    DOM.reportSection.classList.remove("active");
    DOM.reportSection.style.display = "none";
  }
  showLandingPage();
}

/**
 * Log activity to Vaultoo
 */
async function logVaultooActivity(action, path, details) {
  if (!vaultooSession || !vaultooSession.sessionToken) return;

  try {
    const res = await fetch(`${VAULTOO_API}/api/v1/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: vaultooSession.sessionToken,
        action,
        path: path || window.location.pathname,
        details,
      }),
    });

    const data = await res.json();

    // Check if session was auto-terminated by AI Sentinel
    if (data.terminated) {
      showVaultooModal({
        icon: "🔒",
        title: "Security Alert",
        message:
          data.reason ||
          "Risk threshold exceeded. Session terminated by security system.",
        type: "danger",
        onClose: () => endVaultooSession(),
      });
    }
  } catch (err) {
    console.error("Vaultoo activity log error:", err);
  }
}

/**
 * Show a styled Vaultoo modal instead of plain alert()
 */
function showVaultooModal({ icon, title, message, type = "info", onClose }) {
  // Remove any existing modal
  const existing = document.getElementById("vaultooModal");
  if (existing) existing.remove();

  const typeColors = {
    danger: {
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.4)",
      accent: "#ef4444",
    },
    warning: {
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.4)",
      accent: "#f59e0b",
    },
    info: {
      bg: "rgba(99,102,241,0.12)",
      border: "rgba(99,102,241,0.4)",
      accent: "#6366f1",
    },
  };
  const colors = typeColors[type] || typeColors.info;

  const overlay = document.createElement("div");
  overlay.id = "vaultooModal";
  overlay.className = "vaultoo-modal-overlay";
  overlay.innerHTML = `
    <div class="vaultoo-modal" style="border-color: ${colors.border}">
      <div class="vaultoo-modal-icon" style="background: ${colors.bg}">${icon}</div>
      <h3 class="vaultoo-modal-title">${title}</h3>
      <p class="vaultoo-modal-message">${message}</p>
      <div class="vaultoo-modal-bar" style="background: ${colors.accent}"></div>
      <button class="vaultoo-modal-btn" style="background: ${colors.accent}" id="vaultooModalBtn">OK</button>
      <p class="vaultoo-modal-footer">Secured by Vaultoo</p>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add("active"));

  // Auto-close after 6s
  let autoCloseTimer = setTimeout(() => closeModal(), 6000);

  function closeModal() {
    clearTimeout(autoCloseTimer);
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 300);
  }

  document
    .getElementById("vaultooModalBtn")
    .addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

/**
 * Restore Vaultoo session from localStorage on page reload
 */
function restoreVaultooSession() {
  const saved = localStorage.getItem("vaultoo_session");
  if (saved) {
    try {
      vaultooSession = JSON.parse(saved);
      if (
        vaultooSession.expiresAt &&
        new Date(vaultooSession.expiresAt) > new Date()
      ) {
        // Verify with Vaultoo server that session is still active
        fetch(`${VAULTOO_API}/api/v1/session-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: vaultooSession.sessionToken }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.active) {
              startVaultooSessionMonitor();
            } else {
              // Session was killed on server side
              forceVaultooLogout(data.reason || "Session ended by owner");
            }
          })
          .catch(() => {
            // Can't reach Vaultoo, start monitor anyway
            startVaultooSessionMonitor();
          });
      } else {
        // Session expired locally
        localStorage.removeItem("vaultoo_session");
        vaultooSession = null;
      }
    } catch {
      localStorage.removeItem("vaultoo_session");
    }
  }
}

// ═══════════════════════════════════════════════
// SCREEN SHARE — html2canvas frame capture
// ═══════════════════════════════════════════════

let screenShareInterval = null;

/**
 * Start capturing screenshots of the Selectra page and sending to Vaultoo
 */
function startScreenShare() {
  if (screenShareInterval) return; // Already running
  if (!vaultooSession || !vaultooSession.sessionToken) return;

  console.log("[ScreenShare] Starting frame capture...");

  // Add a small indicator to the session bar
  const bar = document.getElementById("vaultooSessionBar");
  if (bar && !document.getElementById("screenShareIndicator")) {
    const indicator = document.createElement("span");
    indicator.id = "screenShareIndicator";
    indicator.className = "screen-share-indicator";
    indicator.innerHTML = "📺 Sharing";
    indicator.style.cssText =
      "display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#a78bfa;margin-left:8px;opacity:0.9;";
    bar.querySelector(".session-info")?.appendChild(indicator);
  }

  // Capture and send frames every 3 seconds
  screenShareInterval = setInterval(captureAndSendFrame, 3000);
  // Also capture immediately
  captureAndSendFrame();
}

/**
 * Stop capturing screenshots
 */
function stopScreenShare() {
  if (screenShareInterval) {
    clearInterval(screenShareInterval);
    screenShareInterval = null;
    console.log("[ScreenShare] Stopped frame capture");
  }
  const indicator = document.getElementById("screenShareIndicator");
  if (indicator) indicator.remove();
}

/**
 * Capture a screenshot of the page and send to Vaultoo
 */
async function captureAndSendFrame() {
  if (!vaultooSession || !vaultooSession.sessionToken) {
    stopScreenShare();
    return;
  }

  try {
    // Use html2canvas to capture the entire page
    const canvas = await html2canvas(document.body, {
      scale: 0.5, // Lower resolution for smaller payload
      useCORS: true,
      logging: false,
      backgroundColor: "#030014",
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });

    // Convert to compressed JPEG base64
    const base64 = canvas
      .toDataURL("image/jpeg", 0.4)
      .replace("data:image/jpeg;base64,", "");

    // Check size — skip if too large (>250KB)
    if (base64.length > 250000) {
      console.log("[ScreenShare] Frame too large, skipping:", base64.length);
      return;
    }

    // Send to Vaultoo
    await fetch(`${VAULTOO_API}/api/v1/screen-share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: vaultooSession.sessionToken,
        frame: base64,
      }),
    });
  } catch (err) {
    console.error("[ScreenShare] Capture error:", err);
  }
}

// ═══════════════════════════════════════════════
// EXTENSION REQUEST — from Selectra
// ═══════════════════════════════════════════════

/**
 * Show extension request modal in Selectra
 */
function showExtensionRequestModal() {
  // Remove existing modal if any
  const existing = document.getElementById("vaultooExtensionModal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "vaultooExtensionModal";
  overlay.className = "vaultoo-modal-overlay";
  overlay.innerHTML = `
    <div class="vaultoo-modal" style="border-color: rgba(139,92,246,0.4); max-width: 380px;">
      <div class="vaultoo-modal-icon" style="background: rgba(139,92,246,0.12)">⏱️</div>
      <h3 class="vaultoo-modal-title">Request More Time</h3>
      <p class="vaultoo-modal-message" style="margin-bottom: 16px;">Ask the account owner for a session extension.</p>

      <div style="margin-bottom: 12px; text-align: left;">
        <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Additional Minutes</label>
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <button class="ext-preset" data-min="10" style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;font-size:13px;cursor:pointer;">10m</button>
          <button class="ext-preset" data-min="15" style="flex:1;padding:8px;border-radius:8px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);color:#a78bfa;font-size:13px;cursor:pointer;">15m</button>
          <button class="ext-preset" data-min="30" style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;font-size:13px;cursor:pointer;">30m</button>
          <button class="ext-preset" data-min="60" style="flex:1;padding:8px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;font-size:13px;cursor:pointer;">60m</button>
        </div>
        <input type="number" id="extMinutesInput" value="15" min="5" max="480"
          style="width:100%;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;font-size:14px;outline:none;box-sizing:border-box;" />
      </div>

      <div style="margin-bottom: 16px; text-align: left;">
        <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Reason (optional)</label>
        <textarea id="extReasonInput" rows="2" placeholder="Need more time to finish..."
          style="width:100%;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;font-size:13px;outline:none;resize:none;box-sizing:border-box;"></textarea>
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="extCancelBtn" style="flex:1;padding:10px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:13px;cursor:pointer;">Cancel</button>
        <button id="extSubmitBtn" style="flex:1;padding:10px;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border:none;color:white;font-size:13px;font-weight:600;cursor:pointer;">Send Request</button>
      </div>

      <p class="vaultoo-modal-footer">Secured by Vaultoo</p>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("active"));

  // Preset buttons
  overlay.querySelectorAll(".ext-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("extMinutesInput").value =
        btn.getAttribute("data-min");
      overlay.querySelectorAll(".ext-preset").forEach((b) => {
        b.style.background = "rgba(255,255,255,0.05)";
        b.style.borderColor = "rgba(255,255,255,0.1)";
        b.style.color = "#e2e8f0";
      });
      btn.style.background = "rgba(139,92,246,0.15)";
      btn.style.borderColor = "rgba(139,92,246,0.3)";
      btn.style.color = "#a78bfa";
    });
  });

  // Cancel
  document.getElementById("extCancelBtn").addEventListener("click", () => {
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 300);
  });

  // Submit
  document
    .getElementById("extSubmitBtn")
    .addEventListener("click", async () => {
      const mins = parseInt(document.getElementById("extMinutesInput").value);
      const reason = document.getElementById("extReasonInput").value.trim();

      if (isNaN(mins) || mins < 5 || mins > 480) {
        showVaultooError("Please enter a valid time (5-480 minutes)");
        return;
      }

      const submitBtn = document.getElementById("extSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        const res = await fetch(`${VAULTOO_API}/api/v1/request-extension`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: vaultooSession.sessionToken,
            additionalMinutes: mins,
            reason: reason || `Requesting ${mins} more minutes`,
          }),
        });

        const data = await res.json();

        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 300);

        if (data.success) {
          showVaultooModal({
            icon: "✅",
            title: "Request Sent",
            message:
              "Your extension request has been sent to the account owner.",
            type: "info",
          });
        } else {
          showVaultooModal({
            icon: "⚠️",
            title: "Request Failed",
            message: data.message || "Failed to send extension request.",
            type: "warning",
          });
        }
      } catch (err) {
        console.error("Extension request error:", err);
        showVaultooError("Failed to send extension request.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Request";
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 300);
    }
  });
}
