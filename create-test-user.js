const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const now = new Date();
    const activeDealline = new Date(now.getTime() + 99 * 24 * 60 * 60 * 1000); // 99天后
    const protectionEnd = new Date(now.getTime() + 189 * 24 * 60 * 60 * 1000); // 189天后
    const destructionDate = new Date(now.getTime() + 190 * 24 * 60 * 60 * 1000); // 190天后

    const user = await prisma.user.create({
      data: {
        id: 'demo-user-id',
        real_name: '测试用户',
        ink_balance: 100,
        baseInterviewFrozenDrops: 0,
        extensionDropsRemaining: 10,
        freePolishUsed: false,
        active_deadline: activeDealline,
        protection_end: protectionEnd,
        destruction_date: destructionDate,
      },
    });
    console.log('✅ 测试用户创建成功:', user);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ 用户已存在');
      const user = await prisma.user.findUnique({
        where: { id: 'demo-user-id' },
      });
      console.log('现有用户:', user);
    } else {
      console.error('❌ 错误:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
