import { useRouter } from 'next/router';

export default function ContactIndex() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-paper-base">
      <header className="px-6 py-4 border-b border-ink-wash sticky top-0 bg-paper-base z-10">
        <button
          onClick={() => router.back()}
          className="text-lg text-ink-medium hover:text-seal-red transition-colors mb-4"
        >
          ‹ 返回
        </button>
        <h1 className="text-2xl text-ink-heavy tracking-widest">联系我们</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-lg text-ink-medium mb-8 leading-relaxed">
          需要帮助？这些方式可以快速找到我们
        </p>

        {/* 微信客服 */}
        <div className="mb-6 p-6 bg-paper-deep border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors">
          <h3 className="text-2xl text-ink-heavy mb-4">📱 微信客服</h3>
          <p className="text-lg text-ink-medium mb-4">
            扫下方二维码添加客服微信，我们会尽快回复您的问题。
          </p>
          <div className="bg-paper-base p-4 rounded-sm mb-4 text-center">
            <p className="text-lg text-ink-wash">[微信二维码]</p>
            <p className="text-lg text-ink-heavy mt-2 font-bold">扫码添加客服</p>
          </div>
          <p className="text-lg text-ink-wash">客服工作时间：9:00 - 18:00（工作日）</p>
        </div>

        {/* 邮件反馈 */}
        <div className="mb-6 p-6 bg-paper-deep border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors">
          <h3 className="text-2xl text-ink-heavy mb-4">📧 邮件反馈</h3>
          <p className="text-lg text-ink-medium mb-4">
            如果您更喜欢通过邮件联系，可以发送到下方邮箱地址。
          </p>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-lg text-ink-heavy font-bold">feedback@timeecho.app</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('feedback@timeecho.app');
                alert('邮箱已复制到剪贴板');
              }}
              className="px-3 py-4 min-h-[48px] text-base bg-seal-red text-paper-base rounded-sm hover:bg-opacity-90 transition-colors"
            >
              复制
            </button>
          </div>
          <p className="text-lg text-ink-wash">我们会在 24 小时内回复您的邮件</p>
        </div>

        {/* 在线反馈 */}
        <div className="mb-6 p-6 bg-paper-deep border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors">
          <h3 className="text-2xl text-ink-heavy mb-4">✏️ 在线反馈</h3>
          <p className="text-lg text-ink-medium mb-6">
            如果您有任何建议或发现问题，可以通过在线表单告诉我们。
          </p>
          <button
            onClick={() => router.push('/contact/feedback')}
            className="w-full px-6 py-4 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm hover:bg-opacity-90 transition-colors"
          >
            提交反馈
          </button>
        </div>

        {/* 快速链接 */}
        <div className="mt-12 p-6 bg-paper-deep border border-ink-wash rounded-sm">
          <h3 className="text-xl text-ink-heavy mb-4">或者查看</h3>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.push('/help/faq')}
              className="w-full text-left px-4 py-4 min-h-[48px] bg-paper-base border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors text-lg text-ink-heavy"
            >
              ❓ 常见问题
            </button>
            <button
              onClick={() => router.push('/help/guide')}
              className="w-full text-left px-4 py-4 min-h-[48px] bg-paper-base border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors text-lg text-ink-heavy"
            >
              📖 使用指南
            </button>
            <button
              onClick={() => router.push('/help/privacy')}
              className="w-full text-left px-4 py-4 min-h-[48px] bg-paper-base border-2 border-ink-wash rounded-sm hover:border-seal-red transition-colors text-lg text-ink-heavy"
            >
              🔒 隐私与安全
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
