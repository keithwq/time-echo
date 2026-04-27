import { useState } from 'react';
import { useRouter } from 'next/router';

type FeedbackType = 'suggestion' | 'bug-report' | 'feedback' | 'other' | '';

interface FormErrors {
  type?: string;
  title?: string;
  content?: string;
  contactInfo?: string;
  submit?: string;
}

export default function FeedbackPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: '' as FeedbackType,
    title: '',
    content: '',
    contactInfo: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const feedbackTypes = [
    { value: 'suggestion', label: '功能建议' },
    { value: 'bug-report', label: '问题报告' },
    { value: 'feedback', label: '体验反馈' },
    { value: 'other', label: '其他' },
  ];

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.type) {
      newErrors.type = '请选择反馈类型';
    }

    if (formData.title.trim().length < 20 || formData.title.length > 100) {
      newErrors.title = '标题需要 20-100 字';
    }

    if (formData.content.trim().length < 20 || formData.content.length > 1000) {
      newErrors.content = '内容需要 20-1000 字';
    }

    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (
      !formData.contactInfo.trim() ||
      (!emailRegex.test(formData.contactInfo) && !phoneRegex.test(formData.contactInfo))
    ) {
      newErrors.contactInfo = '请输入有效的邮箱或手机号';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.message || '提交失败，请稍后重试' });
        return;
      }

      // Success
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/contact');
      }, 2000);
    } catch (error) {
      setErrors({ submit: '提交失败，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content || formData.type) {
      if (confirm('确定要放弃草稿吗？')) {
        router.push('/contact');
      }
    } else {
      router.push('/contact');
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-dvh bg-paper-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl text-ink-heavy mb-4">感谢反馈！</h2>
          <p className="text-lg text-ink-medium">您的反馈已成功提交，我们会尽快查看并回复。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper-base">
      <header className="px-6 py-4 border-b border-ink-wash sticky top-0 bg-paper-base z-10">
        <button
          onClick={() => router.back()}
          className="text-lg text-ink-medium hover:text-seal-red transition-colors mb-4"
        >
          ‹ 返回
        </button>
        <h1 className="text-2xl text-ink-heavy tracking-widest">提交反馈</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-lg text-ink-medium mb-8 leading-relaxed">
          您的反馈对我们很重要，帮助我们做得更好。请详细描述您的想法。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 反馈类型 */}
          <div>
            <label className="text-lg text-ink-heavy font-bold mb-4 block">
              反馈类型 <span className="text-seal-red">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData({ ...formData, type: e.target.value as FeedbackType });
                setErrors({ ...errors, type: undefined });
              }}
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231F1E1D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '40px',
              }}
            >
              <option value="">请选择...</option>
              {feedbackTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-base text-seal-red mt-2">{errors.type}</p>}
          </div>

          {/* 反馈标题 */}
          <div>
            <label className="text-lg text-ink-heavy font-bold mb-4 block">
              反馈标题 <span className="text-seal-red">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setErrors({ ...errors, title: undefined });
                }}
                placeholder="简要描述您的反馈..."
                maxLength={100}
                className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-ink-wash">
                {formData.title.length} / 100
              </div>
            </div>
            <p className="text-lg text-ink-wash mt-2">至少 20 字，最多 100 字</p>
            {errors.title && <p className="text-lg text-seal-red mt-2">{errors.title}</p>}
          </div>

          {/* 反馈内容 */}
          <div>
            <label className="text-lg text-ink-heavy font-bold mb-4 block">
              反馈内容 <span className="text-seal-red">*</span>
            </label>
            <div className="relative">
              <textarea
                value={formData.content}
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  setErrors({ ...errors, content: undefined });
                }}
                placeholder="请详细描述您的反馈..."
                maxLength={1000}
                className="w-full px-4 py-4 min-h-[200px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm resize-none"
              />
              <div className="absolute right-4 bottom-4 text-base text-ink-wash">
                {formData.content.length} / 1000
              </div>
            </div>
            <p className="text-lg text-ink-wash mt-2">至少 20 字，最多 1000 字</p>
            {errors.content && <p className="text-lg text-seal-red mt-2">{errors.content}</p>}
          </div>

          {/* 联系方式 */}
          <div>
            <label className="text-lg text-ink-heavy font-bold mb-4 block">
              联系方式 <span className="text-seal-red">*</span>
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => {
                setFormData({ ...formData, contactInfo: e.target.value });
                setErrors({ ...errors, contactInfo: undefined });
              }}
              placeholder="请输入邮箱或手机号"
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
            <p className="text-lg text-ink-wash mt-2">邮箱或手机号格式</p>
            {errors.contactInfo && <p className="text-lg text-seal-red mt-2">{errors.contactInfo}</p>}
          </div>

          {/* 错误提示 */}
          {errors.submit && <p className="text-lg text-seal-red text-center">{errors.submit}</p>}

          {/* 按钮 */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-4 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm hover:bg-paper-deep transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm hover:bg-opacity-90 transition-colors disabled:bg-ink-wash disabled:cursor-not-allowed"
            >
              {isSubmitting ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
