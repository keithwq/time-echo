import type { NextApiRequest, NextApiResponse } from 'next';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import handler from '@/pages/api/interview/generate';
import { questionTemplates } from '@/data/question-templates';

type MockResponse = NextApiResponse & {
  statusCode?: number;
  jsonBody?: any;
};

function createMockResponse(): MockResponse {
  const response = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.jsonBody = payload;
      return this;
    },
  } as MockResponse;

  return response;
}

describe('Generate Memoir Session Completion', () => {
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    const now = Date.now();
    const question = questionTemplates.find((item) => item.phase === 'base') ?? questionTemplates[0];

    const user = await prisma.user.create({
      data: {
        real_name: '生成测试用户',
        role: 'USER',
        ink_balance: 50,
        extensionDropsRemaining: 10,
        active_deadline: new Date(now + 99 * 24 * 60 * 60 * 1000),
        protection_end: new Date(now + 189 * 24 * 60 * 60 * 1000),
        destruction_date: new Date(now + 190 * 24 * 60 * 60 * 1000),
      },
    });
    testUserId = user.id;

    const session = await prisma.interviewSession.create({
      data: {
        userId: testUserId,
        baseSlotsTotal: 50,
        baseSlotsUsed: 1,
        skippedCount: 0,
        isCompleted: false,
        isGenerated: false,
      },
    });
    testSessionId = session.id;

    await prisma.interviewAnswer.create({
      data: {
        userId: testUserId,
        sessionId: testSessionId,
        questionId: question.id,
        questionContent: question.content,
        content: '我小时候在村里长大，最记得的是夏天在院子里乘凉。',
        topicTag: question.stageTag,
        sourceQuestionMode: 'switch_topic',
      },
    });
  });

  afterAll(async () => {
    await prisma.interviewAnswer.deleteMany({ where: { sessionId: testSessionId } });
    await prisma.interviewSession.deleteMany({ where: { id: testSessionId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('marks the session as generated and completed after memoir generation', async () => {
    const request = {
      method: 'POST',
      body: {
        userId: testUserId,
        sessionId: testSessionId,
      },
    } as NextApiRequest;

    const response = createMockResponse();

    await handler(request, response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonBody?.success).toBe(true);

    const session = await prisma.interviewSession.findUnique({
      where: { id: testSessionId },
      select: {
        isGenerated: true,
        isCompleted: true,
      },
    });

    expect(session?.isGenerated).toBe(true);
    expect(session?.isCompleted).toBe(true);
  });
});
