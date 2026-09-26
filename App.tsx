import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { topics, getTopicsByFilter, getTopicById, Topic } from './data/topics';
import {
  generateQuestions, generateDailyChallenge, generateExamQuestions,
  askAI, getStoredQuestions, storeQuestions, shouldRefreshQuestions,
  getStoredDailyChallenge, storeDailyChallenge, isDailyChallengeExpired,
  validateApiKey, saveApiKey, getApiKey, resetGenAI, generateStudyReport,
  getSelectedModel, setSelectedModel, getApiMode, setApiMode,
  testApiConnection, AVAILABLE_MODELS, getLastProvider, getGatewaySetup,
  Question, ModelId, ApiMode, GatewayModelOption
} from './services/gemini';

// ============ TOAST COMPONENT ============
const Toast = () => {
  const { state } = useApp();
  if (!state.toast) return null;
  const colors = { success: 'border-green-500 bg-green-500/10', error: 'border-red-500 bg-red-500/10', info: 'border-blue-500 bg-blue-500/10' };
  return (
    <div className={`fixed top-4 right-4 z-50 slide-up ${colors[state.toast.type]} border rounded-xl p-4 max-w-sm`}>
      <p className="text-white font-medium">{state.toast.message}</p>
    </div>
  );
};

// ============ NAVBAR ============
const Navbar = () => {
  const { state, dispatch } = useApp();
  const pages = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'topics', icon: '📚', label: 'Topics' },
    { id: 'daily', icon: '🎯', label: 'Daily' },
    { id: 'exams', icon: '📝', label: 'Exams' },
    { id: 'analytics', icon: '📊', label: 'Stats' },
    { id: 'assistant', icon: '🤖', label: 'AI Tutor' },
    { id: 'journey', icon: '⚔️', label: 'Journey' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];
  return (
    <nav className="glass-card sticky top-0 z-40 px-4 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => dispatch({ type: 'SET_PAGE', page: 'dashboard' })}>
          <span className="text-2xl">🏆</span>
          <h1 className="text-xl font-bold neon-text hidden sm:block">Olympiad Quest</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {pages.map(p => (
            <button key={p.id} onClick={() => dispatch({ type: 'SET_PAGE', page: p.id })}
              className={`nav-item text-xs sm:text-sm whitespace-nowrap ${state.currentPage === p.id ? 'active' : ''}`}>
              <span>{p.icon}</span>
              <span className="hidden md:inline">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-easy hidden sm:inline-flex">⭐ {state.userStats.xp} XP</span>
          <span className="badge badge-medium hidden sm:inline-flex">Lv.{state.userStats.level}</span>
          <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })} 
            className="text-xs bg-white/5 hover:bg-white/10 rounded-full px-2 py-1 transition-all" title="Settings">
            ⚙️
          </button>
        </div>
      </div>
    </nav>
  );
};

// ============ DASHBOARD ============
const Dashboard = () => {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<'all' | '4' | '7'>('all');
  const today = new Date().toISOString().split('T')[0];
  const todayStats = state.userStats.dailyStats[today] || { questionsSolved: 0, correct: 0, timeSpent: 0 };
  const accuracy = todayStats.questionsSolved > 0 ? Math.round((todayStats.correct / todayStats.questionsSolved) * 100) : 0;
  
  const filteredTopics = filter === 'all' ? topics : getTopicsByFilter(Number(filter));
  
  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Hero Section */}
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 neon-text">Welcome Back, Champion! 🌟</h2>
          <p className="text-gray-300 mb-2">Chapter {state.userStats.chapterUnlocked}/11 • Level {state.userStats.level} • {state.userStats.streak} day streak 🔥</p>
          <p className="text-xs text-gray-500 mb-4">
            🤖 {getLastProvider()} • {topics.length} topics • {state.apiKeySet ? '✅ Browser fallback saved' : '☁️ Server AI router'}
          </p>
          <div className="progress-bar max-w-md mx-auto mb-4">
            <div className="progress-bar-fill" style={{ width: `${(state.userStats.xp % 150) / 150 * 100}%` }}></div>
          </div>
          <p className="text-sm text-gray-400">{150 - (state.userStats.xp % 150)} XP to next level</p>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{todayStats.questionsSolved}</p>
          <p className="text-xs text-gray-400">Solved Today</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{accuracy}%</p>
          <p className="text-xs text-gray-400">Accuracy</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{Math.floor(todayStats.timeSpent / 60)}m</p>
          <p className="text-xs text-gray-400">Time Spent</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">+{todayStats.correct * 10}</p>
          <p className="text-xs text-gray-400">XP Earned</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'daily' })} className="glass-card p-5 text-left hover:border-yellow-500/50 transition-all">
          <span className="text-3xl mb-2 block">🎯</span>
          <h3 className="font-bold text-lg">Daily Challenge</h3>
          <p className="text-sm text-gray-400">20 mixed questions • 30 min</p>
        </button>
        <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'exams' })} className="glass-card p-5 text-left hover:border-purple-500/50 transition-all">
          <span className="text-3xl mb-2 block">📝</span>
          <h3 className="font-bold text-lg">Exam Corner</h3>
          <p className="text-sm text-gray-400">Topic exams & mock tests</p>
        </button>
        <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'topics' })} className="glass-card p-5 text-left hover:border-blue-500/50 transition-all">
          <span className="text-3xl mb-2 block">📚</span>
          <h3 className="font-bold text-lg">Practice Topics</h3>
          <p className="text-sm text-gray-400">{topics.length} topics available</p>
        </button>
      </div>

      {/* Filter & Topics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold">📚 Topics</h3>
          <div className="ml-auto flex gap-2">
            {(['all', '4', '7'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`}>
                {f === 'all' ? 'All' : `Std ${f}`}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTopics.map(topic => {
            const stats = state.userStats.topicStats[topic.id];
            const mastery = stats ? Math.round((stats.correct / Math.max(stats.attempted, 1)) * 100) : 0;
            return (
              <div key={topic.id} onClick={() => { dispatch({ type: 'SET_TOPIC', topic: topic.id }); dispatch({ type: 'SET_PAGE', page: 'topic-view' }); }}
                className="topic-card cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{topic.icon}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${topic.color}22`, color: topic.color }}>
                    {topic.olympiad} • Std {topic.standard}
                  </span>
                </div>
                <h4 className="font-semibold text-sm mb-1">{topic.name}</h4>
                <p className="text-xs text-gray-400 mb-2">{topic.description}</p>
                {stats && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{stats.attempted} solved</span>
                      <span>{mastery}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${mastery}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============ TOPIC VIEW ============
const TopicView = () => {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState('');
  const topic = state.selectedTopic ? getTopicById(state.selectedTopic) : null;

  useEffect(() => {
    if (!topic) return;
    const stored = getStoredQuestions(topic.id);
    if (stored.length > 0 && !shouldRefreshQuestions(topic.id)) {
      setQuestions(stored);
    } else {
      loadQuestions();
    }
  }, [topic?.id]);

  const loadQuestions = async () => {
    if (!topic) return;
    setLoading(true);
    setError('');
    try {
      const existing = getStoredQuestions(topic.id);
      const newQ = await generateQuestions(
        topic.name, topic.standard, topic.olympiad,
        topic.chapters.map(c => c.name), 25, existing
      );
      newQ.forEach(q => q.topicId = topic.id);
      storeQuestions(topic.id, newQ);
      setQuestions(newQ);
    } catch (e: any) {
      setError(e.message || 'Failed to generate questions. Check your API key in Settings.');
    }
    setLoading(false);
  };

  const startPractice = () => {
    if (questions.length === 0) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 20);
    dispatch({ type: 'SET_QUIZ_QUESTIONS', questions: shuffled });
    dispatch({ type: 'SET_QUIZ_MODE', mode: 'practice' });
    dispatch({ type: 'SET_PAGE', page: 'quiz' });
  };

  if (!topic) return <div className="text-center p-8">Topic not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'topics' })} className="glow-btn text-sm">← Back to Topics</button>
      
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{topic.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{topic.name}</h2>
            <p className="text-gray-400">{topic.olympiad} • Standard {topic.standard} • {topic.chapters.length} chapters</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {topic.chapters.map(ch => (
            <div key={ch.id} className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">{ch.name}</p>
            </div>
          ))}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4"><p className="text-red-400 text-sm">{error}</p></div>}
        
        <div className="flex gap-3 flex-wrap">
          <button onClick={startPractice} disabled={loading || questions.length === 0} className="glow-btn">
            {loading ? '⏳ Generating...' : `🎮 Practice (${questions.length} questions)`}
          </button>
          <button onClick={loadQuestions} disabled={loading} className="glow-btn glow-btn-gold">
            🔄 Refresh Questions
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass-card p-8 text-center">
          <div className="float-anim text-4xl mb-4">🧠</div>
          <p className="text-lg font-semibold">AI is crafting questions...</p>
          <p className="text-sm text-gray-400">Generating {topic.name} questions for you</p>
          <div className="progress-bar mt-4 max-w-xs mx-auto">
            <div className="progress-bar-fill animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ QUIZ COMPONENT ============
const Quiz = () => {
  const { state, dispatch } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const questionStartRef = useRef(Date.now());
  const questions = state.currentQuizQuestions;
  const current = questions[currentIdx];
  const isFinished = currentIdx >= questions.length;
  const isTimedMode = state.quizMode === 'exam' || state.quizMode === 'mock' || state.quizMode === 'mega' || state.quizMode === 'daily';
  const maxTime = state.quizMode === 'mega' ? 10800 : state.quizMode === 'exam' ? 3600 : state.quizMode === 'daily' ? 1800 : 0;

  useEffect(() => { questionStartRef.current = Date.now(); }, [currentIdx]);
  
  useEffect(() => {
    if (!isTimedMode || isFinished) return;
    const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimedMode, isFinished]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  const handleSelect = (idx: number) => {
    if (showExplanation) return;
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000);
    const isCorrect = selected === current.answer;
    
    setShowExplanation(true);
    if (isCorrect) {
      setScore(s => s + 1);
      dispatch({ type: 'ADD_XP', xp: 10 });
    }
    setAnswers([...answers, selected]);
    setTimePerQuestion([...timePerQuestion, timeTaken]);
    dispatch({ type: 'RECORD_ATTEMPT', topicId: current.topicId || state.selectedTopic || 'unknown', correct: isCorrect, timeSpent: timeTaken });
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);
    setCurrentIdx(i => i + 1);
  };

  const handleFinish = () => {
    dispatch({ type: 'SET_PAGE', page: 'results' });
  };

  if (questions.length === 0) {
    return <div className="text-center p-8"><p>No questions loaded</p><button onClick={() => dispatch({ type: 'SET_PAGE', page: 'dashboard' })} className="glow-btn mt-4">Go Home</button></div>;
  }

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    
    // Trigger confetti for good scores
    useEffect(() => {
      if (pct >= 70) {
        import('canvas-confetti').then(mod => {
          const confetti = mod.default;
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } }), 200);
          setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } }), 400);
        }).catch(() => {});
      }
    }, []);
    
    return (
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="glass-card p-8 text-center bounce-in">
          <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-bold mb-2">{pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing!'}</h2>
          <p className="text-xl text-gray-300 mb-4">{score}/{questions.length} correct ({pct}%)</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-500/10 rounded-lg p-3"><p className="text-green-400 font-bold">{score}</p><p className="text-xs text-gray-400">Correct</p></div>
            <div className="bg-red-500/10 rounded-lg p-3"><p className="text-red-400 font-bold">{questions.length - score}</p><p className="text-xs text-gray-400">Wrong</p></div>
            <div className="bg-blue-500/10 rounded-lg p-3"><p className="text-blue-400 font-bold">{Math.round(timePerQuestion.reduce((a,b) => a+b, 0) / timePerQuestion.length)}s</p><p className="text-xs text-gray-400">Avg Time</p></div>
          </div>
          <p className="text-yellow-400 font-bold mb-4">+{score * 10} XP earned!</p>
          <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'dashboard' })} className="glow-btn">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-gray-400">Question {currentIdx + 1}/{questions.length}</span>
        {isTimedMode && (
          <span className="badge bg-blue-500/20 text-blue-400">
            ⏱️ {formatTime(elapsedTime)}{maxTime > 0 ? ` / ${formatTime(maxTime)}` : ''}
          </span>
        )}
        <span className="badge badge-easy">Score: {score}</span>
        <span className={`badge ${current.difficulty === 'easy' ? 'badge-easy' : current.difficulty === 'medium' ? 'badge-medium' : current.difficulty === 'hard' ? 'badge-hard' : 'badge-expert'}`}>
          {current.difficulty}
        </span>
      </div>
      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }}></div></div>

      {/* Question */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-lg font-medium flex-1">{current.question}</p>
          <button onClick={() => {
            const newBm = new Set(bookmarked);
            if (newBm.has(currentIdx)) newBm.delete(currentIdx);
            else newBm.add(currentIdx);
            setBookmarked(newBm);
            // Save bookmarks
            const stored = JSON.parse(localStorage.getItem('bookmarks') || '{}');
            const key = `${state.selectedTopic || 'quiz'}-${currentIdx}`;
            if (newBm.has(currentIdx)) stored[key] = current;
            else delete stored[key];
            localStorage.setItem('bookmarks', JSON.stringify(stored));
          }} className="text-2xl ml-2 hover:scale-110 transition-transform" title="Bookmark this question">
            {bookmarked.has(currentIdx) ? '🔖' : '📌'}
          </button>
        </div>
        <div className="space-y-3">
          {current.options.map((opt, idx) => (
            <div key={idx} onClick={() => handleSelect(idx)}
              className={`quiz-option ${selected === idx ? 'selected' : ''} ${showExplanation && idx === current.answer ? 'correct' : ''} ${showExplanation && selected === idx && idx !== current.answer ? 'wrong' : ''}`}>
              <span className="font-medium mr-3">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!showExplanation ? (
        <button onClick={handleSubmit} disabled={selected === null} className="glow-btn w-full">Submit Answer</button>
      ) : (
        <div className="space-y-4">
          <div className={`glass-card p-4 ${selected === current.answer ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <p className="font-bold mb-2">{selected === current.answer ? '✅ Correct!' : '❌ Incorrect!'}</p>
            <p className="text-sm text-gray-300">{current.explanation}</p>
          </div>
          <button onClick={handleNext} className="glow-btn w-full">
            {currentIdx + 1 === questions.length ? '🏁 See Results' : '→ Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

// ============ DAILY CHALLENGE ============
const DailyChallenge = () => {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyQs, setDailyQs] = useState<Question[]>([]);

  useEffect(() => {
    const stored = getStoredDailyChallenge();
    if (stored && !isDailyChallengeExpired()) {
      setDailyQs(stored.questions);
    }
  }, []);

  const generateDaily = async () => {
    setLoading(true);
    setError('');
    try {
      const topicList = topics.slice(0, 10).map(t => ({ name: t.name, olympiad: t.olympiad }));
      const qs = await generateDailyChallenge(4, topicList);
      storeDailyChallenge(qs);
      setDailyQs(qs);
    } catch (e: any) {
      setError(e.message || 'Failed to generate daily challenge');
    }
    setLoading(false);
  };

  const startDaily = () => {
    if (dailyQs.length === 0) return;
    dispatch({ type: 'SET_QUIZ_QUESTIONS', questions: dailyQs });
    dispatch({ type: 'SET_QUIZ_MODE', mode: 'daily' });
    dispatch({ type: 'SET_PAGE', page: 'quiz' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-orange-600/10"></div>
        <div className="relative z-10">
          <div className="text-5xl mb-4 float-anim">🎯</div>
          <h2 className="text-3xl font-bold gold-text mb-2">Daily Challenge</h2>
          <p className="text-gray-300 mb-4">Fresh questions every 24 hours • 20 mixed questions • 30 minutes</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <p className="text-sm text-gray-400">🔥 Streak: {state.userStats.streak} days</p>
            {dailyQs.length > 0 && (
              <p className="text-sm text-green-400">✅ Today's challenge ready!</p>
            )}
          </div>
          
          {dailyQs.length > 0 ? (
            <button onClick={startDaily} className="glow-btn glow-btn-gold text-lg px-8 py-3">
              🚀 Start Today's Challenge ({dailyQs.length} questions)
            </button>
          ) : (
            <button onClick={generateDaily} disabled={loading} className="glow-btn glow-btn-gold text-lg px-8 py-3">
              {loading ? '⏳ Generating...' : '✨ Generate Today\'s Challenge'}
            </button>
          )}
          
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3">📋 How It Works</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• 20 questions from mixed topics</li>
            <li>• AI generates fresh questions daily</li>
            <li>• 30 minute time limit</li>
            <li>• +10 XP per correct answer</li>
            <li>• +5 bonus XP for speed</li>
            <li>• Builds your streak counter</li>
          </ul>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-bold mb-3">🏆 Rewards</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• 7-day streak: "Week Warrior" badge</li>
            <li>• 30-day streak: "Monthly Master" badge</li>
            <li>• Perfect score: +50 bonus XP</li>
            <li>• Speed bonus: Finish under 20 min</li>
            <li>• All topics covered: +100 XP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ============ EXAM CORNER ============
const ExamCorner = () => {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState<'topic' | 'mock' | 'mega'>('topic');
  const [selectedExamTopic, setSelectedExamTopic] = useState('');
  const [error, setError] = useState('');

  const startExam = async () => {
    setLoading(true);
    setError('');
    try {
      let qs: Question[] = [];
      if (examType === 'topic' && selectedExamTopic) {
        const topic = getTopicById(selectedExamTopic);
        if (!topic) throw new Error('Topic not found');
        qs = await generateExamQuestions(topic.name, topic.standard, topic.olympiad, topic.chapters.map(c => c.name), 30);
        qs.forEach(q => q.topicId = topic.id);
      } else if (examType === 'mock') {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        qs = await generateExamQuestions(topic.name, topic.standard, topic.olympiad, topic.chapters.map(c => c.name), 30);
        qs.forEach(q => q.topicId = topic.id);
      } else if (examType === 'mega') {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        qs = await generateExamQuestions(topic.name, topic.standard, topic.olympiad, topic.chapters.map(c => c.name), 30);
        qs.forEach(q => q.topicId = topic.id);
      }
      dispatch({ type: 'SET_QUIZ_QUESTIONS', questions: qs });
      dispatch({ type: 'SET_QUIZ_MODE', mode: examType === 'topic' ? 'exam' : examType === 'mock' ? 'mock' : 'mega' });
      dispatch({ type: 'SET_PAGE', page: 'quiz' });
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-6">
      <h2 className="text-2xl font-bold">📝 Exam Corner</h2>
      
      <div className="flex gap-2 mb-4">
        {(['topic', 'mock', 'mega'] as const).map(t => (
          <button key={t} onClick={() => setExamType(t)} className={`tab-btn ${examType === t ? 'active' : ''}`}>
            {t === 'topic' ? '📚 Topic Exams' : t === 'mock' ? '🎭 Mock Tests' : '🏆 Mega Tests'}
          </button>
        ))}
      </div>

      {examType === 'topic' && (
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">Select Topic for Exam</h3>
          <select value={selectedExamTopic} onChange={e => setSelectedExamTopic(e.target.value)} className="w-full mb-4">
            <option value="">Choose a topic...</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.name} ({t.olympiad} Std {t.standard})</option>
            ))}
          </select>
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">• 30 questions per topic exam</p>
            <p className="text-sm text-gray-300">• Mix of all difficulty levels</p>
            <p className="text-sm text-gray-300">• Auto-refreshes every 10 days</p>
            <p className="text-sm text-gray-300">• Certificate on 80%+ score</p>
          </div>
        </div>
      )}

      {examType === 'mock' && (
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">🎭 Full-Length Mock Test</h3>
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">• 30 questions covering random topics</p>
            <p className="text-sm text-gray-300">• Simulates real Olympiad conditions</p>
            <p className="text-sm text-gray-300">• Negative marking: -0.25 per wrong answer</p>
            <p className="text-sm text-gray-300">• Detailed performance analysis</p>
          </div>
        </div>
      )}

      {examType === 'mega' && (
        <div className="glass-card p-6">
          <h3 className="font-bold mb-4">🏆 Mega Test - Olympiad Simulation</h3>
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-300">• 30 questions (condensed version)</p>
            <p className="text-sm text-gray-300">• Olympiad-level difficulty</p>
            <p className="text-sm text-gray-300">• All India Rank prediction</p>
            <p className="text-sm text-gray-300">• Chapter-wise breakdown</p>
          </div>
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"><p className="text-red-400 text-sm">{error}</p></div>}

      <button onClick={startExam} disabled={loading || (examType === 'topic' && !selectedExamTopic)} className="glow-btn w-full text-lg py-3">
        {loading ? '⏳ Generating Exam...' : '🚀 Start Exam'}
      </button>
    </div>
  );
};

// ============ ANALYTICS ============
const Analytics = () => {
  const { state } = useApp();
  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const stats = state.userStats;
  const accuracy = stats.totalQuestionsSolved > 0 ? Math.round((stats.totalCorrect / stats.totalQuestionsSolved) * 100) : 0;
  const iq = Math.min(160, 80 + Math.floor(stats.totalCorrect * 0.5));
  const eq = Math.min(100, 50 + Math.floor(stats.streak * 2));
  
  const topTopics = Object.entries(stats.topicStats)
    .sort(([,a], [,b]) => b.attempted - a.attempted)
    .slice(0, 5);
  
  const weakTopics = Object.entries(stats.topicStats)
    .filter(([, data]) => data.attempted >= 3)
    .sort(([,a], [,b]) => (a.correct / Math.max(a.attempted,1)) - (b.correct / Math.max(b.attempted,1)))
    .slice(0, 3)
    .map(([id]) => getTopicById(id)?.name || id);
  
  const strongTopics = Object.entries(stats.topicStats)
    .filter(([, data]) => data.attempted >= 3)
    .sort(([,a], [,b]) => (b.correct / Math.max(b.attempted,1)) - (a.correct / Math.max(a.attempted,1)))
    .slice(0, 3)
    .map(([id]) => getTopicById(id)?.name || id);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const r = await generateStudyReport({
        questionsSolved: stats.totalQuestionsSolved,
        accuracy,
        weakTopics,
        strongTopics,
        timeSpent: stats.totalTimeSpent,
        streak: stats.streak
      });
      setReport(r);
    } catch {
      setReport('Unable to generate report. Check your API key.');
    }
    setReportLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <h2 className="text-2xl font-bold">📊 Performance Analytics</h2>
      
      {/* Brain Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center pulse-glow">
          <p className="text-3xl font-bold text-purple-400">{iq}</p>
          <p className="text-xs text-gray-400">IQ Score</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-pink-400">{eq}</p>
          <p className="text-xs text-gray-400">EQ Score</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{Math.round((iq + eq) / 2)}</p>
          <p className="text-xs text-gray-400">FSIQ</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{accuracy}%</p>
          <p className="text-xs text-gray-400">Accuracy</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">📈 Overall Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-2xl font-bold">{stats.totalQuestionsSolved}</p><p className="text-xs text-gray-400">Total Solved</p></div>
          <div><p className="text-2xl font-bold text-green-400">{stats.totalCorrect}</p><p className="text-xs text-gray-400">Correct</p></div>
          <div><p className="text-2xl font-bold text-red-400">{stats.totalWrong}</p><p className="text-xs text-gray-400">Wrong</p></div>
          <div><p className="text-2xl font-bold text-blue-400">{Math.floor(stats.totalTimeSpent / 3600)}h {Math.floor((stats.totalTimeSpent % 3600) / 60)}m</p><p className="text-xs text-gray-400">Time Invested</p></div>
        </div>
      </div>

      {/* Brain Regions */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🧠 Brain Awakening</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats.brainRegions).map(([region, value]) => (
            <div key={region} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-32 truncate">{region}</span>
              <div className="flex-1 progress-bar"><div className="progress-bar-fill" style={{ width: `${value}%` }}></div></div>
              <span className="text-xs font-bold">{value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Topics */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🏅 Most Practiced Topics</h3>
        {topTopics.length === 0 ? (
          <p className="text-gray-400 text-sm">Start practicing to see your top topics!</p>
        ) : (
          <div className="space-y-3">
            {topTopics.map(([topicId, data]) => {
              const topic = getTopicById(topicId);
              const acc = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
              return (
                <div key={topicId} className="flex items-center gap-3">
                  <span className="text-xl">{topic?.icon || '📚'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{topic?.name || topicId}</p>
                    <div className="progress-bar mt-1"><div className="progress-bar-fill" style={{ width: `${acc}%` }}></div></div>
                  </div>
                  <span className="text-sm font-bold">{acc}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Study Report */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">🤖 AI Daily Learning Report</h3>
          <button onClick={generateReport} disabled={reportLoading} className="glow-btn text-sm">
            {reportLoading ? '⏳ Generating...' : '✨ Generate Report'}
          </button>
        </div>
        {report && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4">
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{report}</p>
          </div>
        )}
        {!report && !reportLoading && (
          <p className="text-sm text-gray-400">Click "Generate Report" to get AI-powered insights about your learning progress.</p>
        )}
      </div>

      {/* Weak Areas Alert */}
      {weakTopics.length > 0 && (
        <div className="glass-card p-6 border-yellow-500/30">
          <h3 className="font-bold mb-3 text-yellow-400">⚠️ Areas Needing Attention</h3>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map(t => (
              <span key={t} className="badge badge-medium">{t}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Practice these topics more to improve your overall score.</p>
        </div>
      )}
    </div>
  );
};

// ============ AI ASSISTANT ============
const AIAssistant = () => {
  const { state } = useApp();
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI Study Buddy 🤖 Ask me anything about your Olympiad topics! I can explain concepts, solve problems step-by-step, or give you tips.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [studySource, setStudySource] = useState<'all' | 'wikipedia' | 'openalex' | 'openlibrary'>('all');
  const [resources, setResources] = useState<{ source: string; title: string; summary: string; url: string }[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const context = `Student Level: ${state.userStats.level}, XP: ${state.userStats.xp}, Accuracy: ${state.userStats.totalQuestionsSolved > 0 ? Math.round(state.userStats.totalCorrect / state.userStats.totalQuestionsSolved * 100) : 0}%`;
      const topicName = state.selectedTopic ? getTopicById(state.selectedTopic)?.name || 'General' : 'General Olympiad Prep';
      const response = await askAI(userMsg, context, topicName);
      setMessages(m => [...m, { role: 'assistant', content: response }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message}. Please check your API key in Settings.` }]);
    }
    setLoading(false);
  };

  const searchResources = async () => {
    const query = input.trim() || (state.selectedTopic ? getTopicById(state.selectedTopic)?.name : 'Olympiad mathematics');
    setResourceLoading(true);
    try {
      const response = await fetch(`/api/study?q=${encodeURIComponent(query || 'Olympiad mathematics')}&source=${studySource}`);
      const data = await response.json();
      setResources(data.results || []);
    } catch {
      setResources([]);
    }
    setResourceLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-4">
      <h2 className="text-2xl font-bold">🤖 AI Study Buddy</h2>
      
      <div className="glass-card p-4 h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`chat-bubble ${msg.role === 'assistant' ? 'chat-bubble-ai' : ''}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="chat-bubble chat-bubble-ai">
                <p className="text-sm animate-pulse">🧠 Thinking...</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything about your topics..." className="flex-1" />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="glow-btn">Send</button>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="text-sm text-gray-400 mb-2">💡 Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {['Explain photosynthesis', 'How to solve linear equations?', 'What is Pythagoras theorem?', 'Tips for IMO preparation'].map(q => (
            <button key={q} onClick={() => setInput(q)} className="text-xs bg-white/5 hover:bg-white/10 rounded-full px-3 py-1 transition-all">{q}</button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <p className="text-sm font-semibold mr-auto">📚 Free Study Sources</p>
          {(['all', 'wikipedia', 'openalex', 'openlibrary'] as const).map(source => (
            <button key={source} onClick={() => setStudySource(source)} className={`text-xs px-3 py-1 rounded-full ${studySource === source ? 'bg-purple-500/30 text-white' : 'bg-white/5 text-gray-400'}`}>{source === 'all' ? 'All' : source === 'openalex' ? 'Research' : source === 'openlibrary' ? 'Books' : 'Wiki'}</button>
          ))}
          <button onClick={searchResources} disabled={resourceLoading} className="glow-btn text-sm">{resourceLoading ? 'Searching...' : 'Search'}</button>
        </div>
        {resources.length > 0 && <div className="space-y-2">{resources.map((item, index) => (
          <a key={`${item.source}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-white/5 hover:bg-white/10 p-3 transition-all">
            <p className="text-xs text-purple-300">{item.source}</p><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
          </a>
        ))}</div>}
      </div>
    </div>
  );
};

// ============ JOURNEY / GAMIFICATION ============
const Journey = () => {
  const { state } = useApp();
  const chapters = [
    { num: 1, name: 'The Awakening', xp: 0 },
    { num: 2, name: 'First Challenge', xp: 100 },
    { num: 3, name: 'The Mentor Appears', xp: 300 },
    { num: 4, name: 'Training Arc', xp: 600 },
    { num: 5, name: 'The Tournament', xp: 1000 },
    { num: 6, name: 'The Dark Trial', xp: 1500 },
    { num: 7, name: 'Allies Unite', xp: 2200 },
    { num: 8, name: 'The Revelation', xp: 3000 },
    { num: 9, name: 'Power Unleashed', xp: 4000 },
    { num: 10, name: 'The Final Gate', xp: 5500 },
    { num: 11, name: 'FULL AWAKENING', xp: 7500 },
  ];

  const achievements = [
    { id: 'first_blood', name: 'First Blood', desc: 'Answer your first question correctly', icon: '🗡️', req: 1 },
    { id: 'century', name: 'Century Club', desc: 'Solve 100 questions', icon: '💯', req: 100 },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Answer 10 questions in under 2 min each', icon: '⚡', req: 50 },
    { id: 'perfect', name: 'Perfect Score', desc: 'Get 100% on a quiz', icon: '🎯', req: 25 },
    { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: '🔥', req: 7 },
    { id: 'streak_30', name: 'Monthly Master', desc: '30-day streak', icon: '👑', req: 30 },
    { id: 'topic_master', name: 'Topic Master', desc: 'Master any topic (80%+)', icon: '🏅', req: 80 },
    { id: 'brain_awakened', name: 'Brain Awakened', desc: 'Reach Level 10', icon: '🧠', req: 10 },
    { id: 'olympiad_ready', name: 'Olympiad Ready', desc: 'Reach Level 25', icon: '🏆', req: 25 },
    { id: 'xp_1000', name: 'XP Hunter', desc: 'Earn 1000 XP', icon: '⭐', req: 1000 },
  ];

  const earnedAchievements = achievements.filter(a => {
    if (a.id === 'first_blood') return state.userStats.totalCorrect >= 1;
    if (a.id === 'century') return state.userStats.totalQuestionsSolved >= 100;
    if (a.id === 'speed_demon') return state.userStats.totalQuestionsSolved >= 50;
    if (a.id === 'streak_7') return state.userStats.streak >= 7;
    if (a.id === 'streak_30') return state.userStats.streak >= 30;
    if (a.id === 'brain_awakened') return state.userStats.level >= 10;
    if (a.id === 'olympiad_ready') return state.userStats.level >= 25;
    if (a.id === 'xp_1000') return state.userStats.xp >= 1000;
    return false;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-6">
      <h2 className="text-2xl font-bold">⚔️ Your Journey</h2>

      {/* Character Card */}
      <div className="glass-card p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative z-10">
          <div className="text-6xl mb-3 float-anim">
            {state.userStats.level >= 25 ? '🦸' : state.userStats.level >= 10 ? '🧙' : state.userStats.level >= 5 ? '⚔️' : '🌱'}
          </div>
          <h3 className="text-xl font-bold gold-text">
            {state.userStats.level >= 25 ? 'Olympiad Champion' : state.userStats.level >= 10 ? 'Rising Star' : state.userStats.level >= 5 ? 'Brave Warrior' : 'Novice Learner'}
          </h3>
          <p className="text-gray-400">Level {state.userStats.level} • {state.userStats.xp} XP • Chapter {state.userStats.chapterUnlocked}/11</p>
        </div>
      </div>

      {/* Story Chapters */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">📖 Story Chapters</h3>
        <div className="space-y-3">
          {chapters.map(ch => {
            const unlocked = state.userStats.xp >= ch.xp;
            const current = state.userStats.chapterUnlocked === ch.num;
            return (
              <div key={ch.num} className={`flex items-center gap-4 p-3 rounded-lg ${unlocked ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5 opacity-50'}`}>
                <span className="text-2xl">{unlocked ? '✅' : '🔒'}</span>
                <div className="flex-1">
                  <p className={`font-semibold ${current ? 'gold-text' : ''}`}>Chapter {ch.num}: {ch.name}</p>
                  <p className="text-xs text-gray-400">{ch.xp} XP required</p>
                </div>
                {current && <span className="badge badge-medium">Current</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🏆 Achievements ({earnedAchievements.length}/{achievements.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {achievements.map(a => {
            const earned = earnedAchievements.find(e => e.id === a.id);
            return (
              <div key={a.id} className={`text-center p-3 rounded-lg ${earned ? 'bg-yellow-500/10 border border-yellow-500/30 sparkle' : 'bg-white/5 opacity-40'}`}>
                <span className="text-3xl block mb-1">{a.icon}</span>
                <p className="text-xs font-semibold">{a.name}</p>
                <p className="text-xs text-gray-400">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🏅 Leaderboard</h3>
        <div className="space-y-3">
          {[
            { rank: 1, name: 'You', xp: state.userStats.xp, isYou: true },
            { rank: 2, name: 'Arjun_S7', xp: Math.max(0, state.userStats.xp + Math.floor(Math.random() * 500) - 200), isYou: false },
            { rank: 3, name: 'Priya_Std4', xp: Math.max(0, state.userStats.xp - Math.floor(Math.random() * 300)), isYou: false },
            { rank: 4, name: 'Rahul_IMO', xp: Math.max(0, state.userStats.xp - Math.floor(Math.random() * 600)), isYou: false },
            { rank: 5, name: 'Ananya_ISO', xp: Math.max(0, state.userStats.xp - Math.floor(Math.random() * 800)), isYou: false },
          ].sort((a, b) => b.xp - a.xp).map((player, idx) => (
            <div key={player.name} className={`flex items-center gap-4 p-3 rounded-lg ${player.isYou ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`}>
              <span className="text-xl font-bold w-8 text-center">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </span>
              <div className="flex-1">
                <p className={`font-semibold ${player.isYou ? 'gold-text' : ''}`}>{player.name} {player.isYou && '(You)'}</p>
                <p className="text-xs text-gray-400">Level {Math.floor(player.xp / 150) + 1}</p>
              </div>
              <span className="font-bold text-purple-400">{player.xp} XP</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">Leaderboard updates in real-time based on your XP</p>
      </div>
    </div>
  );
};

// ============ SETTINGS ============
const Settings = () => {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(getApiKey());
  const [validationMsg, setValidationMsg] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [currentModel, setCurrentModel] = useState(getSelectedModel());
  const [currentApiMode, setCurrentApiMode] = useState(getApiMode());
  const [gatewayModels, setGatewayModels] = useState<GatewayModelOption[]>(AVAILABLE_MODELS.map(model => ({ id: model.id, name: model.name })));
  const [gatewayAuth, setGatewayAuth] = useState<'checking' | 'ready' | 'missing'>('checking');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getGatewaySetup().then(setup => {
      if (setup.models?.length) setGatewayModels(setup.models.map(model => ({ id: model.id.replace(/^google\//, ''), name: model.name })));
      setGatewayAuth(setup.gatewayConfigured ? 'ready' : 'missing');
    }).catch(() => setGatewayAuth('missing'));
  }, []);

  const handleValidate = () => {
    const result = validateApiKey(apiKey);
    setValidationMsg(result.message);
    setIsValid(result.valid);
    if (result.valid) {
      saveApiKey(apiKey.trim());
      resetGenAI();
      dispatch({ type: 'SET_API_KEY_SET', value: true });
      dispatch({ type: 'SHOW_TOAST', toast: { message: '✅ API key saved successfully!', type: 'success' } });
    }
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model as ModelId);
    setSelectedModel(model as ModelId);
    dispatch({ type: 'SHOW_TOAST', toast: { message: `Model changed to ${model}`, type: 'success' } });
  };

  const handleApiModeChange = (mode: ApiMode) => {
    setCurrentApiMode(mode);
    setApiMode(mode);
    resetGenAI();
    dispatch({ type: 'SHOW_TOAST', toast: { message: `API mode changed to ${mode}`, type: 'info' } });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testApiConnection();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    }
    setTesting(false);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    resetGenAI();
    dispatch({ type: 'SET_API_KEY_SET', value: false });
    setValidationMsg('');
    setIsValid(null);
    setTestResult(null);
    dispatch({ type: 'SHOW_TOAST', toast: { message: 'API key cleared', type: 'info' } });
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure? This will reset ALL your progress!')) {
      localStorage.removeItem('olympiad_quest_state');
      window.location.reload();
    }
  };

  const keyPrefix = apiKey ? apiKey.substring(0, 4) : '';

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Settings</h2>

      {/* API Key */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">☁️ AI Router & Browser Fallback</h3>
        <p className="text-sm text-gray-400 mb-4">
          Automatic mode uses Vercel OIDC on the server and discovers available Gateway models. It tries Gemini 3.5 Flash-Lite → Gemini 3.5 Flash → Gemini 3.6 → 3.7 → 3.8, then other available providers. A Gemini key is optional and used only as a browser fallback. Get one from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
            Google AI Studio
          </a>
          {' '}— Supports both <strong className="text-purple-400">AQ</strong> (new) and <strong className="text-blue-400">AIza</strong> (legacy) formats.
        </p>
        <div className="space-y-3">
          <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setIsValid(null); setValidationMsg(''); setTestResult(null); }}
            placeholder="Optional browser fallback: Gemini key (AQ... or AIza...)" className="w-full" />
          <div className="flex flex-wrap gap-2">
            <button onClick={handleValidate} className="glow-btn">Validate & Save</button>
            {apiKey && <button onClick={handleClear} className="glow-btn glow-btn-danger">Clear Key</button>}
            <button onClick={handleTestConnection} disabled={testing} className="glow-btn glow-btn-success">
              {testing ? '⏳ Testing...' : '🧪 Test Connection'}
            </button>
          </div>
          {validationMsg && (
            <p className={`text-sm ${isValid ? 'text-green-400' : 'text-red-400'}`}>{validationMsg}</p>
          )}
          {testResult && (
            <div className={`rounded-lg p-3 mt-2 ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>{testResult.message}</p>
              {testResult.details && (
                <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">{JSON.stringify(testResult.details, null, 2)}</pre>
              )}
            </div>
          )}
          <div className="bg-white/5 rounded-lg p-3 mt-3">
            <p className="text-xs text-gray-400">
              <strong>Gateway setup:</strong> {gatewayAuth === 'checking' ? 'Checking…' : gatewayAuth === 'ready' ? 'Connected through Vercel OIDC or a server key' : 'No Gateway credentials detected'}.
            </p>
            <p className="text-xs text-gray-400 mt-1"><strong>Last response:</strong> {getLastProvider()}.</p>
            <p className="text-xs text-gray-400 mt-1">
              <strong>Key Format:</strong> {keyPrefix === 'AQ' ? '🆕 AQ Authentication Key (new)' : keyPrefix === 'AIza' ? '🔙 AIza Traffic Key (legacy)' : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🤖 Preferred Model & Fallback Order</h3>
        <p className="text-sm text-gray-400 mb-4">The selected Gemini model is tried first. If unavailable or rate-limited, the router checks the remaining available Gemini Flash models in order, then other providers.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gatewayModels.map(m => (
            <button key={m.id} onClick={() => handleModelChange(m.id)}
              className={`text-left p-3 rounded-lg border transition-all ${currentModel === m.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
              <p className="font-semibold text-sm">{m.name} {currentModel === m.id && '✓'}</p>
              <p className="text-xs text-gray-400">{m.id === 'gemini-3.5-flash-lite' ? 'Default · fastest and cost-effective' : 'Available through the live Gateway catalog'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Mode */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">🔌 API Mode</h3>
        <p className="text-sm text-gray-400 mb-4">Choose automatic Gateway routing or a direct Gemini connection. Automatic mode is recommended.</p>
        <div className="space-y-3">
          {([
            { id: 'auto' as const, name: 'Automatic (Recommended)', desc: 'Vercel Gateway with OIDC authentication, Gemini model discovery, provider failover, and optional saved Gemini fallback' },
            { id: 'gateway' as const, name: 'Vercel AI Gateway only', desc: 'Use the server-side Gateway and automatic model fallback; does not use a browser key' },
            { id: 'sdk' as const, name: 'Gemini SDK', desc: 'Use your optional saved Gemini key with the Google SDK' },
            { id: 'interactions' as const, name: 'Interactions API (New)', desc: 'Uses the new /v1beta/interactions endpoint' },
            { id: 'direct' as const, name: 'Direct REST API', desc: 'Direct HTTP calls to generateContent endpoint' },
          ]).map(mode => (
            <button key={mode.id} onClick={() => handleApiModeChange(mode.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${currentApiMode === mode.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
              <p className="font-semibold text-sm">{mode.name} {currentApiMode === mode.id && '✓'}</p>
              <p className="text-xs text-gray-400">{mode.desc}</p>
            </button>
          ))}
        </div>
        <div className="bg-white/5 rounded-lg p-3 mt-4">
          <p className="text-xs text-gray-400">
            <strong>💡 Tip:</strong> Automatic mode handles model and provider fallbacks. Direct Gemini modes require the optional Gemini key above.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <strong>Endpoints:</strong> v1beta (primary) → v1 (fallback)
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">💾 Data Management</h3>
        <div className="space-y-3">
          <button onClick={handleResetProgress} className="glow-btn glow-btn-danger">🗑️ Reset All Progress</button>
          <p className="text-xs text-gray-400">This will clear your XP, achievements, and all saved data. API key will be preserved.</p>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4">ℹ️ About Olympiad Quest</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>🏆 AI-Powered Olympiad Preparation App</p>
          <p>📚 44 Topics covering IMO & ISO for Standards 4 & 7</p>
          <p>🤖 Powered by Google Gemini AI (3.5/3.6/3.7/3.8 Flash models)</p>
          <p>🔌 Supports SDK, Interactions API, and Direct REST API</p>
          <p>🔑 Compatible with AQ (new) and AIza (legacy) API keys</p>
          <p>🎮 Gamified learning with anime-style progression</p>
          <p>📱 Mobile-responsive design</p>
          <p className="text-xs text-gray-500 mt-4">Version 3.0 • Built with React + Tailwind CSS + Gemini 3.x AI</p>
        </div>
      </div>
    </div>
  );
};

// ============ RESULTS PAGE ============
const ResultsPage = () => {
  const { state, dispatch } = useApp();
  return (
    <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
      <div className="glass-card p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-gray-300 mb-6">Check your analytics for detailed performance insights.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'analytics' })} className="glow-btn">📊 View Analytics</button>
          <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'dashboard' })} className="glow-btn glow-btn-gold">🏠 Home</button>
        </div>
      </div>
    </div>
  );
};

// ============ TOPICS PAGE ============
const TopicsPage = () => {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<'all' | 'imo' | 'iso'>('all');
  const [stdFilter, setStdFilter] = useState<'all' | '4' | '7'>('all');

  const filteredTopics = topics.filter(t => {
    if (filter !== 'all' && t.olympiad.toLowerCase() !== filter) return false;
    if (stdFilter !== 'all' && t.standard !== Number(stdFilter)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      <h2 className="text-2xl font-bold">📚 All Topics</h2>
      
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(['all', 'imo', 'iso'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`}>
              {f === 'all' ? '📚 All' : f === 'imo' ? '🔢 IMO' : '🔬 ISO'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', '4', '7'] as const).map(f => (
            <button key={f} onClick={() => setStdFilter(f)} className={`tab-btn ${stdFilter === f ? 'active' : ''}`}>
              {f === 'all' ? 'All Std' : `Std ${f}`}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400">{filteredTopics.length} topics found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTopics.map(topic => {
          const stats = state.userStats.topicStats[topic.id];
          const mastery = stats ? Math.round((stats.correct / Math.max(stats.attempted, 1)) * 100) : 0;
          return (
            <div key={topic.id} onClick={() => { dispatch({ type: 'SET_TOPIC', topic: topic.id }); dispatch({ type: 'SET_PAGE', page: 'topic-view' }); }}
              className="topic-card cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{topic.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${topic.color}22`, color: topic.color }}>
                    {topic.olympiad}
                  </span>
                  <span className="text-xs text-gray-400">Std {topic.standard}</span>
                </div>
              </div>
              <h4 className="font-semibold mb-1">{topic.name}</h4>
              <p className="text-xs text-gray-400 mb-3">{topic.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>📖 {topic.chapters.length} chapters</span>
              </div>
              {stats ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{stats.attempted} solved</span>
                    <span>{mastery}% mastery</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${mastery}%` }}></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-blue-400">✨ Start practicing!</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ MAIN APP CONTENT ============
const AppContent = () => {
  const { state, dispatch } = useApp();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'topics': return <TopicsPage />;
      case 'topic-view': return <TopicView />;
      case 'quiz': return <Quiz />;
      case 'daily': return <DailyChallenge />;
      case 'exams': return <ExamCorner />;
      case 'analytics': return <Analytics />;
      case 'assistant': return <AIAssistant />;
      case 'journey': return <Journey />;
      case 'settings': return <Settings />;
      case 'results': return <ResultsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <Navbar />
      <Toast />
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-card rounded-t-2xl px-2 py-2">
        <div className="flex justify-around">
          {[
            { id: 'dashboard', icon: '🏠', label: 'Home' },
            { id: 'topics', icon: '📚', label: 'Topics' },
            { id: 'daily', icon: '🎯', label: 'Daily' },
            { id: 'analytics', icon: '📊', label: 'Stats' },
            { id: 'journey', icon: '⚔️', label: 'Quest' },
          ].map(item => (
            <button key={item.id} onClick={() => dispatch({ type: 'SET_PAGE', page: item.id })}
              className={`flex flex-col items-center py-1 px-2 rounded-lg ${state.currentPage === item.id ? 'text-white bg-white/10' : 'text-gray-400'}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      {!state.apiKeySet && getApiMode() !== 'auto' && getApiMode() !== 'gateway' && state.currentPage !== 'settings' && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-yellow-400">API Key Required</p>
              <p className="text-sm text-gray-300">Set your Gemini API key to generate AI-powered questions. Supports both <strong>AQ</strong> (new) and <strong>AIza</strong> (legacy) formats.</p>
            </div>
            <button onClick={() => dispatch({ type: 'SET_PAGE', page: 'settings' })} className="glow-btn glow-btn-gold text-sm whitespace-nowrap">Setup →</button>
          </div>
        </div>
      )}
      {renderPage()}
    </div>
  );
};

// ============ ROOT APP ============
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
