const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  try {
    // 1. 获取当前会话
    console.log('\n📋 获取当前会话...');
    const sessionsRes = await makeRequest('GET', '/api/user/sessions?userId=demo-user-id');
    console.log('会话列表:', JSON.stringify(sessionsRes.body, null, 2));
    
    if (!sessionsRes.body.data || sessionsRes.body.data.length === 0) {
      console.log('❌ 没有找到会话');
      return;
    }

    const sessionId = sessionsRes.body.data[0].id;
    console.log('✅ 会话 ID:', sessionId);

    // 2. 进入扩展模式
    console.log('\n🔓 进入扩展模式...');
    const extendRes = await makeRequest('POST', '/api/interview/extend', {
      userId: 'demo-user-id',
      sessionId: sessionId,
    });
    console.log('扩展结果:', JSON.stringify(extendRes.body, null, 2));

    // 3. 获取下一题（应该触发改写）
    console.log('\n❓ 获取扩展阶段的题目...');
    const nextRes = await makeRequest('POST', '/api/questions/next', {
      userId: 'demo-user-id',
      sessionId: sessionId,
      skippedCount: 0,
      baseQuestionSlotsUsed: 22,
    });
    console.log('下一题结果:', JSON.stringify(nextRes.body, null, 2));

    // 检查是否有 debug ID
    if (nextRes.body.data && nextRes.body.data.questionId) {
      const qId = nextRes.body.data.questionId;
      if (qId.includes('rewrite_failed_')) {
        console.log('\n⚠️ 检测到改写失败的 debug ID:', qId);
      } else if (qId.includes('generated_')) {
        console.log('\n✅ 检测到生成的题目:', qId);
      } else {
        console.log('\n📌 题目来源:', nextRes.body.data.source || 'unknown');
      }
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

test();
