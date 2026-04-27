const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { id: 'demo-user-id' },
      data: {
        extensionDropsRemaining: 10,
        freePolishUsed: false,
      },
    });
    console.log('✅ 用户重置成功:', user);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
