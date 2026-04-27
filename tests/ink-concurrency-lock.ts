/**
 * 并发锁测试
 * 验证 Prisma $transaction 防止双花攻击
 *
 * 场景：两个用户同时尝试接单同一个任务
 * 预期：只有一个用户能成功接单
 */

import { prisma } from '@/lib/prisma';

describe('Ink Concurrency Lock', () => {
  test('should prevent double-spending with concurrent transactions', async () => {
    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        real_name: 'Test User',
        ink_balance: 100,
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });

    // 模拟并发扣除
    const deductAmount = 50;
    const promises = [];

    for (let i = 0; i < 3; i++) {
      promises.push(
        prisma.$transaction(async (tx) => {
          const currentUser = await tx.user.findUnique({
            where: { id: user.id },
          });

          if (!currentUser || currentUser.ink_balance < deductAmount) {
            throw new Error('Insufficient balance');
          }

          return tx.user.update({
            where: { id: user.id },
            data: {
              ink_balance: {
                decrement: deductAmount,
              },
            },
          });
        })
      );
    }

    // 只有第一个和第二个应该成功，第三个应该失败
    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    expect(successful).toBe(2); // Only 2 should succeed (100 - 50 - 50 = 0)

    // 验证最终余额
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(finalUser?.ink_balance).toBe(0);

    // 清理
    await prisma.user.delete({
      where: { id: user.id },
    });
  });

  test('should handle task acceptance with status check', async () => {
    // 创建测试用户和任务
    const client = await prisma.user.create({
      data: {
        real_name: 'Client',
        ink_balance: 100,
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });

    const mentor1 = await prisma.user.create({
      data: {
        real_name: 'Mentor 1',
        role: 'WRITING_MENTOR',
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });

    const mentor2 = await prisma.user.create({
      data: {
        real_name: 'Mentor 2',
        role: 'WRITING_MENTOR',
        active_deadline: new Date(Date.now() + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(Date.now() + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(Date.now() + 190 * 24 * 60 * 60 * 1000),
      },
    });

    const task = await prisma.mutualAidTask.create({
      data: {
        clientId: client.id,
        locked_ink: 10,
        requirement_desc: 'Test task',
      },
    });

    // 两个导师同时尝试接单
    const acceptPromises = [
      prisma.mutualAidTask.updateMany({
        where: {
          id: task.id,
          status: 'PENDING',
        },
        data: {
          mentorId: mentor1.id,
          status: 'ONGOING',
        },
      }),
      prisma.mutualAidTask.updateMany({
        where: {
          id: task.id,
          status: 'PENDING',
        },
        data: {
          mentorId: mentor2.id,
          status: 'ONGOING',
        },
      }),
    ];

    const results = await Promise.all(acceptPromises);

    // 只有一个应该成功修改
    const totalModified = results.reduce((sum, r) => sum + r.count, 0);
    expect(totalModified).toBe(1);

    // 清理
    await prisma.mutualAidTask.delete({ where: { id: task.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [client.id, mentor1.id, mentor2.id] } },
    });
  });
});
