import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { extractEntities, inferTopicTag, inferEmotionTag, type ExtractedEntities } from '@/lib/extraction';

/**
 * 从实体抽取结果推断人口统计学标签
 */
function inferDemographicTags(entities: ExtractedEntities): string[] {
  const tags: string[] = [];

  // 地域标签
  if (entities.placeInfo.birthPlace.length > 0) {
    entities.placeInfo.birthPlace.forEach(place => {
      if (place.includes('东北') || place.includes('黑龙江') || place.includes('吉林') || place.includes('辽宁')) {
        tags.push('#东北');
      }
      if (place.includes('华北') || place.includes('北京') || place.includes('天津') || place.includes('河北')) {
        tags.push('#华北');
      }
      if (place.includes('华东') || place.includes('上海') || place.includes('江苏') || place.includes('浙江')) {
        tags.push('#华东');
      }
      if (place.includes('华南') || place.includes('广东') || place.includes('广西') || place.includes('福建')) {
        tags.push('#华南');
      }
      if (place.includes('西南') || place.includes('四川') || place.includes('重庆') || place.includes('云南')) {
        tags.push('#西南');
      }
      if (place.includes('西北') || place.includes('陕西') || place.includes('甘肃') || place.includes('新疆')) {
        tags.push('#西北');
      }
      if (place.includes('华中') || place.includes('湖北') || place.includes('湖南') || place.includes('河南')) {
        tags.push('#华中');
      }
    });
  }

  // 城乡背景
  if (entities.placeInfo.birthPlace.some(p => p.includes('村') || p.includes('乡') || p.includes('镇'))) {
    tags.push('#农村成长');
  }
  if (entities.placeInfo.birthPlace.some(p => p.includes('市') || p.includes('区') || p.includes('街道'))) {
    tags.push('#城市成长');
  }

  // 职业标签
  if (entities.identityInfo.occupations.includes('工人')) tags.push('#工厂');
  if (entities.identityInfo.occupations.includes('农民')) tags.push('#务农');
  if (entities.identityInfo.occupations.includes('教师')) tags.push('#教师');
  if (entities.identityInfo.occupations.includes('医生') || entities.identityInfo.occupations.includes('护士')) {
    tags.push('#医疗');
  }
  if (entities.identityInfo.occupations.includes('军人')) tags.push('#参军');
  if (entities.identityInfo.occupations.includes('干部')) tags.push('#干部');

  // 时代事件标签
  if (entities.timeInfo.eraMarkers.includes('恢复高考')) tags.push('#恢复高考');
  if (entities.timeInfo.eraMarkers.includes('上山下乡')) tags.push('#上山下乡');
  if (entities.timeInfo.eraMarkers.includes('改革开放')) tags.push('#改革开放初期');
  if (entities.timeInfo.eraMarkers.includes('下岗')) tags.push('#下岗');

  return [...new Set(tags)];
}

/**
 * POST /api/interview/answer
 * 保存回答 + 更新访谈状态
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    userId,
    sessionId,
    questionId,
    questionContent,
    answer,
    selectedOption,
    customAnswer,
    topicTag,
    sourceQuestionMode,
    nestedAnswers,
  } = req.body;

  if (!userId || !sessionId || !questionId || !answer) {
    return res.status(400).json({
      success: false,
      error: 'userId, sessionId, questionId, and answer are required',
    });
  }

  try {
    // 结构化实体抽取
    const entities = extractEntities(answer);
    const inferredTopicTag = inferTopicTag(entities);
    const inferredEmotionTag = inferEmotionTag(entities);

    // 原子事务：保存回答 + 更新会话状态 + 更新记忆画像
    const result = await prisma.$transaction(async (tx) => {
      // 保存回答
      const interviewAnswer = await tx.interviewAnswer.create({
        data: {
          userId,
          sessionId,
          questionId,
          questionContent: questionContent || '',
          content: answer,
          selectedOption: selectedOption || null,
          customAnswer: customAnswer || null,
          sourceQuestionMode: sourceQuestionMode || 'extend_topic',
          topicTag: topicTag || inferredTopicTag,
          emotionTag: inferredEmotionTag,
          extractedEntities: entities as any,
          nestedAnswers: nestedAnswers || null,
        },
      });

      // 更新访谈会话状态
      // 注意：深挖题（ID 以 deepdive_ 开头）不消耗基础题位
      const isDeepDiveQuestion = questionId.startsWith('deepdive_');
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (!isDeepDiveQuestion) {
        updateData.baseSlotsUsed = { increment: 1 };
      }
      const updatedSession = await tx.interviewSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      // 注意：不在这里自动设置 isCompleted
      // 用户可以选择"生成当前版本"或"开启扩展包"
      // 只有当用户明确调用生成 API 时，才设置 isCompleted: true

      // 更新或创建 MemoryProfile
      const existingProfile = await tx.memoryProfile.findUnique({
        where: { userId },
      });

      const updatedDemographicTags = existingProfile
        ? [...new Set([...(existingProfile.demographicTags || []), ...inferDemographicTags(entities)])]
        : inferDemographicTags(entities);

      const updatedCoveredTopics = existingProfile
        ? [...new Set([...(existingProfile.coveredTopics || []), ...(inferredTopicTag ? [inferredTopicTag] : [])])]
        : (inferredTopicTag ? [inferredTopicTag] : []);

      const updatedKeyLifeEvents = existingProfile
        ? [...new Set([...(existingProfile.keyLifeEvents || []), ...entities.timeInfo.eraMarkers, ...entities.eventInfo.turningPoints])]
        : [...entities.timeInfo.eraMarkers, ...entities.eventInfo.turningPoints];

      const updatedPeopleMentions = existingProfile
        ? [...new Set([...(existingProfile.peopleMentions || []), ...entities.peopleInfo.family, ...entities.peopleInfo.colleagues, ...entities.peopleInfo.friends])]
        : [...entities.peopleInfo.family, ...entities.peopleInfo.colleagues, ...entities.peopleInfo.friends];

      const updatedPlaceMentions = existingProfile
        ? [...new Set([...(existingProfile.placeMentions || []), ...entities.placeInfo.birthPlace, ...entities.placeInfo.residences, ...entities.placeInfo.workPlaces])]
        : [...entities.placeInfo.birthPlace, ...entities.placeInfo.residences, ...entities.placeInfo.workPlaces];

      const updatedEmotionTags = existingProfile
        ? [...new Set([...(existingProfile.emotionTags || []), ...entities.emotionInfo.positive, ...entities.emotionInfo.negative, ...entities.emotionInfo.complex])]
        : [...entities.emotionInfo.positive, ...entities.emotionInfo.negative, ...entities.emotionInfo.complex];

      await tx.memoryProfile.upsert({
        where: { userId },
        create: {
          userId,
          demographicTags: updatedDemographicTags,
          coveredTopics: updatedCoveredTopics,
          keyLifeEvents: updatedKeyLifeEvents,
          peopleMentions: updatedPeopleMentions,
          placeMentions: updatedPlaceMentions,
          emotionTags: updatedEmotionTags,
          currentStateSummary: null,
        },
        update: {
          demographicTags: updatedDemographicTags,
          coveredTopics: updatedCoveredTopics,
          keyLifeEvents: updatedKeyLifeEvents,
          peopleMentions: updatedPeopleMentions,
          placeMentions: updatedPlaceMentions,
          emotionTags: updatedEmotionTags,
        },
      });

      return {
        answer: interviewAnswer,
        session: updatedSession,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        answerId: result.answer.id,
        baseSlotsUsed: result.session.baseSlotsUsed,
        baseSlotsTotal: result.session.baseSlotsTotal,
        skippedCount: result.session.skippedCount,
        message: '回答已保存',
      },
    });
  } catch (error) {
    console.error('Save answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
