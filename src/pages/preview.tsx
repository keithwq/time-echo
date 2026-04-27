import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredInterviewUserId } from '@/lib/interviewStorage';

interface MemoirSection {
  stage: string;
  title: string;
  content: string;
}

interface Memoir {
  title: string;
  sections: MemoirSection[];
  wordCount: number;
  generatedAt: string;
}

interface Answer {
  id: string;
  questionId: string;
  questionContent: string;
  content: string;
  topicTag: string;
  createdAt: string;
}

interface PreviewData {
  memoir: Memoir;
  markdown: string;
  unusedAnswers: Array<{
    id: string;
    questionContent: string;
    contentPreview: string;
  }>;
}

interface SessionData {
  session: {
    id: string;
    userId: string;
    isGenerated: boolean;
    answers: Answer[];
  };
  isGenerated: boolean;
  answersCount: number;
}

function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 一级标题
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-3xl text-ink-heavy mt-6 mb-4">
          {line.substring(2)}
        </h1>
      );
      i++;
      continue;
    }

    // 二级标题
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-2xl text-ink-heavy mt-5 mb-4">
          {line.substring(3)}
        </h2>
      );
      i++;
      continue;
    }

    // 引用块
    if (line.startsWith('> ')) {
      elements.push(
        <p key={i} className="text-lg text-ink-medium italic border-l-4 border-ink-wash pl-4 my-3">
          {line.substring(2)}
        </p>
      );
      i++;
      continue;
    }

    // 分隔线
    if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-6 border-t border-ink-wash" />);
      i++;
      continue;
    }

    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // 普通段落
    elements.push(
      <p key={i} className="text-lg text-ink-heavy leading-relaxed mb-4">
        {line}
      </p>
    );
    i++;
  }

  return <div className="space-y-2">{elements}</div>;
}

export default function PreviewPage() {
  const router = useRouter();

  // 获取用户 ID（优先从 localStorage，否则从会话数据）
  const getUserId = (sessionData: SessionData | null): string | null => {
    const storedId = getStoredInterviewUserId(localStorage);
    return storedId || sessionData?.session?.userId || null;
  };

  // 基础状态
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 功能状态
  const [memoirGenerated, setMemoirGenerated] = useState(false); // 是否已生成人生小传
  const [showingAnswers, setShowingAnswers] = useState(false); // 是否正在显示答案列表
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null); // 正在编辑的答案 ID
  const [editingContent, setEditingContent] = useState(''); // 编辑中的答案内容

  // 操作状态
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPolished, setIsPolished] = useState(false);
  const [polishedMarkdown, setPolishedMarkdown] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // AI 建议状态
  const [isSuggestingImprovements, setIsSuggestingImprovements] = useState(false);
  const [suggestionsRemaining, setSuggestionsRemaining] = useState(3);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  // 编辑状态
  const [isEditingMemoir, setIsEditingMemoir] = useState(false);
  const [memoirEditContent, setMemoirEditContent] = useState('');
  const [charCount, setCharCount] = useState(0);

  // 初始加载：获取会话信息和答案列表
  useEffect(() => {
    const { sessionId } = router.query;
    if (!sessionId) return;

    const loadSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/interview/session?sessionId=${sessionId}`);

        if (!response.ok) {
          throw new Error('获取会话信息失败');
        }

        const result = await response.json();
        if (result.success) {
          setSessionData(result.data);
          setMemoirGenerated(result.data.isGenerated);
          // 初始化建议剩余次数
          const remaining = result.data.maxAiSuggestions - result.data.aiSuggestionsUsed;
          setSuggestionsRemaining(Math.max(0, remaining));

          // 如果已生成但没有 previewData，自动加载
          if (result.data.isGenerated && !previewData) {
            const userId = getUserId(result.data);
            if (userId) {
              const generateRes = await fetch('/api/interview/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, sessionId }),
              });

              const generateResult = await generateRes.json();
              if (generateResult.success) {
                setPreviewData(generateResult.data);
                if (generateResult.data.isPolished) {
                  setIsPolished(true);
                  setPolishedMarkdown(generateResult.data.markdown);
                }
              }
            }
          }
        } else {
          setError(result.error || '加载失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router.query]);

  // 生成人生小传
  const handleGenerateMemoir = async () => {
    try {
      setGenerating(true);
      const userId = getUserId(sessionData);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId) {
        setError('用户信息或会话信息丢失');
        return;
      }

      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const result = await response.json();
      if (result.success) {
        setPreviewData(result.data);
        setMemoirGenerated(true);
        setShowingAnswers(false);
        // 设置润色状态和内容
        if (result.data.isPolished) {
          setIsPolished(true);
          setPolishedMarkdown(result.data.markdown);
        }
      } else {
        setError(result.error || '生成失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 保存编辑的答案
  const handleSaveAnswer = async (answerId: string, content: string) => {
    try {
      setSaving(true);
      const userId = getUserId(sessionData);

      if (!userId) {
        setError('用户信息丢失');
        return;
      }

      const response = await fetch(`/api/interview/answer/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const result = await response.json();
      if (result.success) {
        // 更新本地答案列表
        if (sessionData) {
          const updatedAnswers = sessionData.session.answers.map((ans) =>
            ans.id === answerId ? { ...ans, content } : ans
          );
          setSessionData({
            ...sessionData,
            session: {
              ...sessionData.session,
              answers: updatedAnswers,
              isGenerated: false,
            },
            isGenerated: false,
          });
        }
        setEditingAnswerId(null);
        setMemoirGenerated(false); // 标记需要重新生成
      } else {
        setError(result.error || '保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };



  // 获取 AI 修改建议
  const handleSuggestImprovements = async () => {
    try {
      setIsSuggestingImprovements(true);
      const userId = getUserId(sessionData);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId || !previewData) {
        setError('用户信息丢失');
        return;
      }

      const response = await fetch('/api/ai/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          memoirContent: previewData.markdown,
        }),
      });

      if (!response.ok) {
        throw new Error('获取建议失败');
      }

      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data.suggestions);
        setSuggestionsRemaining(result.data.suggestionsRemaining);
        setShowingSuggestions(true);
      } else {
        setError(result.error || '获取建议失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取建议失败');
    } finally {
      setIsSuggestingImprovements(false);
    }
  };

  // 确认人生小传
  const handleConfirm = async () => {
    try {
      const userId = getUserId(sessionData);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId) {
        setError('用户信息丢失');
        return;
      }

      // 人生小传已确认，导航到完成页面
      router.push(`/user/drops?sessionId=${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认失败');
    }
  };

  // 升级到人生故事
  const handleUpgradeToStory = async () => {
    try {
      setIsUpgrading(true);
      const userId = getUserId(sessionData);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId || !previewData) {
        setError('用户信息丢失');
        return;
      }

      const response = await fetch('/api/interview/upgrade-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          memoirMarkdown: previewData.markdown,
        }),
      });

      if (!response.ok) {
        throw new Error('升级失败');
      }

      const result = await response.json();
      if (result.success) {
        router.push(`/story?sessionId=${sessionId}`);
      } else {
        setError(result.error || '升级失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '升级失败');
    } finally {
      setIsUpgrading(false);
    }
  };

  // 进入编辑模式
  const handleEnterEditMode = () => {
    setIsEditingMemoir(true);
    setMemoirEditContent(previewData?.markdown || '');
    setCharCount(previewData?.markdown.length || 0);
  };

  // 保存编辑的人生小传
  const handleSaveMemoirEdit = async () => {
    try {
      setSaving(true);
      const userId = getUserId(sessionData);

      if (!userId || !previewData) {
        setError('用户信息丢失');
        return;
      }

      // 更新预览数据
      setPreviewData({
        ...previewData,
        markdown: memoirEditContent,
      });

      setIsEditingMemoir(false);
      setShowingSuggestions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 处理编辑内容变化
  const handleMemoirContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setMemoirEditContent(content);
    setCharCount(content.length);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-ink-medium">正在加载...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-seal-red mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 没有会话数据
  if (!sessionData) {
    return null;
  }

  const { session } = sessionData;

  // 渲染答案列表视图
  if (showingAnswers) {
    return (
      <div className="min-h-screen bg-paper-base">
        {/* 顶部导航 */}
        <div className="sticky top-0 bg-paper-base border-b border-ink-wash z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl text-ink-heavy">回顾答案</h1>
            <button
              onClick={() => setShowingAnswers(false)}
              className="text-ink-medium hover:text-ink-heavy transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 答案列表 */}
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4 mb-8">
            {session.answers.map((answer) => (
              <div key={answer.id} className="bg-paper-deep rounded-sm p-4">
                {editingAnswerId === answer.id ? (
                  // 编辑模式
                  <>
                    <p className="text-lg text-ink-medium mb-4">{answer.questionContent}</p>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full min-h-[200px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none mb-4"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSaveAnswer(answer.id, editingContent)}
                        disabled={saving}
                        className="flex-1 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm disabled:opacity-50"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={() => setEditingAnswerId(null)}
                        className="flex-1 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm"
                      >
                        取消
                      </button>
                    </div>
                  </>
                ) : (
                  // 查看模式
                  <>
                    <p className="text-lg text-ink-medium mb-2">{answer.questionContent}</p>
                    <p className="text-lg text-ink-heavy mb-4">{answer.content}</p>
                    <button
                      onClick={() => {
                        setEditingAnswerId(answer.id);
                        setEditingContent(answer.content);
                      }}
                      className="text-seal-red text-base"
                    >
                      修改
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* 返回按钮 */}
          <button
            onClick={() => setShowingAnswers(false)}
            className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
          >
            {memoirGenerated ? '返回人生小传' : '返回'}
          </button>
        </div>
      </div>
    );
  }

  // 主视图：显示人生小传或提示生成
  const displayMarkdown = isPolished && polishedMarkdown ? polishedMarkdown : previewData?.markdown || '';
  const title = previewData?.memoir.title || '您的回忆录';

  return (
    <div className="min-h-screen bg-paper-base">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-paper-base border-b border-ink-wash z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl text-ink-heavy">{title}</h1>
          <button
            onClick={() => router.back()}
            className="text-ink-medium hover:text-ink-heavy transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 编辑模式 */}
        {isEditingMemoir && (
          <div className="bg-paper-deep rounded-sm p-6 mb-8">
            <p className="text-sm text-ink-medium mb-4">自由编辑您的人生小传</p>
            <textarea
              value={memoirEditContent}
              onChange={handleMemoirContentChange}
              className="w-full min-h-[400px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none mb-4"
            />
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ink-medium">字数：{charCount}</p>
              {charCount > 2000 && (
                <p className="text-sm text-seal-red">超过 2000 字后，免费润色功能失效</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSaveMemoirEdit}
                disabled={saving}
                className="flex-1 min-h-[48px] bg-seal-red text-paper-base text-lg rounded-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setIsEditingMemoir(false)}
                className="flex-1 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 建议显示 */}
        {showingSuggestions && suggestions.length > 0 && (
          <div className="bg-paper-deep rounded-sm p-6 mb-8">
            <p className="text-lg text-ink-heavy mb-4">AI 修改建议</p>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-4 bg-paper-base rounded-sm border-l-4 border-seal-red">
                  <p className="text-lg text-ink-heavy">{suggestion}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowingSuggestions(false)}
              className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm mt-4"
            >
              关闭建议
            </button>
          </div>
        )}

        {/* 显示人生小传内容 */}
        {memoirGenerated && previewData && !isEditingMemoir && (
          <>
            <div className="bg-paper-deep rounded-sm p-6 mb-8">
              {renderMarkdown(displayMarkdown)}
            </div>

            {/* 统计信息 */}
            <div className="text-center text-ink-medium text-base mb-8">
              <p>字数：{previewData.memoir.wordCount}</p>
              <p className="text-sm mt-2">
                生成时间：{new Date(previewData.memoir.generatedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </>
        )}

        {/* 未生成时的提示 */}
        {!memoirGenerated && (
          <div className="bg-paper-deep rounded-sm p-6 mb-8 text-center">
            <p className="text-lg text-ink-heavy mb-4">
              您已完成 {session.answers.length} 个问题的回答
            </p>
            <p className="text-base text-ink-medium">
              点击下方「生成人生小传」按钮，AI 将为您整理成一篇连贯的人生小传
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-4 mb-8">
          {/* 已生成状态：显示 5 个操作入口 */}
          {memoirGenerated && (
            <>
              {/* (1) 自由编辑 */}
              <button
                onClick={handleEnterEditMode}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
              >
                自由编辑
              </button>

              {/* (2) AI 提示修改建议 */}
              <button
                onClick={handleSuggestImprovements}
                disabled={suggestionsRemaining <= 0 || isSuggestingImprovements}
                className="w-full min-h-[56px] bg-transparent border-2 border-seal-red text-seal-red text-lg rounded-sm transition-colors active:bg-paper-deep disabled:opacity-50"
              >
                {isSuggestingImprovements ? '正在获取建议...' : `AI 提示修改建议 (${suggestionsRemaining} 次)`}
              </button>

              {/* (3) 升级到人生故事 */}
              <button
                onClick={handleUpgradeToStory}
                disabled={isUpgrading}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80 disabled:opacity-50"
              >
                {isUpgrading ? '正在生成...' : '生成更完整版本（人生故事）'}
              </button>

              {/* (4) 确认 */}
              <button
                onClick={handleConfirm}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm transition-colors active:bg-paper-deep"
              >
                确认
              </button>

              {/* (5) 返回查看答案 */}
              <button
                onClick={() => setShowingAnswers(true)}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm transition-colors active:bg-paper-deep"
              >
                返回查看答案
              </button>

              {/* (6) 补充内容 */}
              <button
                onClick={() => router.push(`/supplement?sessionId=${router.query.sessionId}`)}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-wash text-ink-medium text-lg rounded-sm transition-colors active:bg-paper-deep"
              >
                补充内容，完善回忆录
              </button>
            </>
          )}

          {/* 未生成状态：显示生成按钮 */}
          {!memoirGenerated && (
            <button
              onClick={handleGenerateMemoir}
              disabled={generating}
              className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80 disabled:opacity-50"
            >
              {generating ? '正在生成...' : '生成人生小记'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

