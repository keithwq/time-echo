const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // 创建测试用户
    const user = await prisma.user.upsert({
      where: { id: 'test-user-001' },
      update: {},
      create: {
        id: 'test-user-001',
        real_name: '测试用户',
        age: 65,
        active_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      },
    });

    console.log('✓ 用户:', user.id);

    // 创建测试会话
    const session = await prisma.interviewSession.upsert({
      where: { id: 'test-session-001' },
      update: {},
      create: {
        id: 'test-session-001',
        userId: user.id,
        baseSlotsTotal: 50,
        baseSlotsUsed: 5,
      },
    });

    console.log('✓ 会话:', session.id);

    // 创建测试答案
    const testAnswers = [
      '我出生在一个小村子，那时候生活很简朴。',
      '我的父亲是个农民，母亲在家务农。',
      '小时候我最喜欢和邻居的孩子一起玩。',
      '我上过小学，那时候条件很艰苦。',
      '初中的时候我开始喜欢读书。',
    ];

    for (let i = 0; i < testAnswers.length; i++) {
      await prisma.interviewAnswer.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          questionId: `test_q_${i}`,
          questionContent: `测试问题 ${i + 1}`,
          content: testAnswers[i],
          sourceQuestionMode: 'base',
          sourceType: 'local',
          topicTag: ['童年', '求学', '工作', '婚姻', '家庭'][i % 5],
        },
      });
    }

    console.log(`✓ 插入 ${testAnswers.length} 个测试答案`);
    console.log('\n测试数据已生成！');
    console.log(`用户 ID: ${user.id}`);
    console.log(`会话 ID: ${session.id}`);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
