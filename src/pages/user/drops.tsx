import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';

interface InkLog {
  id: string;
  amount: number;
  reason: string;
  balance_after: number;
  createdAt: string;
}

type FilterType = 'all' | 'income' | 'expense';
const PAGE_SIZE = 20;

export default function UserDrops() {
  const router = useRouter();
  const [logs, setLogs] = useState<InkLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { router.replace('/'); return; }
    fetchLogs(userId, 0);
  }, []);

  async function fetchLogs(userId: string, newOffset: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ink/logs?userId=${userId}&limit=${PAGE_SIZE}&offset=${newOffset}`);
      if (!res.ok) throw new Error('获取失败');
      const data = await res.json();
      setLogs(data.logs);
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
    fetchLogs(userId, newOffset);
  }

  const filtered = logs.filter((l) => {
    if (filter === 'income') return l.amount > 0;
    if (filter === 'expense') return l.amount < 0;
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'income', label: '收入' },
    { key: 'expense', label: '支出' },
  ];

  return (
    <UserLayout>
      <div className="max-w-2xl">
        <h2 className="text-2xl text-ink-heavy tracking-widest mb-8">水滴流水</h2>

        {/* 筛选 */}
        <div className="flex gap-4 mb-6">
          {filterButtons.map((b) => (
            <button
              key={b.key}
              onClick={() => setFilter(b.key)}
              className={`px-5 min-h-[48px] text-lg border-2 rounded-sm transition-colors ${
                filter === b.key
                  ? 'bg-seal-red text-paper-base border-seal-red'
                  : 'bg-transparent border-ink-wash text-ink-medium hover:border-ink-medium'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {error && <p className="text-lg text-seal-red mb-4">{error}</p>}

        {loading ? (
          <p className="text-lg text-ink-medium">加载中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-lg text-ink-medium py-8 text-center">暂无记录</p>
        ) : (
          <>
            {/* 表头 */}
            <div className="flex gap-4 py-4 border-b border-ink-wash text-base text-ink-medium">
              <span className="flex-1">时间</span>
              <span className="w-40">操作类型</span>
              <span className="w-20 text-right">数量</span>
              <span className="w-20 text-right">余额</span>
            </div>

            <ul>
              {filtered.map((log) => {
                const date = new Intl.DateTimeFormat('zh-CN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(log.createdAt));
                const isIncome = log.amount > 0;
                return (
                  <li key={log.id} className="flex gap-4 py-4 border-b border-ink-wash items-center">
                    <span className="flex-1 text-lg text-ink-medium">{date}</span>
                    <span className="w-40 text-lg text-ink-heavy">{log.reason}</span>
                    <span className={`w-20 text-lg text-right ${isIncome ? 'text-ink-heavy' : 'text-seal-red'}`}>
                      {isIncome ? '+' : ''}{log.amount}
                    </span>
                    <span className="w-20 text-lg text-ink-medium text-right">{log.balance_after}</span>
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
