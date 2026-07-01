'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Zap, 
  Target, 
  RotateCcw, 
  ChevronRight,
  TrendingUp,
  Award,
  Lock,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { formatResponseTime } from '@/lib/utils';

// Default mock student ID for demo/local testing
const DEFAULT_STUDENT_ID = '6c49c487-0a33-4815-bb32-112b76bee827';

interface Question {
  operand1: number;
  operand2: number;
  operationType: 'MULTIPLICATION' | 'DIVISION';
  expectedAnswer: number;
}

function PracticeInterfaceContent() {
  const searchParams = useSearchParams();
  const queryStudentId = searchParams.get('studentId') || DEFAULT_STUDENT_ID;
  const examType = searchParams.get('examType'); // 'DIAGNOSTIC' or 'POST_TEST'
  const queryOperation = searchParams.get('operationType') as 'MULTIPLICATION' | 'DIVISION' | null;

  // 1. Session Setup States
  const [studentId, setStudentId] = useState(queryStudentId);
  const [inSession, setInSession] = useState(false);
  const [operationType, setOperationType] = useState<'MULTIPLICATION' | 'DIVISION'>(
    queryOperation === 'DIVISION' ? 'DIVISION' : 'MULTIPLICATION'
  );
  const [level, setLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('BEGINNER');
  const [practiceMode, setPracticeMode] = useState<'FLASH_DRILL' | 'MISSING_NUMBER'>('FLASH_DRILL');
  const [limit, setLimit] = useState(10);
  const [settings, setSettings] = useState<any>(null);
  
  // 2. Active Session States
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Input and Timer States
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timerMs, setTimerMs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  
  // Exam multiple attempts state
  const [examRound, setExamRound] = useState(1);
  const [examScores, setExamScores] = useState<number[]>([]);
  const [totalCorrectAllRounds, setTotalCorrectAllRounds] = useState(0);
  const [showRoundBreak, setShowRoundBreak] = useState(false);
  const [completedRoundScore, setCompletedRoundScore] = useState<number | null>(null);

  // Timer references for precision performance.now()
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalCorrectRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation & Auto focus
  const inputRef = useRef<HTMLInputElement>(null);

  // Level Lock/Unlock progress states
  const [levelProgress, setLevelProgress] = useState<any>(null);
  const [newLevelUnlockedName, setNewLevelUnlockedName] = useState<string | null>(null);
  const [examRequested, setExamRequested] = useState(false);
  const [examUnlocked, setExamUnlocked] = useState(false);
  const [requestExamLoading, setRequestExamLoading] = useState(false);
  const [monitoringStage, setMonitoringStage] = useState(0);
  const [lastExamDate, setLastExamDate] = useState<string | null>(null);

  const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';

  const isPathLockedForPostTest = (op: 'MULTIPLICATION' | 'DIVISION') => {
    if (examType !== 'POST_TEST') return false;
    const pk = op === 'MULTIPLICATION' ? 'multiplication' : 'division';
    return !(levelProgress?.[pk]?.EXPERT?.unlocked ?? false);
  };

  const fetchProgress = async (isSessionCompletion = false) => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/practice?studentId=${studentId}&checkProgress=true`);
      const data = await res.json();
      if (res.ok && data.progress) {
        if (isSessionCompletion && levelProgress) {
          const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
          const prevStatus = levelProgress[pathKey] || {};
          const nextStatus = data.progress[pathKey] || {};
          
          const levelsToCheck = ['INTERMEDIATE', 'ADVANCED', 'EXPERT'];
          let highestNewlyUnlocked: string | null = null;
          
          for (const lvl of levelsToCheck) {
            const wasUnlocked = prevStatus[lvl]?.unlocked ?? false;
            const isUnlocked = nextStatus[lvl]?.unlocked ?? false;
            if (!wasUnlocked && isUnlocked) {
              highestNewlyUnlocked = lvl;
            }
          }
          
          if (highestNewlyUnlocked) {
            setNewLevelUnlockedName(highestNewlyUnlocked);
          }
        }
        setLevelProgress(data.progress);
      }
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
      if (res.ok) {
        setExamRequested(data.examRequested ?? false);
        setExamUnlocked(data.examUnlocked ?? false);
        setMonitoringStage(data.monitoringStage ?? 0);
        setLastExamDate(data.lastExamDate ?? null);
      }
    } catch (err) {
      console.error('Failed to fetch level progress:', err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [studentId]);

  // If the active level becomes locked, fall back to BEGINNER
  useEffect(() => {
    if (levelProgress) {
      const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
      const isSelectedLevelUnlocked = levelProgress[pathKey]?.[level]?.unlocked ?? false;
      if (!isSelectedLevelUnlocked) {
        setLevel('BEGINNER');
      }
    }
  }, [operationType, levelProgress, level]);

  const getLevelStatus = (lvlKey: string) => {
    if (!levelProgress) return { unlocked: false, progress: { sessionCount: 0, average: 0, passed: false } };
    const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
    return levelProgress[pathKey]?.[lvlKey] || { unlocked: false, progress: { sessionCount: 0, average: 0, passed: false } };
  };

  const getPrerequisiteText = (levelKey: string) => {
    if (!levelProgress) return '';
    const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
    
    if (levelKey === 'BEGINNER') {
      const needsPreTest = levelProgress[pathKey]?.BEGINNER?.needsPreTest;
      if (needsPreTest) {
        return 'Pre-Test';
      }
      return '';
    }

    let prereqKey = '';
    if (levelKey === 'INTERMEDIATE') prereqKey = 'BEGINNER';
    else if (levelKey === 'ADVANCED') prereqKey = 'INTERMEDIATE';
    else if (levelKey === 'EXPERT') prereqKey = 'ADVANCED';
    
    if (!prereqKey) return '';
    
    const prereqStatus = levelProgress[pathKey]?.[prereqKey]?.progress;
    if (!prereqStatus) return '';
    
    const { sessionCount, average } = prereqStatus;
    if (sessionCount < 3) {
      return `Latihan: ${sessionCount}/3`;
    }
    return `Rerata: ${average}%`;
  };

  // Sync studentId and operationType query parameters
  useEffect(() => {
    if (queryStudentId) {
      setStudentId(queryStudentId);
    }
    if (queryOperation) {
      setOperationType(queryOperation);
    }
  }, [queryStudentId, queryOperation]);

  // Lock configurations if in Exam Mode
  useEffect(() => {
    if (examType) {
      setLevel('EXPERT');
      setPracticeMode('FLASH_DRILL');
    }
  }, [examType]);

  // Synchronize question limit from settings
  useEffect(() => {
    if (settings) {
      const isMult = operationType === 'MULTIPLICATION';
      if (examType === 'DIAGNOSTIC') {
        setLimit(isMult ? settings.preTestLimitMult : settings.preTestLimitDiv);
      } else if (examType === 'POST_TEST') {
        setLimit(isMult ? settings.postTestLimitMult : settings.postTestLimitDiv);
      } else {
        setLimit(isMult ? settings.practiceLimitMult : settings.practiceLimitDiv);
      }
    }
  }, [settings, operationType, examType]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Autofocus input when index changes or feedback clears
  useEffect(() => {
    if (inSession && !feedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inSession, currentIdx, feedback]);

  const getFinalScore = () => {
    if (examType === 'DIAGNOSTIC') {
      return examScores.length > 0 ? Math.round(examScores.reduce((sum, s) => sum + s, 0) / examScores.length) : 0;
    }
    return Math.round((totalCorrectRef.current / (questions.length || 1)) * 100);
  };

  // Start the Practice session: call APIs to start session & get questions
  const handleStartSession = async () => {
    const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
    
    if (examType === 'POST_TEST') {
      const isExpertUnlocked = levelProgress?.[pathKey]?.EXPERT?.unlocked ?? false;
      if (!isExpertUnlocked) {
        alert('Ujian Akhir Master terkunci! Anda harus menyelesaikan semua tingkatan level latihan terlebih dahulu.');
        return;
      }
      if (!examUnlocked) {
        alert('Ujian Akhir Master belum diaktifkan oleh Guru Anda. Silakan hubungi Guru untuk membuka kunci.');
        return;
      }
    }

    if (examType === 'MONITORING') {
      const maxStages = settings?.monitoringStagesCount ?? 5;
      const cooldownDays = settings?.monitoringCooldownDays ?? 7;
      if (monitoringStage >= maxStages) {
        alert('Anda telah menyelesaikan seluruh Ujian Monitoring (True Master)!');
        return;
      }
      if (lastExamDate) {
        const lastExam = new Date(lastExamDate).getTime();
        const now = new Date().getTime();
        const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
        if ((now - lastExam) < cooldownMs) {
          const remainingMs = cooldownMs - (now - lastExam);
          const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
          alert(`Ujian Monitoring terkunci! Silakan tunggu ${remainingDays} hari lagi.`);
          return;
        }
      }
    }

    if (!examType) {
      const isSelectedLevelUnlocked = levelProgress
        ? (levelProgress[pathKey]?.[level]?.unlocked ?? false)
        : false;
      if (!isSelectedLevelUnlocked) {
        if (level === 'BEGINNER') {
          alert('Jalur latihan ini masih terkunci! Anda harus menyelesaikan Ujian Pre-Test terlebih dahulu.');
        } else {
          alert('Tingkatan level ini masih terkunci! Selesaikan level sebelumnya terlebih dahulu.');
        }
        return;
      }
    }

    setLoading(true);
    try {
      // Step A: Initialize Session (POST to backend)
      const sessionRes = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          operationType,
          level,
        }),
      });
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok) throw new Error(sessionData.error || 'Failed to start session');
      setSessionId(sessionData.sessionId);

      // Step B: Get Questions (GET from backend with adaptive logic)
      const qRes = await fetch(`/api/practice?studentId=${studentId}&operationType=${operationType}&level=${level}&limit=${limit}`);
      const qData = await qRes.json();
      
      if (!qRes.ok) throw new Error(qData.error || 'Failed to fetch questions');
      setQuestions(qData.questions);
      
      // Initialize loop variables
      setNewLevelUnlockedName(null);
      setCurrentIdx(0);
      setSessionLogs([]);
      totalCorrectRef.current = 0;
      setExamRound(1);
      setExamScores([]);
      setTotalCorrectAllRounds(0);
      setShowRoundBreak(false);
      setCompletedRoundScore(null);
      setInSession(true);
      setIsCompleted(false);
      setFeedback(null);
      setUserAnswer('');
      
      // Start Question Clock
      startQuestionTimer();
    } catch (err: any) {
      alert(`Gagal memulai latihan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle question timeout
  const handleTimeout = (limitMs: number) => {
    if (feedback !== null) return; // already answered
    if (timerRef.current) clearInterval(timerRef.current);
    
    setFeedback('incorrect');
    setUserAnswer('');
    
    // Log to DB
    const question = questions[currentIdx];
    fetch('/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        sessionId,
        operationType: question.operationType,
        operand1: question.operand1,
        operand2: question.operand2,
        userAnswer: -999, // timeout/unanswered
        responseTime: limitMs,
      }),
    }).catch(err => console.error(err));

    setSessionLogs((prev) => [
      ...prev,
      {
        q: question,
        userVal: -999,
        correct: false,
        time: limitMs,
      },
    ]);

    // Auto-advance after 800ms
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 800);
  };

  // Starts the high precision timer using performance.now()
  const startQuestionTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerMs(0);
    startTimeRef.current = performance.now();

    // Determine active time limit from settings (converting seconds to ms)
    let activeTimeLimit = 0;
    if (settings) {
      const isMult = operationType === 'MULTIPLICATION';
      if (examType === 'DIAGNOSTIC') {
        activeTimeLimit = (isMult ? settings.preTestTimeMult : settings.preTestTimeDiv) * 1000;
      } else if (examType === 'POST_TEST') {
        activeTimeLimit = (isMult ? settings.postTestTimeMult : settings.postTestTimeDiv) * 1000;
      } else {
        activeTimeLimit = (isMult ? settings.practiceTimeMult : settings.practiceTimeDiv) * 1000;
      }
    } else {
      activeTimeLimit = examType ? 5000 : 0;
    }

    timerRef.current = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setTimerMs(elapsed);

      // Check if time limit is reached
      if (activeTimeLimit > 0 && elapsed >= activeTimeLimit) {
        handleTimeout(activeTimeLimit);
      }
    }, 50); // update every 50ms for smooth live updates
  };

  // Submit Answer
  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    if (feedback !== null || userAnswer.trim() === '') return;

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTimeRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const numericAnswer = parseInt(userAnswer, 10);
    const question = questions[currentIdx];
    
    // Server correctness verification simulation locally before API logging
    let correct = false;
    if (question.operationType === 'MULTIPLICATION') {
      correct = (question.operand1 * question.operand2) === numericAnswer;
    } else {
      correct = (question.operand1 / question.operand2) === numericAnswer;
    }

    if (correct) {
      totalCorrectRef.current += 1;
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    // Submit and Log to Database atomically
    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          sessionId,
          operationType: question.operationType,
          operand1: question.operand1,
          operand2: question.operand2,
          userAnswer: numericAnswer,
          responseTime: durationMs, // raw milliseconds
        }),
      });
      const data = await response.json();
      if (!response.ok) console.error('Failed to log answer to server:', data.error);

      // Append to local session log
      setSessionLogs((prev) => [
        ...prev,
        {
          q: question,
          userVal: numericAnswer,
          correct,
          time: durationMs,
        },
      ]);
    } catch (err) {
      console.error('Network error during log save:', err);
    }

    // Set auto-advance timeout (800ms)
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 800);
  };

  // Submit or go to next question (Enter key advances immediately)
  const handleSubmitOrNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback === null) {
      if (userAnswer.trim() !== '') {
        handleSubmitAnswer();
      }
    } else {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      handleNextQuestion();
    }
  };

  // Proceed to next question or show summary screen
  const handleNextQuestion = async () => {
    if (loading) return;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setFeedback(null);
    setUserAnswer('');

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      startQuestionTimer();
    } else {
      // Completed current round of questions
      if (examType === 'DIAGNOSTIC') {
        // Calculate score for this round
        const roundScore = Math.round((totalCorrectRef.current / questions.length) * 100);
        setExamScores((prev) => [...prev, roundScore]);
        setTotalCorrectAllRounds((prev) => prev + totalCorrectRef.current);

        // Submit round score to database
        try {
          await fetch('/api/exams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId,
              examType,
              operationType,
              score: roundScore,
            }),
          });
        } catch (err) {
          console.error('Error submitting exam round:', err);
        }

        // Show round completed break screen instead of fetching automatically
        setCompletedRoundScore(roundScore);
        setShowRoundBreak(true);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        // Fully completed!
        setInSession(false);
        setIsCompleted(true);
        if (timerRef.current) clearInterval(timerRef.current);

        // Refresh unlocked level progress
        fetchProgress(true);

        if (examType) {
          // Non-diagnostic exams (e.g. POST_TEST)
          const finalScore = Math.round((totalCorrectRef.current / questions.length) * 100);
          try {
            await fetch('/api/exams', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                examType,
                operationType,
                score: finalScore,
              }),
            });
          } catch (err) {
            console.error('Error submitting exam score:', err);
          }
        }
      }
    }
  };

  const handleProceedToNextRound = async () => {
    if (examRound >= 3) {
      // End the exam sessions and proceed to the final summary screen
      setInSession(false);
      setIsCompleted(true);
      setShowRoundBreak(false);
      setCompletedRoundScore(null);
      return;
    }

    setLoading(true);
    try {
      const qRes = await fetch(`/api/practice?studentId=${studentId}&operationType=${operationType}&level=${level}&limit=${limit}`);
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error || 'Failed to fetch questions');
      
      setQuestions(qData.questions);
      setCurrentIdx(0);
      totalCorrectRef.current = 0;
      setExamRound((prev) => prev + 1);
      setShowRoundBreak(false);
      setCompletedRoundScore(null);
      startQuestionTimer();
    } catch (err: any) {
      alert(`Gagal menyiapkan sesi berikutnya: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset to setup screen
  const handleReset = () => {
    setInSession(false);
    setIsCompleted(false);
    setQuestions([]);
    setCurrentIdx(0);
    setSessionLogs([]);
    setSessionId(null);
  };

  const handleRequestPostTest = async () => {
    if (!studentId) return;
    setRequestExamLoading(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action: 'REQUEST_EXAM' }),
      });
      const data = await res.json();
      if (res.ok) {
        setExamRequested(true);
        alert('Permohonan Ujian Akhir Master berhasil dikirim! Silakan hubungi Guru Anda untuk mengaktifkan ujian.');
      } else {
        alert(data.error || 'Gagal mengajukan ujian.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat mengajukan ujian.');
    } finally {
      setRequestExamLoading(false);
    }
  };

  // Helper to format live timer
  const formatLiveTimer = (ms: number): string => {
    const totalSeconds = ms / 1000;
    return `${totalSeconds.toFixed(1)}s`;
  };

  // Question render elements based on practice mode
  const renderQuestionString = (q: Question) => {
    const isMult = q.operationType === 'MULTIPLICATION';
    const symbol = isMult ? '×' : '÷';

    if (practiceMode === 'MISSING_NUMBER') {
      // Missing Number Mode: e.g. 6 x [] = 42
      if (isMult) {
        // We hide operand2 (multiplier)
        return (
          <div className="flex items-center justify-center space-x-3 text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
            <span>{q.operand1}</span>
            <span className="text-teal-500 font-bold">{symbol}</span>
            <span className="inline-block w-16 h-12 border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-lg text-center leading-10 text-teal-600 font-bold">?</span>
            <span>=</span>
            <span>{q.operand1 * q.operand2}</span>
          </div>
        );
      } else {
        // Division: C / [] = B. Hide divisor (operand2)
        // e.g. 42 / [] = 6
        return (
          <div className="flex items-center justify-center space-x-3 text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">
            <span>{q.operand1}</span>
            <span className="text-teal-500 font-bold">{symbol}</span>
            <span className="inline-block w-16 h-12 border-2 border-dashed border-teal-300 bg-teal-50/50 rounded-lg text-center leading-10 text-teal-600 font-bold">?</span>
            <span>=</span>
            <span>{q.operand1 / q.operand2}</span>
          </div>
        );
      }
    }

    // Default Flash Drill: A x B = ?
    return (
      <div className="text-5xl sm:text-6xl font-extrabold text-slate-800 tracking-tight">
        {q.operand1} <span className="text-teal-500 font-medium">{symbol}</span> {q.operand2}
      </div>
    );
  };

  return (
    <div className="relative z-0 min-h-screen bg-[#f8fafc] text-slate-800 pb-12">
      {/* Background elegant gradient elements */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] -z-10" />

      {/* Header Area */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <a 
              href={studentId ? `/dashboard?studentId=${studentId}` : '/'} 
              title="Kembali ke Dashboard"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">
                {examType ? 'Assessment Engine' : 'Practice Engine'}
              </span>
              <h1 className="text-xl font-bold text-white">
                {examType 
                  ? `Ujian Resmi: ${examType === 'DIAGNOSTIC' ? 'Pre-Test (Diagnostik)' : examType === 'MONITORING' ? `Ujian Monitoring (Stage ${monitoringStage + 1}/${settings?.monitoringStagesCount ?? 5})` : 'Ujian Akhir Master'}` 
                  : 'Latihan Numerasi Mandiri'
                }
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-12">
        {/* SETUP SCREEN */}
        {!inSession && !isCompleted && (
          <Card className="border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-indigo-500" />
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800 font-extrabold">
                {examType === 'MONITORING' ? `Mulai Ujian Monitoring (Stage ${monitoringStage + 1}/${settings?.monitoringStagesCount ?? 5})` : examType ? 'Mulai Ujian Resmi' : 'Pengaturan Latihan'}
              </CardTitle>
              <CardDescription>
                {examType 
                  ? 'Kerjakan soal ujian dengan teliti. Nilai akhir Anda akan disimpan secara permanen di raport database.'
                  : 'Pilih tipe belajar dan jangkauan level angka dasar'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Operation Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Jalur Belajar</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPathLockedForPostTest('MULTIPLICATION')) {
                        alert('Jalur Perkalian belum siap untuk Ujian Akhir Master. Anda harus menyelesaikan tingkatan latihan Perkalian terlebih dahulu.');
                        return;
                      }
                      setOperationType('MULTIPLICATION');
                    }}
                    className={`p-4 rounded-xl border text-center font-bold transition-all relative ${
                      operationType === 'MULTIPLICATION'
                        ? 'border-teal-500 bg-teal-500/5 text-teal-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    } ${isPathLockedForPostTest('MULTIPLICATION') ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Perkalian (1-10)</span>
                      {isPathLockedForPostTest('MULTIPLICATION') && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPathLockedForPostTest('DIVISION')) {
                        alert('Jalur Pembagian belum siap untuk Ujian Akhir Master. Anda harus menyelesaikan tingkatan latihan Pembagian terlebih dahulu.');
                        return;
                      }
                      setOperationType('DIVISION');
                    }}
                    className={`p-4 rounded-xl border text-center font-bold transition-all relative ${
                      operationType === 'DIVISION'
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    } ${isPathLockedForPostTest('DIVISION') ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center justify-center space-x-1.5">
                      <span>Pembagian (1-10)</span>
                      {isPathLockedForPostTest('DIVISION') && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </button>
                </div>
              </div>

              {examType ? (
                /* Information banner for active exam mode rules */
                <div className="bg-amber-500/5 border border-amber-500/20 text-amber-700 p-4.5 rounded-xl text-xs leading-relaxed space-y-1 shadow-inner">
                  <p className="font-extrabold text-amber-800 flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1 text-amber-600 animate-pulse" />
                    ATURAN UJIAN DITERAPKAN:
                  </p>
                  <p>1. Parameter tingkatan level dikunci pada <strong>EXPERT (Tabel 1-10)</strong> secara menyeluruh.</p>
                  <p>2. Jumlah pertanyaan dikunci sebanyak <strong>{limit} butir soal</strong> acak.</p>
                  <p>3. Format pengerjaan dikunci pada mode <strong>Flash Drill (A &times; B)</strong>.</p>
                  {examType === 'MONITORING' && (
                    <p className="text-teal-700 font-bold mt-2">✓ Ujian Monitoring dikerjakan secara MANDIRI dari rumah/sekolah tanpa verifikasi guru.</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2 italic">Pastikan kestabilan koneksi internet sebelum memulai ujian.</p>
                </div>
              ) : (
                <>
                  {/* Level Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Tingkatan Level (Kumulatif)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'BEGINNER', label: 'Beginner', desc: 'Tabel 1-3' },
                        { key: 'INTERMEDIATE', label: 'Intermediate', desc: 'Tabel 4-6' },
                        { key: 'ADVANCED', label: 'Advanced', desc: 'Tabel 7-8' },
                        { key: 'EXPERT', label: 'Expert', desc: 'Tabel 9-10' },
                      ].map((lvl) => {
                        const status = getLevelStatus(lvl.key);
                        const isUnlocked = status?.unlocked ?? (lvl.key === 'BEGINNER');
                        const prereqText = getPrerequisiteText(lvl.key);

                        return (
                          <button
                            key={lvl.key}
                            onClick={() => {
                              if (isUnlocked) {
                                setLevel(lvl.key as any);
                              }
                            }}
                            disabled={!isUnlocked}
                            className={`p-2.5 rounded-lg border text-center transition-all relative ${
                              !isUnlocked
                                ? 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-70'
                                : level === lvl.key
                                ? 'border-teal-500 bg-teal-50 text-teal-700 font-bold'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-xs flex items-center justify-center space-x-1">
                              {!isUnlocked && <Lock className="w-3 h-3 text-slate-400" />}
                              <span>{lvl.label}</span>
                            </div>
                            <div className="text-[9px] mt-0.5 font-medium transition-all">
                              {isUnlocked ? (
                                <span className="text-slate-400">{lvl.desc}</span>
                              ) : (
                                <span className="text-amber-500 font-bold">{prereqText || lvl.desc}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {(() => {
                const pathKey = operationType === 'MULTIPLICATION' ? 'multiplication' : 'division';
                const isSelectedLevelUnlocked = levelProgress 
                  ? (levelProgress[pathKey]?.[level]?.unlocked ?? false)
                  : false;
                let isLocked = false;
                if (examType === 'POST_TEST') {
                  isLocked = !(levelProgress?.[pathKey]?.EXPERT?.unlocked ?? false);
                } else if (examType === 'MONITORING') {
                  const maxStages = settings?.monitoringStagesCount ?? 5;
                  const cooldownDays = settings?.monitoringCooldownDays ?? 7;
                  const onCooldown = lastExamDate 
                    ? (new Date().getTime() - new Date(lastExamDate).getTime()) < cooldownDays * 24 * 60 * 60 * 1000
                    : false;
                  isLocked = monitoringStage >= maxStages || onCooldown;
                } else if (!examType) {
                  isLocked = !isSelectedLevelUnlocked;
                }

                return (
                  <button
                    onClick={handleStartSession}
                    disabled={loading || isLocked}
                    className={`w-full flex items-center justify-center py-3 font-extrabold rounded-xl transition-all shadow-lg ${
                      isLocked
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:shadow-teal-500/25 hover:scale-[1.01]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                        {examType ? 'Menyiapkan Lembar Ujian...' : 'Menyiapkan Latihan...'}
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-5 h-5 mr-2 text-slate-400" />
                        {examType === 'POST_TEST'
                          ? 'Selesaikan Semua Level Terlebih Dahulu'
                          : examType === 'MONITORING'
                          ? (monitoringStage >= (settings?.monitoringStagesCount ?? 5) ? 'Seluruh Tahap Monitoring Selesai' : 'Ujian Monitoring Terkunci (Cooldown)')
                          : (levelProgress?.[pathKey]?.[level]?.needsPreTest 
                            ? 'Selesaikan Pre-Test Terlebih Dahulu' 
                            : 'Level Masih Terkunci')
                        }
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        {examType ? 'Mulai Ujian Sekarang' : 'Mulai Belajar Sekarang'}
                      </>
                    )}
                  </button>
                );
              })()}
            </CardFooter>
          </Card>
        )}

        {inSession && questions.length > 0 && (
          <Card className="border border-slate-200 shadow-xl overflow-hidden relative">
            
            {showRoundBreak ? (
              <>
                <div className="h-2 bg-gradient-to-r from-amber-500 to-teal-500" />
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600 animate-pulse">
                    <Award className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl text-slate-800 font-extrabold">
                    Sesi {examRound}/3 Selesai
                  </CardTitle>
                  <CardDescription>
                    Hasil pengerjaan Ujian Diagnostik sesi ini
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6 text-center space-y-6">
                  {/* Accuracy Badge */}
                  <div className="inline-block bg-slate-50 border border-slate-200/60 rounded-2xl px-8 py-4 shadow-inner">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akurasi Sesi</span>
                    <span className={`text-4xl font-black mt-1 block ${
                      (completedRoundScore ?? 0) >= 90 
                        ? 'text-emerald-600' 
                        : (completedRoundScore ?? 0) >= 70 
                        ? 'text-amber-500' 
                        : 'text-rose-600'
                    }`}>
                      {completedRoundScore}%
                    </span>
                  </div>

                  {/* Motivational Text */}
                  <div className="max-w-md mx-auto">
                    <p className="text-sm font-extrabold text-slate-700">
                      {(completedRoundScore ?? 0) >= 90 
                        ? '🎉 Luar biasa! Pertahankan fokus Anda.' 
                        : (completedRoundScore ?? 0) >= 70 
                        ? '👍 Bagus! Terus tingkatkan di sesi berikutnya.' 
                        : '💪 Tetap semangat dan lebih teliti di sesi berikutnya.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {examRound < 3 
                        ? 'Silakan istirahat sejenak (ambil napas dalam atau minum air) sebelum melanjutkan ke sesi berikutnya agar konsentrasi Anda tetap prima.' 
                        : 'Semua sesi Ujian Diagnostik telah selesai. Silakan lanjut untuk melihat evaluasi hasil akhir Anda.'}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                  <button
                    onClick={handleProceedToNextRound}
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 disabled:opacity-50 hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                        {examRound < 3 ? `Menyiapkan Sesi ${examRound + 1}/3...` : 'Memuat Hasil...'}
                      </>
                    ) : (
                      <>
                        <span>{examRound < 3 ? `Lanjut ke Sesi ${examRound + 1}/3` : 'Lihat Hasil Akhir Ujian'}</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </CardFooter>
              </>
            ) : (
              <>
                {/* Real-time Timer and Progress Bar */}
                <div className="w-full bg-slate-100 h-1">
                  <div 
                    className="bg-teal-500 h-1 transition-all duration-300"
                    style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
                  />
                </div>

                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    {examType === 'DIAGNOSTIC' ? `Sesi ${examRound}/3 • ` : ''}Soal {currentIdx + 1} dari {questions.length}
                  </span>
                  
                  {/* Precision Timer Indicator */}
                  <div className="flex items-center space-x-1.5 bg-slate-200/50 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-inner">
                    <Timer className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                    <span>{formatLiveTimer(timerMs)}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[220px]">
                  
                  {/* Question display card */}
                  <div className="mb-8 w-full text-center">
                    {renderQuestionString(questions[currentIdx])}
                  </div>

                  {/* Form Input for userAnswer */}
                  <form onSubmit={handleSubmitOrNext} className="w-full max-w-[280px]">
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="number"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={userAnswer}
                        readOnly={feedback !== null || loading}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Ketik jawaban..."
                        className={`w-full text-center px-4 py-3 text-2xl font-bold rounded-xl border-2 bg-white text-slate-800 transition-all focus:outline-none focus:ring-4 ${
                          feedback === 'correct'
                            ? 'border-emerald-500 focus:ring-emerald-500/10 focus:border-emerald-500'
                            : feedback === 'incorrect'
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500 animate-shake'
                            : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10'
                        }`}
                      />
                      
                      {/* Visual feedback icons inside input */}
                      {feedback === 'correct' && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute right-3.5 top-3.5" />
                      )}
                      {feedback === 'incorrect' && (
                        <XCircle className="w-6 h-6 text-rose-500 absolute right-3.5 top-3.5" />
                      )}
                    </div>

                    {/* Feedback Panel */}
                    {feedback && (
                      <div className="mt-4 text-center animate-fade-in">
                        {feedback === 'correct' ? (
                          <p className="text-sm font-bold text-emerald-600">Hebat! Jawaban Anda Benar.</p>
                        ) : (
                          <p className="text-sm font-bold text-rose-600">
                            Salah. Jawaban yang benar: {' '}
                            <span className="underline font-extrabold text-base">
                              {questions[currentIdx].expectedAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions Button */}
                    <div className="mt-6">
                      {feedback === null ? (
                        <button
                          type="submit"
                          disabled={userAnswer.trim() === '' || loading}
                          className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-md hover:shadow-teal-500/20 disabled:opacity-50 transition-all text-sm uppercase tracking-wider"
                        >
                          Kirim Jawaban
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          disabled={loading}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center disabled:opacity-50"
                        >
                          <span>Lanjut</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* SUMMARY SCREEN */}
        {isCompleted && (
          <Card className="border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-2 bg-emerald-500" />
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <CardTitle className="text-2xl text-slate-800 font-extrabold">
                {examType ? 'Ujian Resmi Selesai!' : 'Sesi Selesai!'}
              </CardTitle>
              <CardDescription>
                {examType ? 'Hasil evaluasi pengerjaan lembar ujian Anda' : 'Hasil evaluasi pengerjaan latihan mandiri Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Newly Unlocked Level Alert */}
              {newLevelUnlockedName && (
                <div className="p-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl text-white shadow-xl space-y-2 border border-emerald-400 relative overflow-hidden animate-pulse">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 text-white/10 text-8xl font-black select-none pointer-events-none">
                    ⭐
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🏆</span>
                    <span className="font-black text-sm uppercase tracking-wider">Level Baru Terbuka!</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-emerald-50">
                    Selamat! Anda telah berhasil membuka tingkatan level berikutnya:{' '}
                    <strong className="text-yellow-300 underline font-black">
                      {newLevelUnlockedName === 'INTERMEDIATE' ? 'Intermediate (Tabel 4-6)' : 
                       newLevelUnlockedName === 'ADVANCED' ? 'Advanced (Tabel 7-8)' : 
                       newLevelUnlockedName === 'EXPERT' ? 'Expert (Tabel 9-10)' : newLevelUnlockedName}
                    </strong>
                    . Terus tingkatkan dan asah kemampuan berhitung Anda!
                  </p>
                </div>
              )}

              {/* Expert Passed & Post-Test Prompt */}
              {!examType && level === 'EXPERT' && levelProgress?.[pathKey]?.EXPERT?.progress?.passed && (
                <div className="p-5 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl space-y-3.5 border border-indigo-500/30 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 text-indigo-500/10 text-8xl font-black select-none pointer-events-none">
                    📝
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🎓</span>
                      <span className="font-extrabold text-sm uppercase tracking-wider text-indigo-400">Selamat! Lulus Tingkat Expert</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      Anda telah menyelesaikan latihan tingkat **Expert** (Tabel 9-10) dengan rata-rata nilai kelulusan. Langkah berikutnya adalah mengambil Ujian Akhir Master resmi untuk diverifikasi oleh Guru.
                    </p>
                  </div>
                  
                  {examUnlocked ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
                      <span>✓ Ujian Akhir Master Telah Aktif! Silakan hubungi Guru Anda untuk mulai mengerjakan.</span>
                    </div>
                  ) : examRequested ? (
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
                      <span>⌛ Permohonan Ujian Telah Dikirim. Menunggu Guru Anda mengaktifkan ujian.</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={requestExamLoading}
                      onClick={handleRequestPostTest}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center space-x-2 cursor-pointer border-0"
                    >
                      {requestExamLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Memproses Pengajuan...
                        </>
                      ) : (
                        <span>Ajukan Ujian Akhir Master ke Guru</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Final Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <Target className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akurasi</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">
                    {getFinalScore()}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {examType === 'DIAGNOSTIC'
                      ? `${totalCorrectAllRounds} dari ${questions.length * 3} Benar`
                      : `${totalCorrectRef.current} dari ${questions.length} Benar`
                    }
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                  <Zap className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kec. Respons</span>
                  <span className="text-2xl font-black text-indigo-700 mt-1 block">
                    {sessionLogs.length > 0 
                      ? `${(sessionLogs.reduce((sum, item) => sum + item.time, 0) / sessionLogs.length / 1000).toFixed(1)}s`
                      : '-'
                    }
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Rerata per Soal</span>
                </div>
              </div>

              {/* Round-by-round score breakdown for Diagnostic Pre-Test */}
              {examType === 'DIAGNOSTIC' && examScores.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-inner">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hasil Per Sesi (Diagnostik)</h4>
                  <div className="space-y-2">
                    {examScores.map((score, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-semibold">Ujian Sesi {idx + 1}:</span>
                        <span className={`font-black ${score >= 90 ? 'text-emerald-600' : 'text-slate-600'}`}>{score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Congratulatory or Remedial Alert Box for Exams */}
              {examType && (
                <div className={`p-4 rounded-xl border text-center ${
                  getFinalScore() >= 90
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-250 text-rose-800'
                }`}>
                  {getFinalScore() >= 90 ? (
                    <>
                      <p className="font-extrabold text-sm sm:text-base">🎉 Selamat! Anda sudah menguasai {operationType === 'MULTIPLICATION' ? 'perkalian' : 'pembagian'} dasar.</p>
                      <p className="text-xs text-emerald-650 mt-1">Nilai Anda berhasil mencapai batas minimal kelulusan (90%).</p>
                    </>
                  ) : (
                    <>
                      <p className="font-extrabold text-sm sm:text-base">⚠️ Anda belum mencapai batas kelulusan 90%.</p>
                      <p className="text-xs text-rose-655 mt-1">Mari kembali berlatih mandiri untuk menguatkan otomatisasi hitung Anda.</p>
                    </>
                  )}
                </div>
              )}

              {/* Session breakdown list */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Rincian Pertanyaan</h4>
                <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                  {sessionLogs.map((log, index) => (
                    <div key={index} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-2 text-xs font-semibold">
                        <span className="text-slate-400">Soal {index + 1}:</span>
                        <span>
                          {log.q.operand1} {log.q.operationType === 'MULTIPLICATION' ? '×' : '÷'} {log.q.operand2} = {log.userVal === -999 ? 'Waktu Habis' : log.userVal}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-[10px] text-slate-400 font-semibold">{formatResponseTime(log.time)}</span>
                        {log.correct ? (
                          <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Benar</span>
                        ) : (
                          <span className="text-rose-600 text-xs font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {log.userVal === -999 ? 'Habis Waktu' : `Salah (${log.q.expectedAnswer})`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              {examType ? (
                <>
                  {getFinalScore() >= 90 ? (
                    <a
                      href={`/dashboard?studentId=${studentId}`}
                      className="w-full text-center py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                      Kembali ke Dashboard
                    </a>
                  ) : (
                    <a
                      href={`/practice?studentId=${studentId}`}
                      className="w-full text-center py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-teal-500/20"
                    >
                      Mulai Latihan Mandiri (Remedial)
                    </a>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartSession}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-teal-500/20"
                  >
                    Mulai Latihan Lagi
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Ganti Pengaturan Latihan
                  </button>
                </>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PracticeInterface() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-600">Memuat Sesi Latihan...</p>
      </div>
    }>
      <PracticeInterfaceContent />
    </Suspense>
  );
}

