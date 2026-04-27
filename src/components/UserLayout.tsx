import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/user/profile', label: '个人信息' },
  { href: '/user/history', label: '访谈历史' },
  { href: '/user/drops', label: '墨水流水' },
  { href: '/user/settings', label: '账户设置' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-paper-base flex flex-col">
      <header className="px-6 py-4 border-b border-ink-wash bg-paper-base">
        <button
          onClick={() => router.push('/')}
          className="text-lg text-ink-medium hover:text-seal-red transition-colors"
        >
          ‹ 返回首页
        </button>
        <h1 className="text-2xl font-serif text-ink-heavy tracking-widest mt-2">我的书房</h1>
      </header>

      <div className="flex flex-1">
        {/* 左侧导航 */}
        <nav className="w-48 border-r border-ink-wash bg-paper-deep flex-shrink-0">
          <ul className="py-4">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-6 min-h-[56px] text-lg font-serif transition-colors ${
                      isActive
                        ? 'bg-seal-red text-paper-base'
                        : 'text-ink-medium hover:text-ink-heavy hover:bg-paper-base'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 右侧内容 */}
        <main className="flex-1 px-8 py-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
