const { OpenAI } = require('openai');

async function test() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL;

    console.log('📌 配置信息:');
    console.log('  API 密钥:', apiKey ? '✅ 已配置' : '❌ 未配置');
    console.log('  Base URL:', baseURL || '(使用默认)');
    console.log('  模型:', model);

    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY 未配置');
      return;
    }

    const client = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    });

    console.log('\n🔄 测试 API 调用...');
    const response = await client.chat.completions.create({
      model: model || 'gpt-4o-mini',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: '你好，请回答"OK"',
        },
      ],
    });

    console.log('✅ API 调用成功');
    console.log('📌 响应:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ API 调用失败:', error.message);
    if (error.response) {
      console.error('📌 响应状态:', error.response.status);
      console.error('📌 响应数据:', error.response.data);
    }
  }
}

test();
