import { describe, expect, it } from '@jest/globals';
import {
  areActiveFollowupsComplete,
  buildChoiceAnswer,
  collectActiveFollowups,
  serializeNestedAnswers,
  type FollowupDraft,
} from '@/lib/interviewAnswer';

const sampleQuestion = {
  answerMode: 'multi' as const,
  allowTextDetails: true,
  options: [
    {
      label: '砖瓦房',
      value: 'brick_house',
      followupQuestions: [
        {
          id: 'childhood_001_brick_1',
          content: '有几间房？',
          answerMode: 'single' as const,
          options: [
            { label: '1间', value: 'one' },
            { label: '2间', value: 'two' },
          ],
        },
      ],
    },
    {
      label: '其他',
      value: 'other',
      allowCustom: true,
    },
  ],
};

describe('interview answer helpers', () => {
  it('builds choice answers from visible labels instead of internal values', () => {
    const answer = buildChoiceAnswer(sampleQuestion, ['brick_house', 'other'], '带院子的老房子');
    expect(answer).toBe('砖瓦房、其他。补充：带院子的老房子');
  });

  it('collects active follow-up questions from selected options', () => {
    const activeFollowups = collectActiveFollowups(sampleQuestion, ['brick_house']);
    expect(activeFollowups).toHaveLength(1);
    expect(activeFollowups[0].question.id).toBe('childhood_001_brick_1');
  });

  it('requires visible follow-ups to be answered before submit', () => {
    const drafts: Record<string, FollowupDraft> = {};
    expect(areActiveFollowupsComplete(sampleQuestion, ['brick_house'], drafts)).toBe(false);

    drafts.childhood_001_brick_1 = {
      selectedOptions: ['two'],
      textAnswer: '',
      customAnswer: '',
    };

    expect(areActiveFollowupsComplete(sampleQuestion, ['brick_house'], drafts)).toBe(true);
  });

  it('serializes nested answers using the option value to group follow-up answers', () => {
    const drafts: Record<string, FollowupDraft> = {
      childhood_001_brick_1: {
        selectedOptions: ['two'],
        textAnswer: '',
        customAnswer: '',
      },
    };

    const serialized = serializeNestedAnswers(sampleQuestion, ['brick_house'], drafts);

    expect(serialized).toEqual({
      brick_house: {
        childhood_001_brick_1: '2间',
      },
    });
  });
});
