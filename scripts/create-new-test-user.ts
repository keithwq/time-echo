import { prisma } from '../src/lib/prisma';

async function main() {
  const userId = `test-user-${Date.now()}`;

  const user = await prisma.user.create({
    data: {
      id: userId,
      role: 'USER',
      ink_balance: 100,
      management_ink: 0,
      total_words_written: 0,
      total_ink_consumed: 0,
      monthly_expense: 0,
      active_deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      protection_end: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      destruction_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      freePolishUsed: false,
      baseInterviewFrozenDrops: 40,
      extensionDropsRemaining: 10,
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

  console.log('✅ New test user created:');
  console.log('User ID:', user.id);
  console.log('Session ID:', session.id);
  console.log('\nTest with:');
  console.log(`curl -X POST http://localhost:3001/api/questions/next -H "Content-Type: application/json" -d '{"userId":"${user.id}","sessionId":"${session.id}"}'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
