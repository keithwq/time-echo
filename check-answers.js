const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnswers() {
  const sessionId = 'b7ff6b4e-d13f-4f62-bb86-e5e34a519f2f';

  const answers = await prisma.interviewAnswer.findMany({
    where: { sessionId },
    select: {
      id: true,
      questionContent: true,
      content: true,
      topicTag: true,
      sourceQuestionMode: true,
      sourceType: true,
    },
  });

  console.log('找到', answers.length, '条回答');
  answers.forEach((a, i) => {
    console.log(`\n[${i + 1}] ${a.questionContent}`);
    console.log('    内容:', a.content.substring(0, 50) + '...');
    console.log('    topicTag:', a.topicTag);
    console.log('    sourceType:', a.sourceType);
  });

  await prisma.$disconnect();
}

checkAnswers();
