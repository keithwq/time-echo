const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { id: 'demo-user-id' },
      data: {
        ink_balance: 100,
        freePolishUsed: false,
        baseInterviewFrozenDrops: 0,
        extensionDropsRemaining: 10,
      },
    });
    console.log('✅ 用户余额已更新:', user);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
