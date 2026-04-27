import { useState } from 'react';
import { useRouter } from 'next/router';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQ[] = [
  {
    id: 'faq-001',
    question: '什么是水滴？',
    answer:
      '水滴是时光回响的虚拟货币，用于购买访谈资格和扩展功能。每个新用户会获得 50 个水滴。其中 40 个用于购买一轮基础访谈资格，剩余 10 个可用于扩展操作（如增加问题、AI 润色等）。',
  },
  {
    id: 'faq-002',
    question: '我有 40 个水滴，为什么不能直接用？',
    answer:
      '40 个水滴是"基础冻结"，用于购买一轮基础访谈资格。这部分水滴无法提前使用或退回。另外有 10 个"可操作"水滴，才能用于扩展操作。这样设计是为了保护用户的基础权益。',
  },
  {
    id: 'faq-003',
    question: '基础访谈要问满 50 题吗？',
    answer:
      '不需要。50 个问题是默认上限，但如果内容已经足够成文（通常在 20-40 题左右），您可以随时预览当前版本。满意的话，可以直接生成，不必问完 50 题。',
  },
  {
    id: 'faq-004',
    question: '如何获得更多水滴？',
    answer:
      '主要方式是邀请朋友使用时光回响。每成功邀请 1 人，双方各获得 5 个额外水滴。被邀请人使用邀请链接注册后，邀请会立即生效。',
  },
  {
    id: 'faq-005',
    question: '邀请朋友有什么奖励？',
    answer:
      '每成功邀请 1 个朋友，您会获得 5 个额外水滴。被邀请人也会获得 5 个额外水滴作为新用户奖励。这些水滴可用于扩展操作。',
  },
  {
    id: 'faq-006',
    question: '水滴会过期吗？',
    answer:
      '基础冻结的 40 个水滴与账户绑定，不会过期。额外获得的水滴（如邀请奖励）会在获得后 180 天过期。建议及时使用。',
  },
  {
    id: 'faq-007',
    question: '我可以跳过不想回答的问题吗？',
    answer:
      '可以。每轮访谈最多可以跳过 5 次。每跳过一题，系统会即时补入一题。被跳过的问题永久移出当前任务流，不会再出现。',
  },
  {
    id: 'faq-008',
    question: '我的草稿会自动保存吗？',
    answer:
      '会的。系统会每 5 秒或每输入 10 字符时自动保存一次草稿。您还可以点击"稍后继续"手动保存。中途关闭应用，下次访问时会自动恢复。',
  },
  {
    id: 'faq-009',
    question: '我能修改已提交的回答吗？',
    answer:
      '目前版本中，提交后的回答无法直接修改。但您可以继续补充新的内容。最终生成小传时，会综合所有回答生成完整故事。',
  },
  {
    id: 'faq-010',
    question: '什么时候可以预览我的小传？',
    answer:
      '完成约 20-22 题、覆盖多个主题后，系统会自动建议预览。您也可以随时手动点击"先预览当前版本"按钮预览。',
  },
  {
    id: 'faq-011',
    question: '生成的小传可以编辑吗？',
    answer:
      '目前版本支持基础预览。后续将支持段落级别的编辑、补充和修改。您可以继续补写新内容，重新生成更新的版本。',
  },
  {
    id: 'faq-012',
    question: '小传如何导出？',
    answer:
      '生成小传后，您可以下载为 PDF 或 Word 文档。点击"导出"按钮，选择格式即可。建议保存一份本地副本。',
  },
  {
    id: 'faq-013',
    question: '我的数据会被保存多长时间？',
    answer:
      '您的访谈数据会持续保存，支持您随时返回继续补写。整个生命周期中，我们会安全地保护您的数据。您也可以随时申请导出或删除。',
  },
  {
    id: 'faq-014',
    question: '可以删除我的数据吗？',
    answer:
      '可以。您可以随时申请删除账户和所有数据。提交申请后会有 30 天的缓冲期，之后数据会被永久删除。具体操作请在"隐私与安全"页面查看。',
  },
  {
    id: 'faq-015',
    question: '我的小传会被公开吗？',
    answer:
      '不会。您的小传完全私密，只有您自己可以查看。我们不会未经您同意将任何数据共享给第三方，也不会用于其他商业目的。',
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <h1 className="text-2xl font-serif text-ink-heavy tracking-widest">常见问题</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 搜索框 */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索问题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
            <button className="px-6 min-h-[48px] bg-seal-red text-paper-base text-lg font-serif rounded-sm hover:bg-opacity-90 transition-colors">
              搜索
            </button>
          </div>
        </div>

        {/* 问题列表 */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="border-2 border-ink-wash rounded-sm overflow-hidden hover:border-seal-red transition-colors"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-6 min-h-[56px] flex items-center justify-between bg-paper-deep hover:bg-paper-base transition-colors text-left"
                >
                  <span className="text-lg font-serif text-ink-heavy font-bold">{faq.question}</span>
                  <span className="text-2xl text-ink-medium ml-4 flex-shrink-0">
                    {expandedId === faq.id ? '▼' : '▶'}
                  </span>
                </button>

                {expandedId === faq.id && (
                  <div className="p-6 bg-paper-base border-t-2 border-ink-wash">
                    <p className="text-lg text-ink-medium leading-loose">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-ink-medium">未找到匹配的问题</p>
            <p className="text-base text-ink-wash mt-2">请尝试其他搜索词</p>
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-12 p-6 bg-paper-deep border border-ink-wash rounded-sm">
          <p className="text-lg text-ink-medium mb-4">
            还有其他问题？请查看完整的隐私政策或直接联系我们。
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/help/privacy')}
              className="flex-1 px-4 py-3 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg font-serif rounded-sm hover:bg-paper-base transition-colors"
            >
              隐私与安全
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="flex-1 px-4 py-3 min-h-[48px] bg-seal-red text-paper-base text-lg font-serif rounded-sm hover:bg-opacity-90 transition-colors"
            >
              联系客服
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
