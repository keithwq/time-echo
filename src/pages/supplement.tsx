import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredInterviewUserId } from '@/lib/interviewStorage';

interface CompletionQuestion {
  id: string;
  type: string;
  question: string;
  hint: string;
  priority: number;
}

interface CompletionPackage {
  id: string;
  identifiedGaps: string[];
  gapSummary: string;
  questions: CompletionQuestion[];
}

const FREE_FIELDS: Array<{ id: string; label: string; placeholder: string; multiline?: boolean }> = [
  { id: 'free_name',     label: '补充一个名字',       placeholder: '您想记住的人名……' },
  { id: 'free_place',    label: '补充一个地名',       placeholder: '您难忘的地方……' },
  { id: 'free_unit',     label: '补充一个单位名',     placeholder: '您工作或生活过的单位、学校……' },
  { id: 'free_title',    label: '补充一个称呼',       placeholder: '您给某人的称呼，或别人对您的称呼……' },
  { id: 'free_sentence', label: '补充一句话',         placeholder: '想说却还没说的一句话……' },
  { id: 'free_event',    label: '补充一件记得的事',   placeholder: '一直记在心里的一件事……', multiline: true },
];

const FREE_QUESTION_LABELS: Record<string, string> = {
  free_name:     '您想补充一个重要的人名',
  free_place:    '您想补充一个重要的地名',
  free_unit:     '您想补充一个单位或机构名',
  free_title:    '您想补充一个称呼或头衔',
  free_sentence: '您有一句话想说',
  free_event:    '您有一件一直记得的事',
};

export default function SupplementPage() {
  const router = useRouter();
  const [completionPackage, setCompletionPackage] = useState<CompletionPackage | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [freeInputs, setFreeInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { sessionId } = router.query;
    if (!sessionId) return;

    const loadCompletionPackage = async () => {
      try {
        setLoading(true);
        const userId = getStoredInterviewUserId(localStorage);
        if (!userId) {
          setError('用户信息丢失，请重新开始');
          return;
        }

        const response = await fetch('/api/interview/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId }),
        });

        if (!response.ok) throw new Error('加载补全包失败');

        const result = await response.json();
        if (result.success) {
          setCompletionPackage(result.data.completionPackage);
        } else {
          setError(result.error || '加载失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadCompletionPackage();
  }, [router.query]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSkip = (questionId: string) => {
    setSkipped(prev => ({ ...prev, [questionId]: true }));
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleUnskip = (questionId: string) => {
    setSkipped(prev => ({ ...prev, [questionId]: false }));
  };

  const handleFreeInputChange = (fieldId: string, value: string) => {
    setFreeInputs(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const userId = getStoredInterviewUserId(localStorage);
      const sessionId = router.query.sessionId;

      if (!userId || !sessionId || !completionPackage) {
        setError('信息丢失');
        return;
      }

      // 问题包答案（未跳过且有内容）
      const packageAnswers = completionPackage.questions
        .filter(q => !skipped[q.id] && answers[q.id]?.trim())
        .map(q => ({
          questionId: q.id,
          questionContent: q.question,
          content: answers[q.id].trim(),
        }));

      // 自由补全答案（非空）
      const freeAnswers = FREE_FIELDS
        .filter(f => freeInputs[f.id]?.trim())
        .map(f => ({
          questionId: f.id,
          questionContent: FREE_QUESTION_LABELS[f.id],
          content: freeInputs[f.id].trim(),
        }));

      const allAnswers = [...packageAnswers, ...freeAnswers];

      if (allAnswers.length === 0) {
        setError('请至少补充一项内容');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/interview/completion-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          completionPackageId: completionPackage.id,
          answers: allAnswers,
          mode: 'supplement',
        }),
      });

      if (!response.ok) throw new Error('提交答案失败');

      const result = await response.json();
      if (result.success) {
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
        <p className="text-lg text-ink-medium font-serif">正在分析您的回忆录……</p>
      </div>
    );
  }

  if (error && !completionPackage) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-lg text-seal-red font-serif mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif rounded-sm"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!completionPackage) return null;

  return (
    <div className="min-h-screen bg-paper-base">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-paper-base border-b border-ink-wash z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-serif text-ink-heavy">补充内容</h1>
          <button
            onClick={() => router.back()}
            className="text-ink-medium text-xl leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 缺口总结 */}
        <div className="bg-paper-deep rounded-sm p-6 mb-8">
          <p className="text-base text-ink-medium font-serif leading-relaxed">
            {completionPackage.gapSummary}
          </p>
          <p className="text-base text-ink-wash font-serif mt-2">
            以下问题可以跳过，只填您愿意补充的部分。
          </p>
        </div>

        {/* P0：问题包补全 */}
        {completionPackage.questions.length > 0 && (
          <div className="space-y-6 mb-10">
            {completionPackage.questions.map((question, index) => (
              <div key={question.id} className="bg-paper-deep rounded-sm p-6">
                {skipped[question.id] ? (
                  <div className="flex items-center justify-between">
                    <p className="text-base text-ink-wash font-serif line-through">
                      {question.question}
                    </p>
                    <button
                      onClick={() => handleUnskip(question.id)}
                      className="ml-4 text-base text-seal-red flex-shrink-0"
                    >
                      撤销跳过
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-seal-red text-paper-base rounded-full flex items-center justify-center font-serif font-bold text-base">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-serif text-ink-heavy mb-1">
                          {question.question}
                        </p>
                        {question.hint && (
                          <p className="text-base text-ink-wash font-serif">
                            {question.hint}
                          </p>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="请输入您的回答……"
                      className="w-full min-h-[100px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-loose font-serif outline-none focus:border-seal-red resize-none mb-4"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSkip(question.id)}
                        className="text-base text-ink-wash"
                      >
                        跳过这题
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* P1：自由补全 */}
        <div className="mb-10">
          <h2 className="text-xl font-serif text-ink-heavy mb-6">还有什么想补充的？</h2>
          <p className="text-base text-ink-wash font-serif mb-6">
            以下内容全部可选，填一两条即可。
          </p>

          <div className="space-y-4">
            {FREE_FIELDS.map((field) => (
              <div key={field.id} className="bg-paper-deep rounded-sm px-5 py-4">
                <label className="block text-base text-ink-medium font-serif mb-2">
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    value={freeInputs[field.id] || ''}
                    onChange={(e) => handleFreeInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full min-h-[80px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-loose font-serif outline-none focus:border-seal-red resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={freeInputs[field.id] || ''}
                    onChange={(e) => handleFreeInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full min-h-[48px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-base text-seal-red font-serif mb-4 text-center">{error}</p>
        )}

        {/* 操作按钮 */}
        <div className="space-y-4 pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif rounded-sm transition-colors active:bg-opacity-80 disabled:bg-opacity-50"
          >
            {submitting ? '正在更新回忆录……' : '提交补充，更新回忆录'}
          </button>

          <button
            onClick={() => router.back()}
            className="w-full min-h-[56px] bg-transparent border-2 border-ink-wash text-ink-medium text-lg font-serif rounded-sm transition-colors active:bg-paper-deep"
          >
            暂不补充，返回
          </button>
        </div>
      </div>
    </div>
  );
}
