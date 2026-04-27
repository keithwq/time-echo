import { prisma } from './src/lib/prisma';

async function createTestUser() {
  try {
    const user = await prisma.user.create({
      data: {
        id: 'demo-user-id',
        role: 'USER',
        ink_balance: 100,
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('测试用户创建成功:', user.id);
  } catch (error) {
    console.error('创建用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
