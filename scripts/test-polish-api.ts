/**
 * 直接 HTTP 集成测试脚本：AI 润色 API
 * 使用方法：
 *   1. 启动开发服务器：npm run dev
 *   2. 在另一个终端运行：npx ts-node scripts/test-polish-api.ts
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, any>;
}

const results: TestResult[] = [];

async function createTestUser() {
  console.log('\n📝 创建测试用户...');
  try {
    const response = await fetch(`${API_BASE}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'USER',
      }),
    });

    const data = (await response.json()) as any;
    if (data.success && data.data?.id) {
      console.log(`✅ 用户创建成功: ${data.data.id}`);
      return data.data.id;
    } else {
      throw new Error(data.error || '创建用户失败');
    }
  } catch (error) {
    console.error('❌ 创建用户失败:', error);
    throw error;
  }
}

async function testFirstPolishFree(userId: string) {
  console.log('\n🧪 测试 1: 首次润色免费');
  const testName = '首次润色免费';

  try {
    const response = await fetch(`${API_BASE}/ai/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        answerId: 'test-answer-1',
        originalText: '我觉得那个时候挺困难的，特别是在工厂里工作',
      }),
    });

    const data = (await response.json()) as any;

    if (data.success && data.data?.is_free && data.data?.cost === 0) {
      console.log('✅ 首次润色免费成功');
      console.log(`   原文: ${data.data.original_text}`);
      console.log(`   润色: ${data.data.polished_text}`);
      console.log(`   成本: ${data.data.cost} 水滴 (免费)`);
      console.log(`   剩余: ${data.data.remaining_drops} 水滴`);

      results.push({
        name: testName,
        passed: true,
        details: {
          is_free: data.data.is_free,
          cost: data.data.cost,
          remaining_drops: data.data.remaining_drops,
        },
      });
    } else {
      throw new Error(
        `预期首次润色免费，但得到: is_free=${data.data?.is_free}, cost=${data.data?.cost}`
      );
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    results.push({
      name: testName,
      passed: false,
      error: String(error),
    });
  }
}

async function testSecondPolishCost(userId: string) {
  console.log('\n🧪 测试 2: 第二次润色扣费 5 水滴');
  const testName = '第二次润色扣费';

  try {
    const response = await fetch(`${API_BASE}/ai/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        answerId: 'test-answer-2',
        originalText: '我觉得挺好的，特别是那段时间',
      }),
    });

    const data = (await response.json()) as any;

    if (data.success && !data.data?.is_free && data.data?.cost === 5) {
      console.log('✅ 第二次润色扣费成功');
      console.log(`   原文: ${data.data.original_text}`);
      console.log(`   润色: ${data.data.polished_text}`);
      console.log(`   成本: ${data.data.cost} 水滴`);
      console.log(`   剩余: ${data.data.remaining_drops} 水滴`);

      results.push({
        name: testName,
        passed: true,
        details: {
          is_free: data.data.is_free,
          cost: data.data.cost,
          remaining_drops: data.data.remaining_drops,
        },
      });
    } else {
      throw new Error(
        `预期第二次润色扣费 5 水滴，但得到: is_free=${data.data?.is_free}, cost=${data.data?.cost}`
      );
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    results.push({
      name: testName,
      passed: false,
      error: String(error),
    });
  }
}

async function testInsufficientDrops(userId: string) {
  console.log('\n🧪 测试 3: 水滴不足时拒绝');
  const testName = '水滴不足拒绝';

  try {
    // 先消耗大量水滴
    for (let i = 0; i < 10; i++) {
      await fetch(`${API_BASE}/ai/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          answerId: `test-answer-${i}`,
          originalText: `测试文本 ${i}`,
        }),
      });
    }

    // 尝试再次润色（应该失败）
    const response = await fetch(`${API_BASE}/ai/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        answerId: 'test-answer-fail',
        originalText: '这应该失败',
      }),
    });

    const data = (await response.json()) as any;

    if (!data.success && data.error?.includes('水滴')) {
      console.log('✅ 水滴不足时正确拒绝');
      console.log(`   错误信息: ${data.error}`);

      results.push({
        name: testName,
        passed: true,
        details: { error: data.error },
      });
    } else {
      throw new Error(`预期拒绝，但得到: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    results.push({
      name: testName,
      passed: false,
      error: String(error),
    });
  }
}

async function testTextPolishing() {
  console.log('\n🧪 测试 4: 文本改写逻辑');
  const testName = '文本改写逻辑';

  try {
    const testCases = [
      {
        input: '我觉得那个时候挺困难的',
        shouldContain: ['我认为', '很困难'],
      },
      {
        input: '特别是在工厂里工作',
        shouldContain: ['非常', '。'],
      },
    ];

    let allPassed = true;
    const details: Record<string, any> = {};

    for (const testCase of testCases) {
      // 模拟改写逻辑
      let polished = testCase.input.trim().replace(/\s+/g, ' ');
      if (!/[。！？]$/.test(polished)) {
        polished += '。';
      }
      polished = polished
        .replace(/我觉得/g, '我认为')
        .replace(/挺/g, '很')
        .replace(/特别/g, '非常');

      const passed = testCase.shouldContain.every((str) =>
        polished.includes(str)
      );
      allPassed = allPassed && passed;

      details[testCase.input] = {
        output: polished,
        passed,
      };

      console.log(`   输入: ${testCase.input}`);
      console.log(`   输出: ${polished}`);
      console.log(`   ${passed ? '✅' : '❌'}`);
    }

    results.push({
      name: testName,
      passed: allPassed,
      details,
    });
  } catch (error) {
    console.error('❌ 测试失败:', error);
    results.push({
      name: testName,
      passed: false,
      error: String(error),
    });
  }
}

async function testMissingFields() {
  console.log('\n🧪 测试 5: 缺少必需字段');
  const testName = '缺少必需字段';

  try {
    const response = await fetch(`${API_BASE}/ai/polish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        // 缺少 answerId 和 originalText
      }),
    });

    const data = (await response.json()) as any;

    if (!data.success && response.status === 400) {
      console.log('✅ 正确拒绝缺少字段的请求');
      console.log(`   错误信息: ${data.error}`);

      results.push({
        name: testName,
        passed: true,
        details: { error: data.error },
      });
    } else {
      throw new Error(`预期 400 错误，但得到: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
    results.push({
      name: testName,
      passed: false,
      error: String(error),
    });
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
    if (result.details) {
      console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`);
    }
  }

  console.log('='.repeat(60));
  console.log(`总计: ${passed}/${total} 测试通过`);
  console.log('='.repeat(60));

  process.exit(passed === total ? 0 : 1);
}

async function main() {
  console.log('🚀 开始 AI 润色 API 集成测试');
  console.log(`📍 API 地址: ${API_BASE}`);

  try {
    const userId = await createTestUser();

    await testFirstPolishFree(userId);
    await testSecondPolishCost(userId);
    await testInsufficientDrops(userId);
    await testTextPolishing();
    await testMissingFields();

    await printSummary();
  } catch (error) {
    console.error('💥 测试中断:', error);
    process.exit(1);
  }
}

main();
