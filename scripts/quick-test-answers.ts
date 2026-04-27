import { prisma } from '../src/lib/prisma';

const testAnswers = [
  '我出生在一个小村子，那时候生活很简朴。',
  '我的父亲是个农民，母亲在家务农。',
  '小时候我最喜欢和邻居的孩子一起玩。',
  '我上过小学，那时候条件很艰苦。',
  '初中的时候我开始喜欢读书。',
  '高中我考上了县城的重点中学。',
  '大学我学的是工程专业。',
  '毕业后我在工厂工作了十年。',
  '我在工厂认识了我的妻子。',
  '我们结婚的时候很简朴，只办了一个小宴席。',
  '我们的第一个孩子是儿子，现在已经长大了。',
  '后来我们又生了一个女儿。',
  '我在工厂做过班长，那时候责任很大。',
  '改革开放的时候，工厂也发生了很大的变化。',
  '我经历过下岗，那段时间很困难。',
  '下岗后我做过很多工作，卖过菜，做过保安。',
  '我的妻子一直很支持我，陪我度过了难关。',
  '后来我在一个物业公司找到了工作。',
  '在物业公司我工作了二十年，直到退休。',
  '我们搬过几次家，最后定居在这个城市。',
  '我很喜欢这个城市，这里有我们的回忆。',
  '我的儿子现在在北京工作，是个工程师。',
  '女儿在本地，是个老师。',
  '我们经常一起吃饭，一家人很和睦。',
  '我最喜欢的是和孙子孙女一起玩。',
  '现在我退休了，每天都很充实。',
  '我喜欢散步，喜欢看书，喜欢和朋友聊天。',
  '我们经常去公园散步，那里有很多老朋友。',
  '我参加了一个老年大学，学了书法。',
  '书法让我的生活更有意义。',
  '我还学过太极拳，对身体很有好处。',
  '我的健康状况还不错，医生说我保养得很好。',
  '我最大的遗憾是没有多陪陪父母。',
  '父母已经去世了，我很想念他们。',
  '我经常会想起小时候的事情。',
  '那时候虽然穷，但是很快乐。',
  '我觉得现在的生活比以前好多了。',
  '但是我也很怀念过去的日子。',
  '我想把这些回忆记录下来，留给孩子们。',
  '希望他们能够了解我们这一代人的故事。',
  '我们经历了很多，从贫穷到现在的生活。',
  '这个过程中有很多艰辛，但也有很多快乐。',
  '我很感谢我的妻子，她一直在我身边。',
  '我也很感谢我的孩子们，他们很孝顺。',
];

async function main() {
  try {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        real_name: '测试用户',
        age: 65,
        active_deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      },
    });

    console.log('✓ 创建用户:', user.id);

    // 创建测试会话
    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        baseSlotsTotal: 50,
        baseSlotsUsed: testAnswers.length,
      },
    });

    console.log('✓ 创建会话:', session.id);

    // 插入测试答案
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
    console.log('\n快速测试数据已生成！');
    console.log(`用户 ID: ${user.id}`);
    console.log(`会话 ID: ${session.id}`);
    console.log('\n现在可以在浏览器中访问预览页面：');
    console.log(`http://localhost:3000/preview?sessionId=${session.id}`);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
