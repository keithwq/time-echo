const { getAIClient, getModelName } = require('./src/lib/aiClient');

try {
  const client = getAIClient();
  const model = getModelName();
  
  console.log('✅ AI 客户端初始化成功');
  console.log('📌 模型:', model);
  console.log('📌 客户端类型:', client.constructor.name);
  console.log('📌 API 密钥长度:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('📌 Base URL:', process.env.OPENAI_BASE_URL);
} catch (error) {
  console.error('❌ 错误:', error.message);
}
