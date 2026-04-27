import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';

interface FormData {
  real_name: string;
  birth_year: string;
  gender: string;
  birth_place: string;
  emergency_email: string;
}

interface FormErrors {
  real_name?: string;
  birth_year?: string;
  gender?: string;
  birth_place?: string;
  emergency_email?: string;
  submit?: string;
}

export default function UserSettings() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    real_name: '',
    birth_year: '',
    gender: '',
    birth_place: '',
    emergency_email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { router.replace('/'); return; }
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((user) => {
        setForm({
          real_name: user.real_name || '',
          birth_year: user.birth_year?.toString() || '',
          gender: user.gender || '',
          birth_place: user.birth_place || '',
          emergency_email: user.emergency_email || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (form.real_name && (form.real_name.length < 2 || form.real_name.length > 50)) {
      errs.real_name = '昵称需 2-50 字';
    }
    if (form.birth_year) {
      const y = parseInt(form.birth_year);
      if (isNaN(y) || y < 1920 || y > 2016) errs.birth_year = '出生年份须在 1920-2016 之间';
    }
    if (form.gender && !['男', '女', '其他'].includes(form.gender)) {
      errs.gender = '请选择性别';
    }
    if (form.birth_place && (form.birth_place.length < 2 || form.birth_place.length > 100)) {
      errs.birth_place = '出生地需 2-100 字';
    }
    if (form.emergency_email && !/^[\w\.-]+@[\w\.-]+\.\w+$/.test(form.emergency_email)) {
      errs.emergency_email = '请输入正确的邮箱格式';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    setSaving(true);
    setErrors({});
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          real_name: form.real_name || undefined,
          birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
          gender: form.gender || undefined,
          birth_place: form.birth_place || undefined,
          emergency_email: form.emergency_email || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ submit: data.error || '保存失败，请稍后重试' });
        return;
      }
      setSavedOk(true);
      setTimeout(() => router.push('/user/profile'), 1500);
    } catch {
      setErrors({ submit: '网络错误，请稍后重试' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <UserLayout><p className="text-lg text-ink-medium">加载中...</p></UserLayout>;
  }

  if (savedOk) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <p className="text-2xl text-ink-heavy">保存成功</p>
          <p className="text-lg text-ink-medium">正在返回个人信息页...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-xl">
        <h2 className="text-2xl text-ink-heavy tracking-widest mb-8">账户设置</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="昵称" error={errors.real_name}>
            <input
              type="text"
              value={form.real_name}
              maxLength={50}
              placeholder="您的姓名或昵称"
              onChange={(e) => setForm({ ...form, real_name: e.target.value })}
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
          </Field>

          <Field label="出生年份" error={errors.birth_year}>
            <input
              type="number"
              value={form.birth_year}
              min={1920}
              max={2016}
              placeholder="例如：1950"
              onChange={(e) => setForm({ ...form, birth_year: e.target.value })}
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
          </Field>

          <Field label="性别" error={errors.gender}>
            <div className="flex gap-4">
              {['男', '女', '其他'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 min-h-[48px] text-lg border-2 rounded-sm transition-colors ${
                    form.gender === g
                      ? 'bg-seal-red text-paper-base border-seal-red'
                      : 'bg-transparent border-ink-wash text-ink-heavy hover:border-ink-medium'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="出生地" error={errors.birth_place}>
            <input
              type="text"
              value={form.birth_place}
              maxLength={100}
              placeholder="例如：山东省济南市"
              onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
          </Field>

          <Field label="联系邮箱（可选）" error={errors.emergency_email}>
            <input
              type="email"
              value={form.emergency_email}
              placeholder="用于接收通知"
              onChange={(e) => setForm({ ...form, emergency_email: e.target.value })}
              className="w-full px-4 py-4 min-h-[48px] bg-paper-deep border-2 border-ink-wash text-ink-heavy text-lg outline-none focus:border-seal-red rounded-sm"
            />
          </Field>

          {errors.submit && <p className="text-base text-seal-red text-center">{errors.submit}</p>}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/user/profile')}
              className="flex-1 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm hover:bg-paper-deep transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm disabled:bg-ink-wash transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-lg text-ink-heavy font-bold mb-4 block">{label}</label>
      {children}
      {error && <p className="text-base text-seal-red mt-2">{error}</p>}
    </div>
  );
}
