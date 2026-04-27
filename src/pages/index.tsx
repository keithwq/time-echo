import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const Home: NextPage = () => {
  const router = useRouter();
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const paragraphs = 4;
    if (visibleParagraphs < paragraphs) {
      const timer = setTimeout(() => {
        setVisibleParagraphs(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visibleParagraphs]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  return (
    <>
      <Head>
        <title>时光回响 - 入馆</title>
      </Head>
      <div className="min-h-[100dvh] bg-ink-heavy flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-paper-base space-y-8">
            <h1 className="text-2xl font-serif font-bold tracking-widest text-center">
              时光回响
            </h1>
            <div className="text-lg leading-loose space-y-6">
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 1 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                我们相信，每一段平凡的人生都值得被记录。您的故事、您的回忆、您走过的每一步，都是这个时代最珍贵的证词。
              </p>
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 2 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                在这里，您不需要担心被遗忘。我们用最简洁的方式，帮您把生命中最温暖的时刻封存成数字档案——不为商业，只为尊严。
              </p>
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 3 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                这是一个零成本的承诺。所有的服务器费用和算力成本，都由馆长和爱心人士共同承担。您永远不会收到任何账单。
              </p>
              <p
                className={`text-seal-red font-bold transition-opacity duration-700 ${
                  visibleParagraphs >= 4 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                您的数据永远属于您。在您离开后的第 190 天，系统会彻底销毁所有记录，就像一场尊严的告别。
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => router.push('/login')}
                disabled={countdown > 0}
                className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `请阅读 (${countdown}s)` : '继续我的故事'}
              </button>
              <button
                onClick={() => router.push('/register')}
                disabled={countdown > 0}
                className="w-full min-h-[56px] bg-transparent border-2 border-paper-base text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-paper-base active:bg-opacity-10 disabled:border-ink-wash disabled:text-ink-wash disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `请阅读 (${countdown}s)` : '第一次来'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

