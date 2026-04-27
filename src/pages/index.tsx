import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const Home: NextPage = () => {
  const router = useRouter();
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [countdown, setCountdown] = useState(5);

  // 文本逐段淡入动效
  useEffect(() => {
    const paragraphs = 4; // 总共 4 段文本
    if (visibleParagraphs < paragraphs) {
      const timer = setTimeout(() => {
        setVisibleParagraphs(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visibleParagraphs]);

  // 按钮延迟可点击逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleEnter = () => {
    router.push('/interview');
  };

  return (
    <>
      <Head>
        <title>时光回响 - 记录您的人生故事</title>
      </Head>
      <div className="min-h-[100dvh] bg-paper-base flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="space-y-8">
            <h1 className="text-3xl font-serif text-ink-heavy tracking-widest text-center mb-2">
              时光回响
            </h1>
            <p className="text-base text-ink-medium text-center font-serif">
              为您的人生故事，留一份温暖的记录
            </p>
            <div className="text-lg text-ink-heavy leading-loose space-y-6 bg-paper-deep p-6 rounded-sm border-l-4 border-seal-red">
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 1 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                每一段平凡的人生，都值得被记录。您的故事、您的回忆、您走过的每一步，都是珍贵的人生印记。
              </p>
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 2 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                在这里，我们用简单的方式，帮您把生命中温暖的时刻整理成册——不为商业，只为传承。
              </p>
              <p
                className={`transition-opacity duration-700 ${
                  visibleParagraphs >= 3 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                这是一个公益项目。所有的服务器费用和算力成本，都由志愿者共同承担。您无需支付任何费用。
              </p>
              <p
                className={`text-ink-medium transition-opacity duration-700 ${
                  visibleParagraphs >= 4 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                您的数据永远属于您，可随时导出或删除。
              </p>
            </div>
            <button
              onClick={handleEnter}
              disabled={countdown > 0}
              className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg font-serif tracking-widest rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `请阅读 (${countdown}s)` : '开始记录我的故事'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
