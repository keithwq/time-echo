export interface FollowupQuestion {
  id: string;
  content: string;
  options?: AnswerOption[];
  answerMode: 'single' | 'multi' | 'text';
  required?: boolean;
}

export interface AnswerOption {
  label: string;
  value: string;
  allowCustom?: boolean;
  followupQuestions?: FollowupQuestion[];
}

export interface ChoiceQuestionLike {
  options?: AnswerOption[];
  answerMode?: 'single' | 'multi' | 'text' | 'hybrid';
  minChoices?: number;
  maxChoices?: number;
  allowTextDetails?: boolean;
}

export interface FollowupDraft {
  selectedOptions: string[];
  textAnswer: string;
  customAnswer: string;
}

export interface ActiveFollowup {
  parentOption: AnswerOption;
  question: FollowupQuestion;
}

export function getSelectedOptions(
  question: ChoiceQuestionLike,
  selectedValues: string[]
): AnswerOption[] {
  if (!question.options?.length) {
    return [];
  }

  const selectedSet = new Set(selectedValues);
  return question.options.filter((option) => selectedSet.has(option.value));
}

export function optionRequiresCustomInput(option: AnswerOption): boolean {
  return option.allowCustom === true;
}

export function shouldShowChoiceDetailInput(
  question: ChoiceQuestionLike,
  selectedValues: string[]
): boolean {
  if (!question.options?.length) {
    return false;
  }

  if (question.allowTextDetails && selectedValues.length > 0) {
    return true;
  }

  return getSelectedOptions(question, selectedValues).some(optionRequiresCustomInput);
}

export function buildChoiceAnswer(
  question: ChoiceQuestionLike,
  selectedValues: string[],
  detailText: string
): string {
  const selectedLabels = getSelectedOptions(question, selectedValues).map((option) => option.label);
  const trimmedDetail = detailText.trim();

  if (selectedLabels.length === 0) {
    return trimmedDetail;
  }

  if (!trimmedDetail) {
    return selectedLabels.join('、');
  }

  return `${selectedLabels.join('、')}。补充：${trimmedDetail}`;
}

export function collectActiveFollowups(
  question: ChoiceQuestionLike,
  selectedValues: string[]
): ActiveFollowup[] {
  const activeFollowups: ActiveFollowup[] = [];

  for (const option of getSelectedOptions(question, selectedValues)) {
    for (const followupQuestion of option.followupQuestions || []) {
      activeFollowups.push({
        parentOption: option,
        question: followupQuestion,
      });
    }
  }

  return activeFollowups;
}

export function buildFollowupAnswer(
  question: FollowupQuestion,
  draft: FollowupDraft | undefined
): string {
  if (!draft) {
    return '';
  }

  if (question.answerMode === 'text') {
    return draft.textAnswer.trim();
  }

  return buildChoiceAnswer(question, draft.selectedOptions, draft.customAnswer);
}

export function isFollowupAnswered(
  question: FollowupQuestion,
  draft: FollowupDraft | undefined
): boolean {
  if (!draft) {
    return false;
  }

  if (question.answerMode === 'text') {
    return draft.textAnswer.trim().length > 0;
  }

  if (draft.selectedOptions.length === 0) {
    return false;
  }

  const selectedOptions = getSelectedOptions(question, draft.selectedOptions);
  const needsCustomText = selectedOptions.some(optionRequiresCustomInput);
  if (needsCustomText && !draft.customAnswer.trim()) {
    return false;
  }

  return true;
}

export function areActiveFollowupsComplete(
  question: ChoiceQuestionLike,
  selectedValues: string[],
  drafts: Record<string, FollowupDraft>
): boolean {
  return collectActiveFollowups(question, selectedValues).every(({ question: followupQuestion }) => {
    if (followupQuestion.required === false) {
      return true;
    }

    return isFollowupAnswered(followupQuestion, drafts[followupQuestion.id]);
  });
}

export function serializeNestedAnswers(
  question: ChoiceQuestionLike,
  selectedValues: string[],
  drafts: Record<string, FollowupDraft>
): Record<string, Record<string, string>> {
  const serialized: Record<string, Record<string, string>> = {};

  for (const option of getSelectedOptions(question, selectedValues)) {
    if (!option.followupQuestions?.length) {
      continue;
    }

    const followupAnswers: Record<string, string> = {};

    for (const followupQuestion of option.followupQuestions) {
      const answer = buildFollowupAnswer(followupQuestion, drafts[followupQuestion.id]);
      if (answer) {
        followupAnswers[followupQuestion.id] = answer;
      }
    }

    if (Object.keys(followupAnswers).length > 0) {
      serialized[option.value] = followupAnswers;
    }
  }

  return serialized;
}
