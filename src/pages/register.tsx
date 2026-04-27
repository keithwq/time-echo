import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }

    if (username.length < 3) {
      setError('用户名至少3位');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          real_name: realName || null,
          age: age ? parseInt(age) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
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
        <title>注册 - 时光回响</title>
      </Head>
      <div className="min-h-dvh bg-paper-base flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-serif text-ink-heavy tracking-widest mb-2">
                时光回响
              </h1>
              <p className="text-base text-ink-medium font-serif">
                创建账号，开始记录您的故事
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-seal-red bg-opacity-10 border-l-4 border-seal-red px-4 py-3 rounded-sm">
                  <p className="text-seal-red text-base">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-lg text-ink-heavy font-serif mb-2">
                  用户名 <span className="text-seal-red">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="至少3位"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </div>

              <div>
                <label className="block text-lg text-ink-heavy font-serif mb-2">
                  密码 <span className="text-seal-red">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </div>

              <div>
                <label className="block text-lg text-ink-heavy font-serif mb-2">
                  确认密码 <span className="text-seal-red">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再输入一遍密码"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </div>

              <div>
                <label className="block text-lg text-ink-heavy font-serif mb-2">
                  您的名字
                </label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="可选"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </div>

              <div>
                <label className="block text-lg text-ink-heavy font-serif mb-2">
                  年龄
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="可选"
                  min="1"
                  max="120"
                  className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2"
                />
              </div>

              <div className="bg-paper-deep border-l-4 border-seal-red px-4 py-3 rounded-sm">
                <p className="text-ink-heavy text-base font-serif leading-loose">
                  ⚠️ 请牢记您的用户名和密码，这是您访问回忆录的唯一凭证。
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {loading ? '正在注册...' : '创建账号'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-ink-medium text-base">
                已有账号？{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-seal-red hover:underline font-serif"
                >
                  立即登录
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
