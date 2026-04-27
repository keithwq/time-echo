const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testPreviewFlow() {
  try {
    console.log('🚀 开始测试预览页面流程...\n');

    // 1. 创建测试用户
    console.log('1️⃣ 创建测试用户...');
    const userRes = await fetch(`${BASE_URL}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        real_name: '测试用户',
        birth_year: 1960,
        gender: '男',
        birth_place: '北京',
      }),
    });

    const userData = await userRes.json();
    console.log('📋 用户响应:', JSON.stringify(userData, null, 2));

    const userId = userData.data?.id || userData.id;
    if (!userId) {
      console.error('❌ 无法获取用户 ID，响应:', userData);
      return;
    }
    console.log(`✅ 用户创建成功: ${userId}\n`);

    // 2. 启动访谈会话
    console.log('2️⃣ 启动访谈会话...');
    const sessionRes = await fetch(`${BASE_URL}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const sessionData = await sessionRes.json();
    console.log('📋 会话响应:', JSON.stringify(sessionData, null, 2));

    const sessionId = sessionData.data?.sessionId || sessionData.sessionId;
    if (!sessionId) {
      console.error('❌ 无法获取会话 ID，响应:', sessionData);
      return;
    }
    console.log(`✅ 会话启动成功: ${sessionId}\n`);

    // 3. 获取第一个问题并开始答题
    console.log('3️⃣ 开始答题（约 38 题）...');
    let questionCount = 0;
    let currentQuestionId = null;

    for (let i = 0; i < 38; i++) {
      // 获取下一个问题
      const nextRes = await fetch(`${BASE_URL}/questions/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          currentQuestionId,
          skippedCount: 0,
          baseQuestionSlotsUsed: i,
        }),
      });

      const nextData = await nextRes.json();
      if (i === 0) {
        console.log('📋 第一个问题响应:', JSON.stringify(nextData, null, 2));
      }

      currentQuestionId = nextData.data?.questionId || nextData.questionId;

      if (!currentQuestionId) {
        console.error(`❌ 第 ${i + 1} 题：无法获取问题 ID，响应:`, nextData);
        break;
      }

      // 提交答案
      const answerRes = await fetch(`${BASE_URL}/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          questionId: currentQuestionId,
          answer: `这是第 ${i + 1} 个问题的测试答案。我在这里分享了一些关于我人生的重要经历和感受。`,
        }),
      });

      const answerData = await answerRes.json();
      if (i === 0) {
        console.log('📋 第一个答案响应:', JSON.stringify(answerData, null, 2));
      }

      if (answerRes.ok) {
        questionCount++;
        process.stdout.write(`\r✅ 已完成 ${questionCount} 题`);
      } else {
        console.error(`❌ 第 ${i + 1} 题：提交答案失败，响应:`, answerData);
        break;
      }
    }

    console.log(`\n✅ 答题完成: ${questionCount} 题\n`);

    // 4. 生成人生小传
    console.log('4️⃣ 生成人生小传...');
    const generateRes = await fetch(`${BASE_URL}/interview/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionId }),
    });

    const generateData = await generateRes.json();
    if (generateData.success) {
      console.log('✅ 人生小传生成成功\n');
    } else {
      console.log('❌ 生成失败:', generateData.error);
      return;
    }

    // 5. 输出预览页面 URL
    console.log('5️⃣ 预览页面已准备好\n');
    console.log('📍 请在浏览器中访问以下 URL：');
    console.log(`http://localhost:3000/preview?sessionId=${sessionId}\n`);

    console.log('⚠️  然后在浏览器控制台中执行以下命令来设置 localStorage：');
    console.log(`localStorage.setItem('interviewUserId', '${userId}');\n`);

    console.log('✨ 现在可以测试以下功能：');
    console.log('  1. 自由编辑 - 进入编辑模式，查看字数统计');
    console.log('  2. AI 提示修改建议 - 获取 3-5 条改进建议（最多 3 次）');
    console.log('  3. 确认 - 完成人生小传');
    console.log('  4. 返回查看答案 - 查看原始答案');
    console.log('  5. 使用墨水增加问题包 - 开启扩展包\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('堆栈:', error.stack);
  }
}

testPreviewFlow();

