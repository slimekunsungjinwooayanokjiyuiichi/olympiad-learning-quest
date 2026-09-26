import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Question } from '../services/gemini';
import { loadProgress, saveProgress, supabase } from '../services/supabase';

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  totalQuestionsSolved: number;
  totalCorrect: number;
  totalWrong: number;
  totalTimeSpent: number; // seconds
  achievements: string[];
  chapterUnlocked: number;
  topicStats: Record<string, { attempted: number; correct: number; timeSpent: number; lastPracticed: string }>;
  dailyStats: Record<string, { questionsSolved: number; correct: number; timeSpent: number }>;
  brainRegions: Record<string, number>;
}

export interface AppState {
  currentPage: string;
  selectedStandard: number | null;
  selectedOlympiad: string | null;
  selectedTopic: string | null;
  userStats: UserStats;
  apiKeySet: boolean;
  quizMode: 'practice' | 'daily' | 'exam' | 'mock' | 'mega' | null;
  currentQuizQuestions: Question[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const defaultBrainRegions: Record<string, number> = {
  'Prefrontal Cortex': 0,
  'Parietal Lobe': 0,
  'Temporal Lobe': 0,
  'Occipital Lobe': 0,
  'Cerebellum': 0,
  'Hippocampus': 0,
  'Amygdala': 0,
  'Basal Ganglia': 0,
  'Thalamus': 0,
  'Brain Stem': 0
};

const defaultStats: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  totalQuestionsSolved: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalTimeSpent: 0,
  achievements: [],
  chapterUnlocked: 1,
  topicStats: {},
  dailyStats: {},
  brainRegions: defaultBrainRegions
};

type Action =
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SET_STANDARD'; standard: number | null }
  | { type: 'SET_OLYMPIAD'; olympiad: string | null }
  | { type: 'SET_TOPIC'; topic: string | null }
  | { type: 'SET_QUIZ_MODE'; mode: AppState['quizMode'] }
  | { type: 'SET_QUIZ_QUESTIONS'; questions: Question[] }
  | { type: 'UPDATE_STATS'; stats: Partial<UserStats> }
  | { type: 'ADD_XP'; xp: number }
  | { type: 'RECORD_ATTEMPT'; topicId: string; correct: boolean; timeSpent: number }
  | { type: 'SET_API_KEY_SET'; value: boolean }
  | { type: 'SHOW_TOAST'; toast: AppState['toast'] }
  | { type: 'HIDE_TOAST' }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };

const getChapterForXP = (xp: number): number => {
  if (xp >= 7500) return 11;
  if (xp >= 5500) return 10;
  if (xp >= 4000) return 9;
  if (xp >= 3000) return 8;
  if (xp >= 2200) return 7;
  if (xp >= 1500) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
};

const getLevelForXP = (xp: number): number => {
  return Math.floor(xp / 150) + 1;
};

const getToday = (): string => new Date().toISOString().split('T')[0];

const checkStreak = (stats: UserStats): UserStats => {
  const today = getToday();
  if (stats.lastActiveDate === today) return stats;
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = stats.streak;
  
  if (stats.lastActiveDate === yesterday) {
    newStreak += 1;
  } else if (stats.lastActiveDate !== today) {
    newStreak = 1;
  }
  
  return { ...stats, streak: newStreak, lastActiveDate: today };
};

const updateBrainRegions = (regions: Record<string, number>, topicId: string, correct: boolean): Record<string, number> => {
  if (!correct) return regions;
  const newRegions = { ...regions };
  // Map topics to brain regions
  if (topicId.includes('Logic') || topicId.includes('Pattern') || topicId.includes('Equation') || topicId.includes('Algebra')) {
    newRegions['Prefrontal Cortex'] = Math.min(100, (newRegions['Prefrontal Cortex'] || 0) + 2);
  }
  if (topicId.includes('Geometry') || topicId.includes('Area') || topicId.includes('Symmetry') || topicId.includes('Triangle')) {
    newRegions['Parietal Lobe'] = Math.min(100, (newRegions['Parietal Lobe'] || 0) + 2);
  }
  if (topicId.includes('Data') || topicId.includes('Graph')) {
    newRegions['Temporal Lobe'] = Math.min(100, (newRegions['Temporal Lobe'] || 0) + 2);
  }
  if (topicId.includes('ISO') || topicId.includes('Plant') || topicId.includes('Animal') || topicId.includes('Body')) {
    newRegions['Hippocampus'] = Math.min(100, (newRegions['Hippocampus'] || 0) + 2);
  }
  newRegions['Cerebellum'] = Math.min(100, (newRegions['Cerebellum'] || 0) + 1);
  newRegions['Basal Ganglia'] = Math.min(100, (newRegions['Basal Ganglia'] || 0) + 1);
  return newRegions;
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_STANDARD':
      return { ...state, selectedStandard: action.standard };
    case 'SET_OLYMPIAD':
      return { ...state, selectedOlympiad: action.olympiad };
    case 'SET_TOPIC':
      return { ...state, selectedTopic: action.topic };
    case 'SET_QUIZ_MODE':
      return { ...state, quizMode: action.mode };
    case 'SET_QUIZ_QUESTIONS':
      return { ...state, currentQuizQuestions: action.questions };
    case 'UPDATE_STATS': {
      const updated = { ...state.userStats, ...action.stats };
      updated.level = getLevelForXP(updated.xp);
      updated.chapterUnlocked = getChapterForXP(updated.xp);
      return { ...state, userStats: checkStreak(updated) };
    }
    case 'ADD_XP': {
      const newXp = state.userStats.xp + action.xp;
      const updated = {
        ...state.userStats,
        xp: newXp,
        level: getLevelForXP(newXp),
        chapterUnlocked: getChapterForXP(newXp)
      };
      return { ...state, userStats: checkStreak(updated) };
    }
    case 'RECORD_ATTEMPT': {
      const today = getToday();
      const topicStats = { ...state.userStats.topicStats };
      if (!topicStats[action.topicId]) {
        topicStats[action.topicId] = { attempted: 0, correct: 0, timeSpent: 0, lastPracticed: '' };
      }
      topicStats[action.topicId] = {
        ...topicStats[action.topicId],
        attempted: topicStats[action.topicId].attempted + 1,
        correct: topicStats[action.topicId].correct + (action.correct ? 1 : 0),
        timeSpent: topicStats[action.topicId].timeSpent + action.timeSpent,
        lastPracticed: today
      };
      
      const dailyStats = { ...state.userStats.dailyStats };
      if (!dailyStats[today]) {
        dailyStats[today] = { questionsSolved: 0, correct: 0, timeSpent: 0 };
      }
      dailyStats[today] = {
        questionsSolved: dailyStats[today].questionsSolved + 1,
        correct: dailyStats[today].correct + (action.correct ? 1 : 0),
        timeSpent: dailyStats[today].timeSpent + action.timeSpent
      };
      
      const brainRegions = updateBrainRegions(state.userStats.brainRegions, action.topicId, action.correct);
      
      return {
        ...state,
        userStats: checkStreak({
          ...state.userStats,
          totalQuestionsSolved: state.userStats.totalQuestionsSolved + 1,
          totalCorrect: state.userStats.totalCorrect + (action.correct ? 1 : 0),
          totalWrong: state.userStats.totalWrong + (action.correct ? 0 : 1),
          totalTimeSpent: state.userStats.totalTimeSpent + action.timeSpent,
          topicStats,
          dailyStats,
          brainRegions
        })
      };
    }
    case 'SET_API_KEY_SET':
      return { ...state, apiKeySet: action.value };
    case 'SHOW_TOAST':
      return { ...state, toast: action.toast };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'LOAD_STATE':
      return { ...state, ...action.state };
    default:
      return state;
  }
};

const loadFromStorage = (): Partial<AppState> => {
  try {
    const saved = localStorage.getItem('olympiad_quest_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { userStats: { ...defaultStats, ...parsed.userStats } };
    }
  } catch {}
  return {};
};

const saveToStorage = (state: AppState) => {
  try {
    localStorage.setItem('olympiad_quest_state', JSON.stringify({
      userStats: state.userStats
    }));
  } catch {}
};

const initialState: AppState = {
  currentPage: 'dashboard',
  selectedStandard: null,
  selectedOlympiad: null,
  selectedTopic: null,
  userStats: { ...defaultStats, ...loadFromStorage()?.userStats },
  apiKeySet: !!localStorage.getItem('gemini_api_key'),
  quizMode: null,
  currentQuizQuestions: [],
  toast: null
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType>({ state: initialState, dispatch: () => {} });

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [cloudReady, setCloudReady] = React.useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    loadProgress().then(stats => {
      if (active && stats) dispatch({ type: 'UPDATE_STATS', stats: stats as Partial<UserStats> });
    }).catch(error => console.error('Could not load Supabase progress', error))
      .finally(() => { if (active) setCloudReady(true); });
    return () => { active = false; };
  }, []);
  
  useEffect(() => {
    saveToStorage(state);
    if (!cloudReady || !supabase) return;
    const timer = setTimeout(() => {
      saveProgress(state.userStats as unknown as Record<string, unknown>)
        .catch(error => console.error('Could not save Supabase progress', error));
    }, 600);
    return () => clearTimeout(timer);
  }, [state.userStats, cloudReady]);
  
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
