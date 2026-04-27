import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';

interface InviteData {
  inviteCode: string;
  inviteUrl: string;
  successCount: number;
  bonusDrops: number;
}

export default function UserInvite() {
  const router = useRouter();
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.replace('/');
      return;
    }
    fetchInviteData(userId);
  }, []);

  async function fetchInviteData(userId: string) {
    try {
      const res = await fetch(`/api/user/invite?userId=${userId}`);
      if (!res.ok) throw new Error('获取失败');
      const inviteData = await res.json();
      setData(inviteData);
    } catch (error) {
      console.error('获取邀请信息失败:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!data?.inviteUrl) return;
    navigator.clipboard.writeText(data.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <UserLayout>
        <p className="text-lg text-ink-medium">加载中...</p>
      </UserLayout>
    );
  }

  if (!data) {
    return (
      <UserLayout>
        <p className="text-lg text-seal-red">加载失败，请稍后重试</p>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-2xl space-y-8">
        <h2 className="text-2xl text-ink-heavy tracking-widest">邀请朋友</h2>

        {/* 邀请说明 */}
        <section className="bg-paper-deep border-l-4 border-seal-red px-6 py-4 rounded-sm space-y-4">
          <p className="text-lg text-ink-heavy">分享您的故事，帮助更多人记录人生</p>
          <p className="text-base text-ink-medium leading-relaxed">
            邀请朋友注册时使用您的邀请链接，每成功邀请 1 位朋友，您将获得 10 滴墨水奖励。
          </p>
        </section>

        {/* 邀请链接 */}
        <section className="space-y-4">
          <h3 className="text-xl text-ink-heavy">您的邀请链接</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={data.inviteUrl}
              readOnly
              className="flex-1 px-4 py-4 min-h-[56px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg rounded-sm"
            />
            <button
              onClick={handleCopy}
              className="px-6 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <p className="text-base text-ink-medium">
            将链接分享给朋友，他们点击链接注册即可获得您的邀请奖励。
          </p>
        </section>

        {/* 邀请成果 */}
        <section className="space-y-4">
          <h3 className="text-xl text-ink-heavy">邀请成果</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-paper-deep rounded-sm p-6 min-h-[120px] flex flex-col justify-center">
              <p className="text-base text-ink-medium mb-2">已邀请朋友</p>
              <p className="text-3xl text-ink-heavy">{data.successCount}</p>
              <p className="text-base text-ink-medium mt-2">位</p>
            </div>
            <div className="bg-paper-deep rounded-sm p-6 min-h-[120px] flex flex-col justify-center">
              <p className="text-base text-ink-medium mb-2">获得奖励</p>
              <p className="text-3xl text-ink-heavy">{data.bonusDrops}</p>
              <p className="text-base text-ink-medium mt-2">滴墨水</p>
            </div>
          </div>
        </section>

        {/* 返回按钮 */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => router.push('/user/profile')}
            className="flex-1 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm hover:bg-paper-deep transition-colors"
          >
            返回个人信息
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
