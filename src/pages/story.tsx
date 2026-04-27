import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStoredInterviewUserId } from '@/lib/interviewStorage';

interface StoryData {
  storyMarkdown: string;
  wordCount: number;
  generatedAt: string;
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

export default function StoryPage() {
  const router = useRouter();
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { sessionId } = router.query;
    if (!sessionId) return;

    const loadStory = async () => {
      try {
        setLoading(true);
        const userId = getStoredInterviewUserId(localStorage);

        if (!userId) {
          setError('用户信息丢失');
          return;
        }

        const response = await fetch(`/api/interview/story?sessionId=${sessionId}&userId=${userId}`);

        if (!response.ok) {
          throw new Error('获取人生故事失败');
        }

        const result = await response.json();
        if (result.success) {
          setStoryData(result.data);
        } else {
          setError(result.error || '加载失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [router.query]);

  const handleEnterEditMode = () => {
    setIsEditing(true);
    setEditContent(storyData?.storyMarkdown || '');
    setCharCount(storyData?.storyMarkdown.length || 0);
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      if (!storyData) return;

      setStoryData({
        ...storyData,
        storyMarkdown: editContent,
      });

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const sessionId = router.query.sessionId;
      router.push(`/user/drops?sessionId=${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-ink-medium">正在生成您的人生故事...</p>
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

  if (!storyData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-paper-base">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-paper-base border-b border-ink-wash z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl text-ink-heavy">您的人生故事</h1>
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
        {isEditing && (
          <div className="bg-paper-deep rounded-sm p-6 mb-8">
            <p className="text-sm text-ink-medium mb-4">自由编辑您的人生故事</p>
            <textarea
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                setCharCount(e.target.value.length);
              }}
              className="w-full min-h-[400px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg leading-relaxed outline-none focus:border-seal-red resize-none mb-4"
            />
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-ink-medium">字数：{charCount}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 min-h-[48px] bg-seal-red text-paper-base text-lg rounded-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 显示人生故事内容 */}
        {!isEditing && (
          <>
            <div className="bg-paper-deep rounded-sm p-6 mb-8">
              {renderMarkdown(storyData.storyMarkdown)}
            </div>

            {/* 统计信息 */}
            <div className="text-center text-ink-medium text-base mb-8">
              <p>字数：{storyData.wordCount}</p>
              <p className="text-sm mt-2">
                生成时间：{new Date(storyData.generatedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </>
        )}

        {/* 操作按钮 */}
        <div className="space-y-4 mb-8">
          {!isEditing && (
            <>
              <button
                onClick={handleEnterEditMode}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
              >
                自由编辑
              </button>

              <button
                onClick={handleConfirm}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm transition-colors active:bg-paper-deep"
              >
                确认
              </button>

              <button
                onClick={() => router.back()}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-wash text-ink-medium text-lg rounded-sm transition-colors active:bg-paper-deep"
              >
                返回
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
