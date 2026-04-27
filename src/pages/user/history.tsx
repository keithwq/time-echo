import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';

interface SessionItem {
  id: string;
  baseSlotsUsed: number;
  baseSlotsTotal: number;
  isCompleted: boolean;
  isGenerated: boolean;
  startedAt: string;
  answerCount: number;
  totalWords: number;
  coveredTopics: number;
}

const PAGE_SIZE = 10;

export default function UserHistory() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { router.replace('/'); return; }
    fetchSessions(userId, 0);
  }, []);

  async function fetchSessions(userId: string, newOffset: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/sessions?userId=${userId}&limit=${PAGE_SIZE}&offset=${newOffset}`);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      setSessions(data.sessions);
      setTotal(data.total);
      setOffset(newOffset);
    } catch {
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  function handlePage(dir: 'prev' | 'next') {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const newOffset = dir === 'prev' ? Math.max(0, offset - PAGE_SIZE) : offset + PAGE_SIZE;
    fetchSessions(userId, newOffset);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <UserLayout>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-serif text-ink-heavy tracking-widest mb-8">访谈历史</h2>

        {error && <p className="text-lg text-seal-red mb-4">{error}</p>}

        {loading ? (
          <p className="text-lg text-ink-medium">加载中...</p>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-ink-medium font-serif">尚无访谈记录</p>
            <button
              onClick={() => router.push('/interview')}
              className="mt-6 px-8 min-h-[56px] bg-seal-red text-paper-base text-lg font-serif rounded-sm"
            >
              开始第一次访谈
            </button>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {sessions.map((s) => {
                const date = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(s.startedAt));
                return (
                  <li key={s.id} className="bg-paper-deep rounded-sm p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-serif text-ink-heavy">{date}</span>
                      <span className={`text-base px-3 py-1 rounded-sm ${
                        s.isGenerated
                          ? 'bg-ink-heavy text-paper-base'
                          : s.isCompleted
                          ? 'bg-ink-medium text-paper-base'
                          : 'border border-ink-wash text-ink-medium'
                      }`}>
                        {s.isGenerated ? '已生成' : s.isCompleted ? '已完成' : '进行中'}
                      </span>
                    </div>

                    <div className="flex gap-6 text-base text-ink-medium">
                      <span>回答 {s.answerCount} 题</span>
                      <span>共 {s.totalWords} 字</span>
                      <span>覆盖 {s.coveredTopics} 个主题</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => router.push(`/user/sessions/${s.id}`)}
                        className="flex-1 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm hover:bg-paper-base transition-colors"
                      >
                        查看详情
                      </button>
                      {!s.isCompleted && (
                        <button
                          onClick={() => router.push('/interview')}
                          className="flex-1 min-h-[48px] bg-seal-red text-paper-base text-lg font-serif rounded-sm"
                        >
                          继续访谈
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => handlePage('prev')}
                  disabled={currentPage === 1}
                  className="px-6 min-h-[48px] border-2 border-ink-wash text-lg text-ink-medium rounded-sm disabled:opacity-40 hover:border-ink-medium transition-colors"
                >
                  上一页
                </button>
                <span className="text-lg text-ink-medium">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => handlePage('next')}
                  disabled={currentPage === totalPages}
                  className="px-6 min-h-[48px] border-2 border-ink-wash text-lg text-ink-medium rounded-sm disabled:opacity-40 hover:border-ink-medium transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
