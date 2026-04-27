import { useState } from 'react';
import { useRouter } from 'next/router';

interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  content: string[];
}

const guideSteps: GuideStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: '开始访谈',
    content: [
      '打开时光回响应用或网站',
      '点击"开始"按钮，进入访谈界面',
      '系统会自动为您创建一个访谈会话',
      '此时您会拥有 40 个基础冻结墨水和 10 个可操作墨水',
    ],
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: '回答问题',
    content: [
      '系统每次给您一个问题',
      '您可以根据题型选择快速选项或写长文本',
      '如果不想回答，可以点击"跳过"（最多 5 次）',
      '草稿会自动保存，随时可以返回继续',
    ],
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: '预览当前版本',
    content: [
      '完成 20-22 题后，系统会建议您预览',
      '点击"先预览当前版本"查看初步生成的小传',
      '预览不需要消耗额外墨水',
      '您可以继续回答更多问题，稍后再生成最终版本',
    ],
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: '选择补写方向',
    content: [
      '预览后，您可以选择继续补写',
      '补广度：添加缺失的主题、人物、地点或时间线',
      '补深度：围绕已有内容继续深入追问',
      '或者直接生成最终版本',
    ],
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: '生成最终小传',
    content: [
      '点击"生成"按钮生成最终版本',
      '系统会整理您的所有回答成一篇约 2000 字的人物小传',
      '小传按主题聚合，逻辑清晰，易于阅读',
      '生成过程通常需要数秒钟，请耐心等待',
    ],
  },
  {
    id: 'step-6',
    stepNumber: 6,
    title: '查看和导出',
    content: [
      '查看完整的小传内容',
      '您可以在浏览器中阅读、复制或打印',
      '点击"导出"按钮下载为 PDF 或 Word 文档',
      '建议保存一份本地副本作为珍贵记录',
    ],
  },
  {
    id: 'step-7',
    stepNumber: 7,
    title: '继续补写（可选）',
    content: [
      '小传生成后，您可以继续添加新的内容',
      '点击"继续访谈"开启新一轮补写',
      '此时需要消耗额外墨水或邀请朋友获得新墨水',
      '每次补写都会丰富您的故事',
    ],
  },
];

export default function GuidePage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = guideSteps[currentStepIndex];

  const goToNextStep = () => {
    if (currentStepIndex < guideSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
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
        <h1 className="text-2xl text-ink-heavy tracking-widest">使用指南</h1>
        <p className="text-lg text-ink-medium mt-2">
          第 {currentStep.stepNumber} / {guideSteps.length} 步
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 步骤内容 */}
        <div className="mb-8">
          <h2 className="text-3xl text-ink-heavy mb-6">{currentStep.title}</h2>

          <div className="space-y-4">
            {currentStep.content.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-seal-red text-paper-base text-lg font-bold">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-ink-heavy leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 步骤导航 */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={goToPrevStep}
            disabled={currentStepIndex === 0}
            className="flex-1 px-6 py-4 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm hover:bg-paper-deep transition-colors disabled:border-ink-wash disabled:text-ink-wash disabled:cursor-not-allowed"
          >
            ‹ 上一步
          </button>

          <button
            onClick={goToNextStep}
            disabled={currentStepIndex === guideSteps.length - 1}
            className="flex-1 px-6 py-4 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm hover:bg-opacity-90 transition-colors disabled:bg-ink-wash disabled:cursor-not-allowed"
          >
            下一步 ›
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="flex gap-2 justify-center">
          {guideSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStepIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStepIndex ? 'bg-seal-red' : 'bg-ink-wash hover:bg-ink-medium'
              }`}
              aria-label={`转到第 ${index + 1} 步`}
            />
          ))}
        </div>

        {/* 快速链接 */}
        <div className="mt-12 p-6 bg-paper-deep border border-ink-wash rounded-sm">
          <h3 className="text-xl text-ink-heavy mb-4">需要更多帮助？</h3>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/help/faq')}
              className="flex-1 px-4 py-4 min-h-[48px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm hover:bg-paper-base transition-colors"
            >
              常见问题
            </button>
            <button
              onClick={() => router.push('/contact')}
              className="flex-1 px-4 py-4 min-h-[48px] bg-seal-red text-paper-base text-lg rounded-sm hover:bg-opacity-90 transition-colors"
            >
              联系客服
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
