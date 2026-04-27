import { useState } from 'react';
import { useRouter } from 'next/router';
import ConfirmDialog from '@/components/ConfirmDialog';

interface DialogState {
  isOpen: boolean;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  function openDialog(message: string, type: DialogState['type'] = 'info') {
    setDialog({ isOpen: true, type, message });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      openDialog('请输入用户名', 'warning');
      return;
    }

    if (username.trim().length < 3) {
      openDialog('用户名至少需要 3 个字符', 'warning');
      return;
    }

    if (!password.trim()) {
      openDialog('请输入密码', 'warning');
      return;
    }

    if (password.length < 6) {
      openDialog('密码至少需要 6 个字符', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      openDialog('两次输入的密码不一致', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '注册失败');
      }

      openDialog('注册成功！请登录', 'info');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      openDialog(error instanceof Error ? error.message : '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-dvh bg-paper-base flex flex-col">
        <header className="px-6 py-4 border-b border-ink-wash">
          <h1 className="text-xl font-serif text-ink-heavy">时光回响 · 注册</h1>
        </header>

        <main className="flex-1 px-6 py-8 flex items-center justify-center">
          <form onSubmit={handleRegister} className="w-full max-w-xl">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-serif text-ink-heavy leading-relaxed">开启您的故事</h2>
                <p className="text-lg text-ink-medium leading-loose">
                  创建账号，开始记录您的人生。
                </p>
              </div>

              <div className="bg-paper-deep border-l-4 border-seal-red p-4 space-y-2">
                <p className="text-lg text-ink-heavy font-serif">
                  注册后您将获得 <span className="text-seal-red font-bold">50 滴墨水</span>
                </p>
                <p className="text-base text-ink-medium">
                  其中 40 滴用于开启访谈之旅，10 滴可用于润色和扩展。
                </p>
              </div>

              <label className="block">
                <span className="sr-only">用户名</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名（至少 3 个字符）"
                  maxLength={50}
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </label>

              <label className="block">
                <span className="sr-only">密码</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码（至少 6 个字符）"
                  maxLength={100}
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </label>

              <label className="block">
                <span className="sr-only">确认密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="确认密码"
                  maxLength={100}
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '注册'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm active:bg-paper-deep"
              >
                返回首页
              </button>
            </div>
          </form>
        </main>

        <ConfirmDialog
          isOpen={dialog.isOpen}
          type={dialog.type}
          message={dialog.message}
          onConfirm={() => setDialog((s) => ({ ...s, isOpen: false }))}
        />
      </div>
    </>
  );
}
