import { NextPage } from 'next';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="min-h-screen bg-paper-base flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl text-ink-heavy mb-4">
          {statusCode === 404 ? '页面未找到' : '出现问题了'}
        </h1>
        <p className="text-lg text-ink-medium mb-6">
          {statusCode === 404
            ? '抱歉，您访问的页面不存在。'
            : '应用遇到了一个错误。请刷新页面重试。'}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full min-h-[56px] bg-seal-red text-paper-base text-lg rounded-sm transition-colors active:bg-opacity-80"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
