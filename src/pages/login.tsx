import { useState } from 'react';
import { useRouter } from 'next/router';
import ConfirmDialog from '@/components/ConfirmDialog';
import { persistInterviewIdentity } from '@/lib/interviewStorage';

interface DialogState {
  isOpen: boolean;
  type: 'info' | 'warning' | 'error';
  message: string;
}

interface ProgressInfo {
  userId: string;
  sessionId: string;
  lastActivityTime?: string;
  progress?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  function openDialog(message: string, type: DialogState['type'] = 'info') {
    setDialog({ isOpen: true, type, message });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim()) {
      openDialog('请输入用户名', 'warning');
      return;
    }

    if (!password.trim()) {
      openDialog('请输入密码', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '登录失败');
      }

      setProgressInfo(result.data);
    } catch (error) {
      openDialog(error instanceof Error ? error.message : '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!progressInfo) return;
    persistInterviewIdentity(localStorage, {
      userId: progressInfo.userId,
      sessionId: progressInfo.sessionId,
    });
    router.push('/interview');
  }

  if (progressInfo) {
    return (
      <div className="min-h-dvh bg-paper-base flex flex-col">
        <header className="px-6 py-4 border-b border-ink-wash">
          <h1 className="text-xl font-serif text-ink-heavy">时光回响 · 欢迎回来</h1>
        </header>

        <main className="flex-1 px-6 py-8 flex items-center justify-center">
          <div className="w-full max-w-xl space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-serif text-ink-heavy leading-relaxed">您的进度</h2>
            </div>

            <div className="bg-paper-deep border-l-4 border-seal-red p-6 space-y-4">
              {progressInfo.lastActivityTime && (
                <div>
                  <p className="text-base text-ink-medium">上次访问</p>
                  <p className="text-lg text-ink-heavy font-serif">{progressInfo.lastActivityTime}</p>
                </div>
              )}

              {progressInfo.progress && (
                <div>
                  <p className="text-base text-ink-medium">进度</p>
                  <p className="text-lg text-ink-heavy font-serif">{progressInfo.progress}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80"
              >
                继续我的故事
              </button>

              <button
                onClick={() => {
                  setProgressInfo(null);
                  setUsername('');
                  setPassword('');
                }}
                className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm active:bg-paper-deep"
              >
                返回登录
              </button>
            </div>
          </div>
        </main>

        <ConfirmDialog
          isOpen={dialog.isOpen}
          type={dialog.type}
          message={dialog.message}
          onConfirm={() => setDialog((s) => ({ ...s, isOpen: false }))}
        />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-dvh bg-paper-base flex flex-col">
        <header className="px-6 py-4 border-b border-ink-wash">
          <h1 className="text-xl font-serif text-ink-heavy">时光回响 · 登录</h1>
        </header>

        <main className="flex-1 px-6 py-8 flex items-center justify-center">
          <form onSubmit={handleLogin} className="w-full max-w-xl">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-serif text-ink-heavy leading-relaxed">欢迎回来</h2>
                <p className="text-lg text-ink-medium leading-loose">
                  输入用户名和密码，继续您的故事。
                </p>
              </div>

              <label className="block">
                <span className="sr-only">用户名</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
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
                  placeholder="密码"
                  maxLength={100}
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
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

