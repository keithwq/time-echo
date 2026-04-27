const { OpenAI } = require('openai');

async function testAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  console.log('API Key:', apiKey ? `已设置 (长度: ${apiKey.length})` : '❌ 未设置');
  console.log('Base URL:', baseURL || '❌ 未设置');
  console.log('Model:', model);

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return;
  }

  const client = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });

  try {
    console.log('\n开始测试 API 调用...');
    const response = await client.chat.completions.create({
      model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: '你好，这是一个测试',
        },
      ],
    });

    console.log('\n✅ API 调用成功');
    console.log('响应结构:', JSON.stringify(response, null, 2).substring(0, 500));
    console.log('\nchoices 存在:', !!response.choices);
    console.log('choices[0] 存在:', !!(response.choices && response.choices[0]));
    console.log('message 存在:', !!(response.choices && response.choices[0] && response.choices[0].message));
    console.log('content:', response.choices?.[0]?.message?.content);
  } catch (error) {
    console.error('\n❌ API 调用失败:');
    console.error('错误:', error.message);
    console.error('响应状态:', error.status);
    console.error('响应数据:', error.response?.data);
  }
}

testAI();
