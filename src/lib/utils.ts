// 墨水计费公式
export function calculateInkCost(wordCount: number, isFirstQuestion: boolean = false): number {
  // PRD 3.3: 卷轴首发题免费
  if (isFirstQuestion) {
    return 0;
  }

  if (wordCount <= 50) {
    return 1;
  }
  return 1 + Math.ceil(Math.max(0, wordCount - 50) / 50);
}

// 生命周期时间戳生成
export function generateLifecycleTimestamps(createdAt: Date = new Date()) {
  const active_deadline = new Date(createdAt);
  active_deadline.setUTCDate(active_deadline.getUTCDate() + 99);

  const protection_end = new Date(createdAt);
  protection_end.setUTCDate(protection_end.getUTCDate() + 189);

  const destruction_date = new Date(createdAt);
  destruction_date.setUTCDate(destruction_date.getUTCDate() + 190);

  return { active_deadline, protection_end, destruction_date };
}

// 本地时区转换（仅前端使用）
export function formatDateLocal(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 计算剩余天数
export function getDaysRemaining(destructionDate: Date): number {
  const now = new Date();
  const diff = destructionDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 图片压缩（前端焦土防线）
export async function compressImage(file: File, maxSizeKB: number = 200): Promise<Blob> {
  // PRD 5.1: MIME 类型白名单检查
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，仅允许 JPEG、PNG、WebP');
  }

  // PRD 5.1: 文件大小预检查（防止 OOM）
  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`图片太大（>${maxSizeMB}MB），请裁剪后上传`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 分辨率降维
        if (width > 1920 || height > 1920) {
          const ratio = Math.min(1920 / width, 1920 / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 质量迭代降维
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Blob creation failed'));
                return;
              }

              const sizeKB = blob.size / 1024;
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                if (sizeKB > maxSizeKB) {
                  reject(new Error('图片压缩后仍超过限制，请选择更小的图片'));
                } else {
                  resolve(blob);
                }
              } else {
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg', // 明确指定 MIME 类型
            quality
          );
        };

        tryCompress();
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// LocalStorage 自动保存
export function setupAutoSave(
  key: string,
  getValue: () => string,
  interval: number = 5000,
  charThreshold: number = 10
) {
  let lastValue = '';
  let charCount = 0;

  const save = () => {
    const currentValue = getValue();
    if (currentValue !== lastValue) {
      localStorage.setItem(key, currentValue);
      lastValue = currentValue;
      charCount = 0;
    }
  };

  const timer = setInterval(save, interval);

  return {
    onInput: () => {
      charCount++;
      if (charCount >= charThreshold) {
        save();
        charCount = 0; // 重置计数
      }
    },
    clear: () => {
      clearInterval(timer);
      localStorage.removeItem(key);
    },
    restore: () => localStorage.getItem(key) || '',
  };
}

// Prompt Injection 防御
export function sanitizeUserInput(text: string): string {
  // 移除可能的指令关键词
  const dangerousPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /system\s+prompt/gi,
    /you\s+are\s+now/gi,
    /forget\s+everything/gi,
    /new\s+instructions/gi,
  ];

  let sanitized = text;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[已过滤]');
  });

  return sanitized;
}
