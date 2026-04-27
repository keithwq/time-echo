interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'error';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText,
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  // 根据类型确定边框颜色
  const borderColor = {
    info: 'border-ink-medium',
    warning: 'border-seal-red',
    error: 'border-seal-red',
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* 弹窗容器 */}
      <div className={`relative bg-paper-base border-2 ${borderColor} rounded-sm max-w-md w-full mx-4 p-6`}>
        {/* 标题 */}
        {title && (
          <h2 className="text-2xl text-ink-heavy mb-4 tracking-widest">
            {title}
          </h2>
        )}

        {/* 正文 */}
        <p className="text-lg text-ink-medium leading-relaxed mb-6">
          {message}
        </p>

        {/* 按钮区域 */}
        <div className="flex gap-4">
          {cancelText && onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-lg rounded-sm active:bg-paper-deep"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`${cancelText ? 'flex-1' : 'w-full'} min-h-[56px] bg-seal-red text-paper-base text-lg tracking-widest rounded-sm transition-colors active:bg-opacity-80`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
