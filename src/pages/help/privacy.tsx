import { useState } from 'react';
import { useRouter } from 'next/router';

interface PrivacySection {
  id: string;
  title: string;
  content: string[];
}

const privacySections: PrivacySection[] = [
  {
    id: 'privacy-policy',
    title: '隐私政策',
    content: [
      '我们收集您的基本信息（如昵称、年龄、出生地）和访谈内容，仅用于生成您的人物小传。',
      '所有数据均存储在安全的服务器上，采用加密传输和存储。',
      '我们不会与任何第三方共享您的数据，除非获得您的明确同意。',
      '我们尊重您的隐私，您可以随时查看、修改或删除您的数据。',
      '我们遵守相关的数据保护法规，包括《个人信息保护法》等。',
    ],
  },
  {
    id: 'data-protection',
    title: '数据保护措施',
    content: [
      '所有传输均使用 HTTPS 加密，防止中途被截获。',
      '服务器采用行业标准的安全防护，包括防火墙、入侵检测等。',
      '我们定期进行安全审计和漏洞扫描，确保系统安全。',
      '员工接受严格的数据保护培训，签署保密协议。',
      '我们不会用您的数据进行任何商业目的，除非获得明确授权。',
    ],
  },
  {
    id: 'water-drop-rules',
    title: '墨水规则说明',
    content: [
      '每个新用户获得 50 个墨水：40 个基础冻结，10 个可操作。',
      '基础冻结的 40 个墨水用于购买一轮基础访谈资格，不可提前使用或退回。',
      '可操作的 10 个墨水可用于：增加问题（1 滴 = 2 题）、第二次及以后的 AI 润色（5 滴/次）。',
      '首次 AI 润色免费，第二次及以后每次消耗 5 个墨水。',
      '通过邀请朋友可获得额外墨水：每邀请 1 人，双方各获 5 滴。',
      '邀请获得的额外墨水在获得后 180 天过期，基础墨水不过期。',
      '所有墨水操作都会被记录在"墨水账户"中，您可随时查看。',
    ],
  },
  {
    id: 'user-agreement',
    title: '用户协议',
    content: [
      '您同意使用时光回响服务需遵守本协议。',
      '您保证提交的信息真实、合法，不含虚假、诽谤或侵犯他人权利的内容。',
      '禁止行为：上传非法内容、骚扰他人、尝试破坏系统安全。',
      '我们保留删除违规内容和禁用账户的权利。',
      '本服务按"现状"提供，我们尽力确保可用性但不保证无中断。',
      '对于因使用本服务而造成的任何损失，我们不承担责任。',
    ],
  },
  {
    id: 'data-deletion',
    title: '数据删除与销毁',
    content: [
      '您可以随时请求删除账户和所有相关数据。',
      '提交删除请求后，我们会进行 30 天的缓冲期。',
      '缓冲期内，您可以取消删除请求，恢复账户。',
      '30 天后，您的所有数据将被永久删除，包括访谈内容、生成的小传等。',
      '删除后的数据无法恢复，请确保已保存重要内容。',
      '如需删除数据，请在"用户中心"的设置页面提交申请。',
    ],
  },
  {
    id: 'your-rights',
    title: '您的权利',
    content: [
      '知情权：您有权了解我们收集、使用和存储的您的数据。',
      '访问权：您可以随时访问和查看您的所有个人数据。',
      '更正权：您可以修改您的个人信息，确保准确性。',
      '删除权：您可以请求删除您的账户和数据。',
      '导出权：您可以导出您的访谈记录和生成的小传。',
      '如对我们的数据处理有疑问，可随时联系我们的客服。',
    ],
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>('privacy-policy');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-dvh bg-paper-base">
      <header className="px-6 py-4 border-b border-ink-wash sticky top-0 bg-paper-base z-10">
        <button
          onClick={() => router.back()}
          className="text-lg text-ink-medium hover:text-seal-red transition-colors mb-4"
        >
          ‹ 返回
        </button>
        <h1 className="text-2xl font-serif text-ink-heavy tracking-widest">隐私与安全</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {privacySections.map((section) => (
            <div
              key={section.id}
              className="border-2 border-ink-wash rounded-sm overflow-hidden hover:border-seal-red transition-colors"
            >
              <button
                onClick={() => toggleExpand(section.id)}
                className="w-full p-6 min-h-[56px] flex items-center justify-between bg-paper-deep hover:bg-paper-base transition-colors text-left"
              >
                <span className="text-lg font-serif text-ink-heavy font-bold">{section.title}</span>
                <span className="text-2xl text-ink-medium ml-4 flex-shrink-0">
                  {expandedId === section.id ? '▼' : '▶'}
                </span>
              </button>

              {expandedId === section.id && (
                <div className="p-6 bg-paper-base border-t-2 border-ink-wash space-y-4">
                  {section.content.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-seal-red flex-shrink-0 font-bold">•</span>
                      <p className="text-lg text-ink-medium leading-loose">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 联系我们 */}
        <div className="mt-12 p-6 bg-paper-deep border border-ink-wash rounded-sm">
          <h3 className="text-xl font-serif text-ink-heavy mb-4">有任何隐私问题？</h3>
          <p className="text-lg text-ink-medium mb-4">
            如您对我们的隐私政策或数据处理有任何疑问，欢迎随时联系我们。
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/help/faq')}
              className="flex-1 px-4 py-3 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm hover:bg-paper-base transition-colors"
            >
              常见问题
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="flex-1 px-4 py-3 min-h-[48px] bg-seal-red text-paper-base text-lg font-serif rounded-sm hover:bg-opacity-90 transition-colors"
            >
              联系我们
            </button>
          </div>
        </div>

        {/* 最后更新时间 */}
        <div className="mt-8 p-4 bg-paper-deep rounded-sm text-center">
          <p className="text-base text-ink-wash">
            最后更新：2026 年 4 月 1 日
          </p>
        </div>
      </main>
    </div>
  );
}
