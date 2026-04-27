import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';

interface UserData {
  id: string;
  real_name: string | null;
  birth_year: number | null;
  gender: string | null;
  birth_place: string | null;
  emergency_email: string | null;
  ink_balance: number;
  baseInterviewFrozenDrops: number;
  extensionDropsRemaining: number;
  total_ink_consumed: number;
  total_words_written: number;
  last_active_at: string;
}

export default function UserProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.replace('/');
      return;
    }
    fetchData(userId);
  }, []);

  async function fetchData(userId: string) {
    try {
      const [userRes, sessionsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/user/sessions?userId=${userId}&limit=1`),
      ]);

      if (!userRes.ok) throw new Error('获取用户信息失败');
      const userData = await userRes.json();
      setUser(userData);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessionCount(sessionsData.total ?? 0);
      }
    } catch (e) {
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <p className="text-lg text-ink-medium">加载中...</p>
      </UserLayout>
    );
  }

  if (error || !user) {
    return (
      <UserLayout>
        <p className="text-lg text-seal-red">{error || '用户信息不存在'}</p>
      </UserLayout>
    );
  }

  const lastActive = user.last_active_at
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(user.last_active_at))
    : '暂无记录';

  return (
    <UserLayout>
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-ink-heavy tracking-widest">个人信息</h2>
          <button
            onClick={() => router.push('/user/settings')}
            className="px-6 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm hover:bg-paper-deep transition-colors"
          >
            编辑信息
          </button>
        </div>

        {/* 基础档案 */}
        <section className="space-y-4">
          <h3 className="text-xl font-serif text-ink-heavy border-b border-ink-wash pb-2">基础档案</h3>
          <InfoRow label="昵称" value={user.real_name || '未填写'} />
          <InfoRow label="出生年份" value={user.birth_year ? `${user.birth_year} 年` : '未填写'} />
          <InfoRow label="性别" value={user.gender || '未填写'} />
          <InfoRow label="出生地" value={user.birth_place || '未填写'} />
          <InfoRow label="联系邮箱" value={user.emergency_email || '未填写'} />
        </section>

        {/* 水滴统计 */}
        <section className="space-y-4">
          <h3 className="text-xl font-serif text-ink-heavy border-b border-ink-wash pb-2">水滴账户</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="当前余额" value={`${user.ink_balance} 滴`} />
            <StatCard label="扩展剩余" value={`${user.extensionDropsRemaining} 滴`} />
            <StatCard label="访谈冻结" value={`${user.baseInterviewFrozenDrops} 滴`} />
            <StatCard label="历史消耗" value={`${user.total_ink_consumed} 滴`} />
          </div>
        </section>

        {/* 访谈统计 */}
        <section className="space-y-4">
          <h3 className="text-xl font-serif text-ink-heavy border-b border-ink-wash pb-2">访谈记录</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="已完成访谈" value={`${sessionCount} 次`} />
            <StatCard label="累计字数" value={`${user.total_words_written} 字`} />
            <StatCard label="最近活跃" value={lastActive} />
          </div>
        </section>
      </div>
    </UserLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2">
      <span className="text-lg text-ink-medium w-24 flex-shrink-0">{label}</span>
      <span className="text-lg text-ink-heavy">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper-deep rounded-sm p-4 min-h-[72px] flex flex-col justify-center">
      <p className="text-base text-ink-medium">{label}</p>
      <p className="text-xl font-serif text-ink-heavy mt-1">{value}</p>
    </div>
  );
}
