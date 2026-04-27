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

    req.on('error', (err) => {
      reject(err);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  try {
    const sessionId = 'e310db28-0243-486b-8e50-05d375379e25';
    
    console.log('\n❓ 获取扩展阶段的题目...');
    const nextRes = await makeRequest('POST', '/api/questions/next', {
      userId: 'demo-user-id',
      sessionId: sessionId,
      skippedCount: 0,
      baseQuestionSlotsUsed: 206,
    });
    
    console.log('状态码:', nextRes.status);
    console.log('响应:', JSON.stringify(nextRes.body, null, 2));

    if (nextRes.body.data && nextRes.body.data.questionId) {
      const qId = nextRes.body.data.questionId;
      console.log('\n📌 题目 ID:', qId);
      console.log('📌 题目来源:', nextRes.body.data.source || 'unknown');
      
      if (qId.includes('rewrite_failed_')) {
        console.log('\n⚠️ 检测到改写失败的 debug ID');
      } else if (qId.includes('generated_')) {
        console.log('\n✅ 检测到生成的题目');
      } else if (nextRes.body.data.source === 'rewritten') {
        console.log('\n✅ 改写成功！');
      }
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('完整错误:', error);
  }
}

test();
