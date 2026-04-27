import { describe, expect, it } from '@jest/globals';
import { getQuestionById } from '@/data/question-templates';

describe('question template regressions', () => {
  it('broadens childhood chores question beyond labor-only assumptions', () => {
    const question = getQuestionById('childhood_008');

    expect(question?.content).toContain('家里通常会让您做些什么');
    expect(question?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining(['studying', 'training', 'family_business', 'little_housework'])
    );
  });

  it('makes education question cover multiple learning paths instead of yes/no schooling only', () => {
    const question = getQuestionById('childhood_012');

    expect(question?.answerMode).toBe('multi');
    expect(question?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining(['home_or_private', 'college', 'further_study', 'no_formal_school'])
    );
  });

  it('treats important people as a category broader than spouse only', () => {
    const question = getQuestionById('family_001');

    expect(question?.answerMode).toBe('multi');
    expect(question?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining(['partner', 'children', 'parents_or_elders', 'friends_or_colleagues'])
    );
    expect(question?.options.map((option) => option.value)).not.toEqual(
      expect.arrayContaining(['yes', 'no'])
    );
  });

  it('adds timing follow-ups to technology first-seen question', () => {
    const question = getQuestionById('era_003');
    const televisionOption = question?.options.find((option) => option.value === 'television');

    expect(televisionOption?.followupQuestions?.[0]?.content).toContain('大概是在什么时候');
    expect(televisionOption?.followupQuestions?.[0]?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining(['childhood', 'youth', 'middle_age', 'later'])
    );
  });
});
