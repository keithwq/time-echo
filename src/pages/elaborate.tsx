import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredInterviewUserId } from '@/lib/interviewStorage';

interface UnusedAnswer {
  id: string;
  questionContent: string;
  contentPreview: string;
}

interface MemoirData {
  memoir: {
    title: string;
    wordCount: number;
    sections: Array<{ stage: string; title: string; content: string }>;
    generatedAt: string;
  };
  markdown: string;
  unusedAnswers: UnusedAnswer[];
}

export default function ElaboratePage() {
  const router = useRouter();
  const [memoirData, setMemoirData] = useState<MemoirData | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [elaboration, setElaboration] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { sessionId } = router.query;
    if (!sessionId) return;

    const loadMemoirData = async () => {
      try {
        setLoading(true);
        const userId = getStoredInterviewUserId(localStorage);
        if (!userId) {
          setError('用户信息丢失，请重新开始');
          return;
        }

        const response = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId }),
        });

        if (!response.ok) {
          throw new Error('加载回忆录失败');
        }

        const result = await response.json();
        if (result.success) {
          setMemoirData(result.data);
          if (result.data.unusedAnswers.length > 0) {
            setSelectedAnswerId(result.data.unusedAnswers[0].id);
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

    loadMemoirData();
  }, [router.query]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const userId = getStoredInterviewUserId(localStorage);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId || !selectedAnswerId || !elaboration.trim()) {
        setError('请填写完整信息');
        return;
      }

      const response = await fetch('/api/interview/elaborate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          unusedAnswerId: selectedAnswerId,
          elaboration: elaboration.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('提交展开内容失败');
      }

      const result = await response.json();
      if (result.success) {
        // 返回预览页面，显示更新后的回忆录
        localStorage.removeItem('previewMode');
        router.push(`/preview?sessionId=${sessionId}`);
      } else {
        setError(result.error || '提交失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-ink-medium">正在加载未入稿内容...</p>
        </div>
      </div>
    );
  }

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

  if (!memoirData || memoirData.unusedAnswers.length === 0) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-ink-medium mb-6">暂无未入稿的内容</p>
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

  const currentAnswer = memoirData.unusedAnswers.find(a => a.id === selectedAnswerId);

  return (
    <div className="min-h-screen bg-paper-base">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-paper-base border-b border-ink-wash z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl text-ink-heavy">展开内容</h1>
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
        {/* 未入稿回答列表 */}
        <div className="bg-paper-deep rounded-sm p-6 mb-8">
          <h2 className="text-xl text-ink-heavy mb-4">选择要展开的内容：</h2>
          <div className="space-y-4">
            {memoirData.unusedAnswers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => {
                  setSelectedAnswerId(answer.id);
                  setElaboration('');
                }}
                className={`w-full text-left p-4 rounded-sm transition-colors ${
                  selectedAnswerId === answer.id
                    ? 'bg-seal-red text-paper-base'
                    : 'bg-paper-base border-2 border-ink-wash text-ink-heavy hover:border-ink-medium'
                }`}
              >
                <p className="font-serif font-bold mb-1">{answer.questionContent}</p>
                <p className="text-sm opacity-75">{answer.contentPreview}...</p>
              </button>
            ))}
          </div>
        </div>

        {/* 展开输入框 */}
        {currentAnswer && (
          <div className="bg-paper-deep rounded-sm p-6 mb-8">
            <h3 className="text-lg text-ink-heavy mb-4">原始回答：</h3>
            <p className="text-lg text-ink-medium leading-relaxed mb-6 pb-6 border-b border-ink-wash">
              {currentAnswer.contentPreview}...
            </p>

            <h3 className="text-lg text-ink-heavy mb-4">补充更多细节：</h3>
            <p className="text-base text-ink-wash mb-4">
              可以补充更多细节、感受或故事
            </p>

            <textarea
              value={elaboration}
              onChange={(e) => setElaboration(e.target.value)}
              placeholder="请输入您的补充内容..."
              className="w-full min-h-[200px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none"
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || !elaboration.trim()}
            className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80 disabled:bg-opacity-50 flex items-center justify-center"
          >
            {submitting ? '正在提交...' : '提交补充'}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full min-h-[56px] bg-transparent border-2 border-ink-wash text-ink-medium text-lg rounded-sm transition-colors active:bg-paper-deep flex items-center justify-center"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
