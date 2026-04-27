import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  areActiveFollowupsComplete,
  buildChoiceAnswer,
  collectActiveFollowups,
  getSelectedOptions,
  optionRequiresCustomInput,
  serializeNestedAnswers,
  shouldShowChoiceDetailInput,
  type AnswerOption,
  type FollowupDraft,
  type FollowupQuestion,
} from '@/lib/interviewAnswer';
import {
  INTERVIEW_SESSION_STORAGE_KEY,
  clearInterviewIdentity,
  getStoredInterviewUserId,
  persistInterviewIdentity,
} from '@/lib/interviewStorage';

const SPECIAL_ACTION_IDS = new Set(['BASE_COMPLETED', 'COMPLETED_BY_PREVIEW']);
const MAX_SKIP_COUNT = 5;

type DialogType = 'info' | 'warning' | 'error';
type AnswerMode = 'single' | 'multi' | 'text' | 'hybrid';

interface InterviewQuestion {
  questionId: string;
  content: string;
  hint?: string;
  options?: AnswerOption[];
  source?: 'local' | 'rewritten' | 'generated';
  mode?: 'dig_deeper' | 'extend_topic' | 'switch_topic' | 'generated';
  answerMode: AnswerMode;
  minChoices?: number;
  maxChoices?: number;
  allowTextDetails?: boolean;
  responseCardinality?: string;
  suggestedAnswerCount?: number;
  stageTag: string;
  shouldSuggestPreview?: boolean;
  isOptional?: boolean;
  isBaseCompleted?: boolean;
  baseSlotsUsed?: number;
  baseSlotsTotal?: number;
  skippedCount?: number;
}

interface DialogState {
  isOpen: boolean;
  type: DialogType;
  message: string;
  title?: string;
  onConfirm?: () => void;
}

function createEmptyFollowupDraft(): FollowupDraft {
  return {
    selectedOptions: [],
    textAnswer: '',
    customAnswer: '',
  };
}

function isSpecialActionQuestion(question: InterviewQuestion | null): boolean {
  if (!question) {
    return false;
  }

  return SPECIAL_ACTION_IDS.has(question.questionId) || question.isBaseCompleted === true;
}

function getMinimumChoiceCount(question: InterviewQuestion): number {
  if (typeof question.minChoices === 'number') {
    return question.minChoices;
  }

  if (question.answerMode === 'single' || question.answerMode === 'multi' || question.answerMode === 'hybrid') {
    return 1;
  }

  return 0;
}

export default function InterviewPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNameCapture, setShowNameCapture] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [choiceDetailText, setChoiceDetailText] = useState('');
  const [followupDrafts, setFollowupDrafts] = useState<Record<string, FollowupDraft>>({});

  const [questionHistory, setQuestionHistory] = useState<InterviewQuestion[]>([]);
  const [answerHistory, setAnswerHistory] = useState<Array<{
    answerId: string;
    selectedOptions: string[];
    textAnswer: string;
    choiceDetailText: string;
    followupDrafts: Record<string, FollowupDraft>;
  }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const activeFollowups = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return collectActiveFollowups(currentQuestion, selectedOptions);
  }, [currentQuestion, selectedOptions]);

  const selectedMainOptions = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return getSelectedOptions(currentQuestion, selectedOptions);
  }, [currentQuestion, selectedOptions]);

  const mainNeedsCustomInput = useMemo(
    () => selectedMainOptions.some(optionRequiresCustomInput),
    [selectedMainOptions]
  );

  const showMainDetailInput = useMemo(() => {
    if (!currentQuestion || currentQuestion.answerMode === 'text') {
      return false;
    }

    if (currentQuestion.answerMode === 'hybrid') {
      return selectedOptions.length > 0;
    }

    return shouldShowChoiceDetailInput(currentQuestion, selectedOptions);
  }, [currentQuestion, selectedOptions]);

  const followupsComplete = useMemo(() => {
    if (!currentQuestion || currentQuestion.answerMode === 'text') {
      return true;
    }

    return areActiveFollowupsComplete(currentQuestion, selectedOptions, followupDrafts);
  }, [currentQuestion, followupDrafts, selectedOptions]);

  const remainingSkips =
    typeof currentQuestion?.skippedCount === 'number'
      ? Math.max(0, MAX_SKIP_COUNT - currentQuestion.skippedCount)
      : null;

  const canSkipCurrentQuestion = Boolean(
    currentQuestion &&
      !isSpecialActionQuestion(currentQuestion) &&
      (currentQuestion.isOptional || remainingSkips === null || remainingSkips > 0)
  );

  const canSubmitCurrentQuestion = useMemo(() => {
    if (!currentQuestion || isSpecialActionQuestion(currentQuestion)) {
      return false;
    }

    if (currentQuestion.answerMode === 'text') {
      return textAnswer.trim().length > 0;
    }

    const minimumChoiceCount = getMinimumChoiceCount(currentQuestion);
    if (selectedOptions.length < minimumChoiceCount) {
      return false;
    }

    if (typeof currentQuestion.maxChoices === 'number' && selectedOptions.length > currentQuestion.maxChoices) {
      return false;
    }

    if (mainNeedsCustomInput && !choiceDetailText.trim()) {
      return false;
    }

    return followupsComplete;
  }, [choiceDetailText, currentQuestion, followupsComplete, mainNeedsCustomInput, selectedOptions, textAnswer]);

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      try {
        const storedSessionId = localStorage.getItem(INTERVIEW_SESSION_STORAGE_KEY);
        const storedUserId = getStoredInterviewUserId(localStorage);

        console.log('[INIT] 存储的会话信息:', { storedSessionId, storedUserId });

        if (storedSessionId && storedUserId) {
          const sessionStatus = await validateExistingSession(storedSessionId, storedUserId);

          console.log('[INIT] 会话状态:', sessionStatus);

          if (!isActive) {
            console.log('[INIT] 组件已卸载，中止初始化');
            return;
          }

          if (sessionStatus === 'active') {
            console.log('[INIT] 会话有效，准备加载题目');
            persistInterviewIdentity(localStorage, {
              sessionId: storedSessionId,
              userId: storedUserId,
            });
            setUserId(storedUserId);
            setSessionId(storedSessionId);
            console.log('[INIT] 调用 loadCurrentQuestion');
            await loadCurrentQuestion(storedSessionId, storedUserId);
            console.log('[INIT] loadCurrentQuestion 完成');
            return;
          }

          if (sessionStatus === 'completed') {
            persistInterviewIdentity(localStorage, {
              sessionId: storedSessionId,
              userId: storedUserId,
            });
            await router.replace(`/preview?sessionId=${storedSessionId}`);
            return;
          }

          // 会话无效，清理并重新开始
          console.log('[INIT] 会话无效，清理 localStorage');
          clearInterviewIdentity(localStorage);
        }

        if (isActive) {
          console.log('[INIT] 显示名字捕获界面');
          setShowNameCapture(true);
        }
      } catch (error) {
        console.error('[INIT] Error:', error);
        if (isActive) {
          openDialog('初始化失败，请刷新页面重试。', 'error');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      console.log('[INIT] Cleanup: 设置 isActive = false');
      isActive = false;
    };
  }, [router]);

  async function validateExistingSession(currentSessionId: string, currentUserId: string) {
    try {
      console.log('[VALIDATE] 验证会话:', { currentSessionId, currentUserId });

      const response = await fetch('/api/questions/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          userId: currentUserId,
        }),
      });

      console.log('[VALIDATE] 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VALIDATE] API 错误:', errorText);
        return 'invalid' as const;
      }

      const result = await response.json();
      console.log('[VALIDATE] 响应数据:', result);

      if (result.success) {
        // 防守：检查返回数据的完整性
        const questionData = result.data;
        if (!questionData || typeof questionData !== 'object') {
          console.warn('[VALIDATE] 返回数据格式异常');
          return 'invalid' as const;
        }
        if (!questionData.answerMode || !questionData.stageTag) {
          console.warn('[VALIDATE] 返回数据缺少必需字段，但仍认为会话有效');
        }
        return 'active' as const;
      }

      if (response.status === 400 && result.error === '访谈已完成') {
        return 'completed' as const;
      }

      return 'invalid' as const;
    } catch (error) {
      console.error('[VALIDATE] 异常:', error);
      return 'invalid' as const;
    }
  }

  function resetDraftState() {
    setSelectedOptions([]);
    setTextAnswer('');
    setChoiceDetailText('');
    setFollowupDrafts({});
  }

  async function loadCurrentQuestion(currentSessionId: string, currentUserId: string) {
    try {
      console.log('[LOAD] 加载题目:', { currentSessionId, currentUserId });

      const response = await fetch('/api/questions/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          userId: currentUserId,
        }),
      });

      console.log('[LOAD] 响应状态:', response.status);

      if (response.status === 400) {
        const result = await response.json();
        console.log('[LOAD] 400 响应:', result);

        if (result.error === '访谈已完成') {
          persistInterviewIdentity(localStorage, {
            sessionId: currentSessionId,
            userId: currentUserId,
          });
          await router.replace(`/preview?sessionId=${currentSessionId}`);
          return;
        }

        throw new Error(result.error || '获取题目失败');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[LOAD] API 错误:', errorText);
        throw new Error('获取题目失败');
      }

      const result = await response.json();
      console.log('[LOAD] 成功响应:', result);

      if (!result.success) {
        throw new Error(result.error || '获取题目失败');
      }

      // 防守：确保必需字段存在
      const questionData = result.data;
      if (!questionData.answerMode) {
        console.warn('[LOAD] 缺少 answerMode，使用默认值 text');
        questionData.answerMode = 'text';
      }
      if (!questionData.stageTag) {
        console.warn('[LOAD] 缺少 stageTag，使用默认值 一生回顾');
        questionData.stageTag = '一生回顾';
      }

      setCurrentQuestion(questionData);
      resetDraftState();
    } catch (error) {
      console.error('[LOAD] Error:', error);
      setCurrentQuestion(null);
      openDialog(error instanceof Error ? error.message : '加载题目失败', 'error');
    }
  }

  function openDialog(message: string, type: DialogType = 'info', onConfirm?: () => void, title?: string) {
    setDialog({
      isOpen: true,
      type,
      message,
      onConfirm,
      title,
    });
  }

  async function handleCreateInterview(displayName: string) {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      openDialog('请先输入您的名字，我们再开始访谈。', 'warning');
      return;
    }

    setCreatingSession(true);

    try {
      const createUserResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          real_name: trimmedName,
        }),
      });

      const createdUser = await createUserResponse.json();
      if (!createUserResponse.ok) {
        throw new Error(createdUser.error || '创建用户失败');
      }

      const currentUserId = createdUser.id;

      const startInterviewResponse = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
        }),
      });

      const startResult = await startInterviewResponse.json();
      if (!startInterviewResponse.ok || !startResult.success) {
        throw new Error(startResult.error || '启动访谈失败');
      }

      const currentSessionId = startResult.data.sessionId as string;
      persistInterviewIdentity(localStorage, {
        sessionId: currentSessionId,
        userId: currentUserId,
      });

      setUserId(currentUserId);
      setSessionId(currentSessionId);
      setShowNameCapture(false);
      await loadCurrentQuestion(currentSessionId, currentUserId);
    } catch (error) {
      console.error('[CREATE] Error:', error);
      openDialog(error instanceof Error ? error.message : '创建访谈失败', 'error');
    } finally {
      setCreatingSession(false);
    }
  }

  async function handleGeneratePreview() {
    if (!sessionId || !userId) {
      openDialog('会话信息丢失，请返回首页后重试。', 'error');
      return;
    }

    setGeneratingPreview(true);

    try {
      persistInterviewIdentity(localStorage, {
        sessionId,
        userId,
      });
      await router.push(`/preview?sessionId=${sessionId}`);
    } finally {
      setGeneratingPreview(false);
    }
  }

  function handleMainOptionToggle(optionValue: string) {
    if (!currentQuestion || currentQuestion.answerMode === 'text') {
      return;
    }

    if (currentQuestion.answerMode === 'single') {
      setSelectedOptions([optionValue]);
      return;
    }

    setSelectedOptions((previous) => {
      if (previous.includes(optionValue)) {
        return previous.filter((value) => value !== optionValue);
      }

      if (typeof currentQuestion.maxChoices === 'number' && previous.length >= currentQuestion.maxChoices) {
        openDialog(`这一题最多选择 ${currentQuestion.maxChoices} 项。`, 'warning');
        return previous;
      }

      return [...previous, optionValue];
    });
  }

  function updateFollowupDraft(
    followupQuestionId: string,
    updater: (draft: FollowupDraft) => FollowupDraft
  ) {
    setFollowupDrafts((previous) => {
      const currentDraft = previous[followupQuestionId] ?? createEmptyFollowupDraft();

      return {
        ...previous,
        [followupQuestionId]: updater(currentDraft),
      };
    });
  }

  function handleFollowupOptionToggle(followupQuestion: FollowupQuestion, optionValue: string) {
    updateFollowupDraft(followupQuestion.id, (draft) => {
      let nextSelectedOptions: string[];

      if (followupQuestion.answerMode === 'single') {
        nextSelectedOptions = [optionValue];
      } else {
        nextSelectedOptions = draft.selectedOptions.includes(optionValue)
          ? draft.selectedOptions.filter((value) => value !== optionValue)
          : [...draft.selectedOptions, optionValue];
      }

      const stillNeedsCustomInput = getSelectedOptions(followupQuestion, nextSelectedOptions).some(
        optionRequiresCustomInput
      );

      return {
        ...draft,
        selectedOptions: nextSelectedOptions,
        customAnswer: stillNeedsCustomInput ? draft.customAnswer : '',
      };
    });
  }

  function handleFollowupTextChange(followupQuestionId: string, field: 'textAnswer' | 'customAnswer', value: string) {
    updateFollowupDraft(followupQuestionId, (draft) => ({
      ...draft,
      [field]: value,
    }));
  }

  async function handleSubmitAnswer() {
    if (!sessionId || !userId || !currentQuestion || !canSubmitCurrentQuestion || isSpecialActionQuestion(currentQuestion)) {
      return;
    }

    setSubmitting(true);

    try {
      let answer = '';
      let customAnswer: string | null = null;

      if (currentQuestion.answerMode === 'text') {
        answer = textAnswer.trim();
      } else {
        const effectiveDetailText = showMainDetailInput ? choiceDetailText.trim() : '';
        answer = buildChoiceAnswer(currentQuestion, selectedOptions, effectiveDetailText);
        customAnswer = effectiveDetailText || null;
      }

      const nestedAnswers = serializeNestedAnswers(currentQuestion, selectedOptions, followupDrafts);

      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          questionId: currentQuestion.questionId,
          questionContent: currentQuestion.content,
          answer,
          selectedOption: selectedOptions.length > 0 ? selectedOptions.join('|') : null,
          customAnswer,
          sourceQuestionMode: currentQuestion.mode || 'switch_topic',
          nestedAnswers: Object.keys(nestedAnswers).length > 0 ? nestedAnswers : null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '保存失败');
      }

      const answerId = result.data?.id;
      if (answerId) {
        setQuestionHistory([...questionHistory, currentQuestion]);
        setAnswerHistory([...answerHistory, {
          answerId,
          selectedOptions: [...selectedOptions],
          textAnswer,
          choiceDetailText,
          followupDrafts: { ...followupDrafts }
        }]);
      }

      await loadCurrentQuestion(sessionId, userId);
    } catch (error) {
      console.error('[SUBMIT] Error:', error);
      openDialog(error instanceof Error ? error.message : '保存失败', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkipQuestion() {
    if (!sessionId || !userId || !currentQuestion || isSpecialActionQuestion(currentQuestion) || !canSkipCurrentQuestion) {
      return;
    }

    setSkipping(true);

    try {
      const response = await fetch('/api/interview/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          questionId: currentQuestion.questionId,
          isOptional: currentQuestion.isOptional || false,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '跳过失败');
      }

      setCurrentQuestion(result.data);
      resetDraftState();
    } catch (error) {
      console.error('[SKIP] Error:', error);
      openDialog(error instanceof Error ? error.message : '跳过失败', 'error');
    } finally {
      setSkipping(false);
    }
  }

  async function handleGoBack() {
    if (answerHistory.length === 0) return;

    const lastAnswer = answerHistory[answerHistory.length - 1];

    try {
      const response = await fetch(`/api/interview/answer/${lastAnswer.answerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      setAnswerHistory(prev => prev.slice(0, -1));
      setQuestionHistory(prev => prev.slice(0, -1));

      const previousQuestion = questionHistory[questionHistory.length - 2];
      const previousDraft = answerHistory[answerHistory.length - 2];

      if (previousQuestion) {
        setCurrentQuestion(previousQuestion);
        setSelectedOptions(previousDraft?.selectedOptions || []);
        setTextAnswer(previousDraft?.textAnswer || '');
        setChoiceDetailText(previousDraft?.choiceDetailText || '');
        setFollowupDrafts(previousDraft?.followupDrafts || {});
      }
    } catch (error) {
      console.error('[GO_BACK] Error:', error);
      openDialog(error instanceof Error ? error.message : '返回失败', 'error');
    }
  }

  function renderFollowupQuestion(parentOption: AnswerOption, followupQuestion: FollowupQuestion) {
    const draft = followupDrafts[followupQuestion.id] ?? createEmptyFollowupDraft();
    const selectedFollowupOptions = getSelectedOptions(followupQuestion, draft.selectedOptions);
    const followupNeedsCustomInput = selectedFollowupOptions.some(optionRequiresCustomInput);

    return (
      <div key={followupQuestion.id} className="border border-ink-wash rounded-sm bg-paper-deep p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-base text-ink-medium">关于“{parentOption.label}”</p>
          <h3 className="text-xl text-ink-heavy leading-relaxed">{followupQuestion.content}</h3>
        </div>

        {followupQuestion.answerMode === 'text' ? (
          <textarea
            value={draft.textAnswer}
            onChange={(event) => handleFollowupTextChange(followupQuestion.id, 'textAnswer', event.target.value)}
            placeholder="您可以慢慢写，我会继续接着听。"
            maxLength={1000}
            className="w-full min-h-[160px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none px-2 py-4"
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              {(followupQuestion.options || []).map((option) => {
                const isSelected = draft.selectedOptions.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFollowupOptionToggle(followupQuestion, option.value)}
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? 'w-full min-h-[56px] px-4 py-4 border-2 border-ink-heavy bg-paper-base text-ink-heavy text-lg text-left rounded-sm'
                        : 'w-full min-h-[56px] px-4 py-4 border border-ink-wash bg-paper-base text-ink-medium text-lg text-left rounded-sm active:bg-paper-deep'
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {followupNeedsCustomInput && (
              <textarea
                value={draft.customAnswer}
                onChange={(event) =>
                  handleFollowupTextChange(followupQuestion.id, 'customAnswer', event.target.value)
                }
                placeholder="把这一项具体说给我听听。"
                maxLength={500}
                className="w-full min-h-[140px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none px-2 py-4"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-paper-base flex items-center justify-center">
        <p className="text-lg text-ink-medium">正在准备访谈...</p>
      </div>
    );
  }

  if (showNameCapture) {
    return (
      <div className="min-h-dvh bg-paper-base flex flex-col">
        <header className="px-6 py-4 border-b border-ink-wash">
          <h1 className="text-xl text-ink-heavy">时光回响 · 访谈</h1>
        </header>

        <main className="flex-1 px-6 py-8 flex items-center justify-center">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateInterview(nameInput);
            }}
            className="w-full max-w-xl"
          >
            <div className="space-y-6">
<<<<<<< Updated upstream
              <div className="space-y-4">
                <h2 className="text-2xl text-ink-heavy leading-relaxed">我们先记下怎么称呼您</h2>
                <p className="text-lg text-ink-medium leading-relaxed">
                  请告诉我您的名字和年龄，这样访谈会更贴切一些。
=======
              <div className="space-y-3">
                <h2 className="text-2xl font-serif text-ink-heavy leading-relaxed">我们先记下怎么称呼您</h2>
                <p className="text-lg text-ink-medium leading-loose">
                  请告诉我您的名字。
                </p>
              </div>

              <label className="block">
                <span className="sr-only">您的名字</span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="请输入您的名字"
                  maxLength={50}
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg outline-none focus:border-seal-red px-2"
                />
              </label>

<<<<<<< Updated upstream
              <label className="block">
                <span className="sr-only">您的年龄</span>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(event) => setAgeInput(event.target.value)}
                  placeholder="请输入您的年龄"
                  min="1"
                  max="120"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg outline-none focus:border-seal-red px-2"
                />
              </label>

=======
>>>>>>> Stashed changes
              <button
                type="submit"
                disabled={creatingSession}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {creatingSession ? '正在开启访谈...' : '开始访谈'}
              </button>
            </div>
          </form>
        </main>

        <ConfirmDialog
          isOpen={dialog.isOpen}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          onConfirm={() => {
            dialog.onConfirm?.();
            setDialog((current) => ({ ...current, isOpen: false }));
          }}
        />
      </div>
    );
  }

  const specialActionQuestion = isSpecialActionQuestion(currentQuestion);

  return (
    <div className="min-h-dvh bg-paper-base flex flex-col">
      <header className="px-6 py-4 border-b border-ink-wash">
        <h1 className="text-xl text-ink-heavy">时光回响 · 访谈</h1>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {!currentQuestion && (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-ink-wash rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg text-ink-medium">正在为您准备第一个问题...</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (sessionId && userId) {
                  void loadCurrentQuestion(sessionId, userId);
                }
              }}
              className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm"
            >
              重新加载
            </button>
          </div>
        )}

        {currentQuestion && !isSpecialActionQuestion(currentQuestion) && (
          <div className="text-center py-4 text-ink-medium text-base">
            第 {currentQuestion.baseSlotsUsed || 0} 题 / 共 {currentQuestion.baseSlotsTotal || 50} 题
          </div>
        )}

        {currentQuestion && !isSpecialActionQuestion(currentQuestion) && (
          <div className="bg-paper-deep border-l-4 border-seal-red px-4 py-4 text-ink-medium text-base rounded-sm mb-6">
            💡 一次性打不完没关系，系统将自动记录您的回答
          </div>
        )}

        {currentQuestion && specialActionQuestion && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="border-2 border-seal-red rounded-sm p-6 bg-paper-deep">
              <h2 className="text-2xl text-ink-heavy leading-relaxed mb-4">{currentQuestion.content}</h2>
              <p className="text-lg text-ink-medium leading-relaxed">
                现在可以先整理成一版给您看看，不用再被题目卡住。
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void handleGeneratePreview()}
                disabled={generatingPreview}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {generatingPreview ? '正在整理当前版本...' : '生成当前版本'}
              </button>

              <button
                type="button"
                onClick={() => void router.push('/')}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm active:bg-paper-deep"
              >
                先回首页
              </button>
            </div>
          </div>
        )}

        {currentQuestion && !specialActionQuestion && (
          <div className="max-w-2xl mx-auto space-y-6">
            {currentQuestion.shouldSuggestPreview && (
              <div className="border-2 border-seal-red rounded-sm p-4 bg-paper-deep">
                <p className="text-lg text-ink-heavy leading-relaxed mb-4">
                  已经可以先整理成一版给您看看了。
                </p>
                <button
                  type="button"
                  onClick={() => void handleGeneratePreview()}
                  disabled={generatingPreview}
                  className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
                >
                  {generatingPreview ? '正在整理当前版本...' : '生成当前版本'}
                </button>
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-2xl text-ink-heavy leading-relaxed">{currentQuestion.content}</h2>

              {currentQuestion.hint && (
                <p className="text-lg text-ink-medium leading-relaxed">{currentQuestion.hint}</p>
              )}

              {remainingSkips !== null && !currentQuestion.isOptional && remainingSkips > 0 && (
                <p className="text-lg text-ink-medium">还可跳过 {remainingSkips} 次</p>
              )}
            </section>

            {currentQuestion.options && currentQuestion.options.length > 0 && (
              <section className="space-y-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptions.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleMainOptionToggle(option.value)}
                      aria-pressed={isSelected}
                      className={
                        isSelected
                          ? 'w-full min-h-[56px] px-4 py-4 border-2 border-ink-heavy bg-paper-deep text-ink-heavy text-lg text-left rounded-sm'
                          : 'w-full min-h-[56px] px-4 py-4 border border-ink-wash bg-paper-base text-ink-medium text-lg text-left rounded-sm active:bg-paper-deep'
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </section>
            )}

            {showMainDetailInput && (
              <section className="space-y-4">
                <label className="block">
                  <span className="sr-only">补充说明</span>
                  <textarea
                    value={choiceDetailText}
                    onChange={(event) => setChoiceDetailText(event.target.value)}
                    placeholder={
                      mainNeedsCustomInput ? '把刚才选的这一项具体说给我听听。' : '如果您愿意，也可以再补充几句细节。'
                    }
                    maxLength={1000}
                    className="w-full min-h-[180px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none px-2 py-4"
                  />
                </label>
              </section>
            )}

            {currentQuestion.answerMode === 'text' && (
              <section className="space-y-4">
                <label className="block">
                  <span className="sr-only">您的回答</span>
                  <textarea
                    value={textAnswer}
                    onChange={(event) => setTextAnswer(event.target.value)}
                    placeholder="您可以慢慢写，我会继续接着听。"
                    maxLength={1000}
                    className="w-full min-h-[220px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none px-2 py-4"
                  />
                </label>
              </section>
            )}

            {activeFollowups.length > 0 && (
              <section className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl text-ink-heavy">我想顺着刚才这项再多问您一句</h3>
                  {!followupsComplete && (
                    <p className="text-base text-ink-medium">把下面这几句也选完，我们就继续。</p>
                  )}
                </div>

                {activeFollowups.map(({ parentOption, question }) => renderFollowupQuestion(parentOption, question))}
              </section>
            )}

            <div className="flex flex-col gap-4 pt-2">
              {answerHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleGoBack()}
                  className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm active:bg-paper-deep"
                >
                  ← 返回上一题
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleSubmitAnswer()}
                disabled={!canSubmitCurrentQuestion || submitting || skipping}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : '保存并继续'}
              </button>

              {canSkipCurrentQuestion && (
                <button
                  type="button"
                  onClick={() => void handleSkipQuestion()}
                  disabled={submitting || skipping}
                  className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm active:bg-paper-deep disabled:border-ink-wash disabled:text-ink-wash disabled:cursor-not-allowed"
                >
                  {skipping ? '跳过中...' : '跳过'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => {
          dialog.onConfirm?.();
          setDialog((current) => ({ ...current, isOpen: false }));
        }}
      />
    </div>
  );
}
