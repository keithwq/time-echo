// 加载 .env.local（Next.js 优先使用）
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env', override: true });

// 强制覆盖系统环境变量中的错误配置
process.env.OPENAI_BASE_URL = 'https://api.deepseek.com';

// 验证关键环境变量
console.log('[jest.setup] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '已设置' : '❌ 未设置');
console.log('[jest.setup] OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
console.log('[jest.setup] OPENAI_MODEL:', process.env.OPENAI_MODEL);
