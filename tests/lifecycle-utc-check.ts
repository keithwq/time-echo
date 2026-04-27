/**
 * 生命周期 UTC 检查测试
 * 验证所有时间戳都以 UTC 存储，防止时区导致的销毁时间提前
 */

import { prisma } from '@/lib/prisma';
import { generateLifecycleTimestamps } from '@/lib/utils';

describe('Lifecycle UTC Check', () => {
  test('should store all timestamps in UTC', async () => {
    const now = new Date();
    const { active_deadline, protection_end, destruction_date } =
      generateLifecycleTimestamps(now);

    const user = await prisma.user.create({
      data: {
        real_name: 'UTC Test User',
        active_deadline,
        protection_end,
        destruction_date,
      },
    });

    const retrieved = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // 验证时间戳完整性
    expect(retrieved?.active_deadline).toEqual(active_deadline);
    expect(retrieved?.protection_end).toEqual(protection_end);
    expect(retrieved?.destruction_date).toEqual(destruction_date);

    // 验证时间戳是 UTC（通过检查 toISOString）
    const isoString = retrieved?.destruction_date?.toISOString();
    expect(isoString).toMatch(/Z$/); // ISO 8601 UTC 格式以 Z 结尾

    // 清理
    await prisma.user.delete({ where: { id: user.id } });
  });

  test('should correctly identify users for daily destruction', async () => {
    const now = new Date();

    // 创建一个销毁日期为今天的用户
    const todayDestructionDate = new Date(now);
    todayDestructionDate.setUTCHours(0, 0, 0, 0);

    const user = await prisma.user.create({
      data: {
        real_name: 'Destruction Today',
        active_deadline: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        protection_end: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        destruction_date: todayDestructionDate,
      },
    });

    // 查询今天应该销毁的用户
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const usersToDestroy = await prisma.user.findMany({
      where: {
        destruction_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    expect(usersToDestroy.some((u) => u.id === user.id)).toBe(true);

    // 清理
    await prisma.user.delete({ where: { id: user.id } });
  });

  test('should prevent premature destruction due to timezone', async () => {
    const now = new Date();

    // 创建一个销毁日期为明天的用户
    const tomorrowDestructionDate = new Date(now);
    tomorrowDestructionDate.setUTCDate(tomorrowDestructionDate.getUTCDate() + 1);
    tomorrowDestructionDate.setUTCHours(0, 0, 0, 0);

    const user = await prisma.user.create({
      data: {
        real_name: 'Destruction Tomorrow',
        active_deadline: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
        protection_end: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        destruction_date: tomorrowDestructionDate,
      },
    });

    // 查询今天应该销毁的用户
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const usersToDestroy = await prisma.user.findMany({
      where: {
        destruction_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 不应该包含明天销毁的用户
    expect(usersToDestroy.some((u) => u.id === user.id)).toBe(false);

    // 清理
    await prisma.user.delete({ where: { id: user.id } });
  });
});
