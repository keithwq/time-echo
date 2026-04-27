const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: 'demo-user-id' },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });
    
    if (sessions.length === 0) {
      console.log('❌ 没有找到会话');
      return;
    }

    const session = sessions[0];
    console.log('✅ 最新会话:');
    console.log('  ID:', session.id);
    console.log('  基础问题位总数:', session.baseSlotsTotal);
    console.log('  已使用:', session.baseSlotsUsed);
    console.log('  扩展模式:', session.isInExpansionMode);
    console.log('  已完成:', session.isCompleted);
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
