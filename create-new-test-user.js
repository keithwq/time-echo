const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const now = new Date();
    const userId = `test-user-${Date.now()}`;
    const activeDealline = new Date(now.getTime() + 99 * 24 * 60 * 60 * 1000);
    const protectionEnd = new Date(now.getTime() + 189 * 24 * 60 * 60 * 1000);
    const destructionDate = new Date(now.getTime() + 190 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        id: userId,
        real_name: '测试用户',
        ink_balance: 100,
        baseInterviewFrozenDrops: 40,
        extensionDropsRemaining: 10,
        freePolishUsed: false,
        active_deadline: activeDealline,
        protection_end: protectionEnd,
        destruction_date: destructionDate,
      },
    });

    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        baseSlotsTotal: 50,
        baseSlotsUsed: 0,
        skippedCount: 0,
        isCompleted: false,
        isInExpansionMode: false,
      },
    });

    console.log('✅ 新测试用户创建成功');
    console.log('User ID:', user.id);
    console.log('Session ID:', session.id);
    console.log('\n测试命令:');
    console.log(`curl -X POST http://localhost:3001/api/questions/next -H "Content-Type: application/json" -d '{"userId":"${user.id}","sessionId":"${session.id}"}'`);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
