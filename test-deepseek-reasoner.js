const { OpenAI } = require('openai');

async function test() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    console.log('📌 测试 DeepSeek Reasoner 模型...');
    const response = await client.chat.completions.create({
      model: 'deepseek-reasoner',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: '请简单回答：1+1=?',
        },
      ],
    });

    console.log('✅ API 调用成功');
    console.log('📌 响应结构:', {
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0],
    });
    console.log('📌 完整响应:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.response) {
      console.error('📌 响应状态:', error.response.status);
      console.error('📌 响应数据:', error.response.data);
    }
  }
}

test();
