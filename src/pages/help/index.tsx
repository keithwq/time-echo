import { useRouter } from 'next/router';

export default function HelpIndex() {
  const router = useRouter();

  const helpModules = [
    {
      id: 'faq',
      title: '常见问题',
      description: '快速查找常见问题的答案',
      icon: '❓',
      href: '/help/faq',
    },
    {
      id: 'guide',
      title: '使用指南',
      description: '逐步了解如何使用时光回响',
      icon: '📖',
      href: '/help/guide',
    },
    {
      id: 'privacy',
      title: '隐私与安全',
      description: '了解数据保护和隐私政策',
      icon: '🔒',
      href: '/help/privacy',
    },
  ];

  return (
    <div className="min-h-dvh bg-paper-base">
      <header className="px-6 py-4 border-b border-ink-wash">
        <h1 className="text-2xl text-ink-heavy tracking-widest">帮助中心</h1>
        <p className="text-lg text-ink-medium mt-2">找不到答案？点击下方快速查看</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {helpModules.map((module) => (
            <button
              key={module.id}
              onClick={() => router.push(module.href)}
              className="w-full p-6 min-h-[120px] bg-paper-deep border-2 border-ink-wash hover:border-seal-red rounded-sm transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{module.icon}</span>
                <div className="flex-1">
                  <h2 className="text-xl text-ink-heavy font-bold">{module.title}</h2>
                  <p className="text-lg text-ink-medium mt-2">{module.description}</p>
                </div>
                <span className="text-2xl text-ink-wash">›</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 bg-paper-deep border border-ink-wash rounded-sm">
          <h3 className="text-xl text-ink-heavy mb-4">还有其他问题？</h3>
          <p className="text-lg text-ink-medium mb-4">
            如果上面的内容没有解答您的问题，可以随时联系我们。
          </p>
          <button
            onClick={() => router.push('/contact')}
            className="px-6 py-4 min-h-[48px] bg-seal-red text-paper-base text-lg rounded-sm hover:bg-opacity-90 transition-colors"
          >
            联系我们
          </button>
        </div>
      </main>
    </div>
  );
}
