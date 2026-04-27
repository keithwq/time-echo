const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// 手动加载 .env 文件
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

async function testAIConnection() {
  console.log('🔍 检查环境变量...');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '已设置 (长度: ' + process.env.OPENAI_API_KEY.length + ')' : '❌ 未设置');
  console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || '❌ 未设置');
  console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || '❌ 未设置');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 未配置');
    return;
  }

  console.log('\n🚀 测试 AI 连接...');

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  try {
    console.log('\n🧪 测试 1: 简单调用...');
    const response1 = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'deepseek-chat',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: '请用一句话介绍你自己。',
        },
      ],
    });

    console.log('✅ 测试 1 成功！');
    console.log('响应内容:', response1.choices[0].message.content);

    console.log('\n🧪 测试 2: 模拟回忆录生成（2500 tokens）...');
    const testMemoir = {
      title: '测试回忆录',
      sections: [
        {
          stage: 'childhood',
          title: '童年时光',
          content: '这是第 1 个问题的测试答案。我在这里分享了一些关于我人生的重要经历和感受。'.repeat(10),
        },
        {
          stage: 'youth',
          title: '青年时期',
          content: '这是第 2 个问题的测试答案。我在这里分享了一些关于我人生的重要经历和感受。'.repeat(10),
        },
      ],
      wordCount: 1000,
      generatedAt: new Date().toISOString(),
    };

    const memoirText = testMemoir.sections
      .map((section) => `## ${section.title}\n\n${section.content}`)
      .join('\n\n---\n\n');

    const prompt = `你是一位专业的传记作家。请根据以下初稿回忆录，进行改写和优化，使其更具文采、更连贯、更有感染力。

要求：
1. 保留所有原始信息和事实
2. 改进表达方式，使其更生动、更有文采
3. 增强段落之间的连贯性和逻辑性
4. 保持原有的人物声音和情感基调
5. 字数控制在 2000 字左右

原始初稿：

${memoirText}

请直接输出改写后的回忆录，不需要任何前言或说明。`;

    console.log('Prompt 长度:', prompt.length, '字符');

    const response2 = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'deepseek-chat',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('✅ 测试 2 成功！');
    console.log('响应内容长度:', response2.choices[0].message.content.length, '字符');
    console.log('响应内容预览:', response2.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ AI 连接失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('堆栈:', error.stack);
    }
  }
}

testAIConnection();
