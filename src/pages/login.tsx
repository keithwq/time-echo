import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      localStorage.setItem('userId', data.userId);
      localStorage.setItem('interview_user_id', data.userId);
      await router.push('/interview');
    } catch (err) {
      setError('网络错误，请重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>登录 - 时光回响</title>
      </Head>
      <div className="min-h-dvh bg-paper-base flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl text-ink-heavy tracking-widest mb-2">
                时光回响
              </h1>
              <p className="text-base text-ink-medium">
                登录您的账号
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-seal-red bg-opacity-10 border-l-4 border-seal-red px-4 py-4 rounded-sm">
                  <p className="text-seal-red text-base">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-lg text-ink-heavy mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入您的用户名"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg outline-none focus:border-seal-red px-2"
                />
              </div>

              <div>
                <label className="block text-lg text-ink-heavy mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入您的密码"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg outline-none focus:border-seal-red px-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {loading ? '正在登录...' : '登录'}
              </button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-ink-medium text-base">
                还没有账号？{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-seal-red hover:underline"
                >
                  立即注册
                </button>
              </p>
              <p className="text-ink-wash text-base">
                <button className="hover:text-ink-medium transition-colors">
                  忘记密码？
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
