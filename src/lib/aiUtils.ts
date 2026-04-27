import { getAIClient, getModelName } from './aiClient';

interface MemoirSection {
  stage: string;
  title: string;
  content: string;
}

interface Memoir {
  title: string;
  sections: MemoirSection[];
  wordCount: number;
  generatedAt: string;
}

/**
 * 调用 AI 生成或改写回忆录内容
 * 基于已聚合的回忆录初稿，进行 AI 改写以提升文采和连贯性
 */
export async function generateMemoirContent(
  memoir: Memoir,
  _userName: string = '您'
): Promise<string> {
  console.log('[generateMemoirContent] 开始生成');
  console.log('[generateMemoirContent] 回忆录章节数:', memoir.sections.length);

  const client = getAIClient();
  const model = getModelName();

  console.log('[generateMemoirContent] 使用模型:', model);

  const memoirText = memoir.sections
    .map((section) => `## ${section.title}\n\n${section.content}`)
    .join('\n\n---\n\n');

  console.log('[generateMemoirContent] 回忆录文本长度:', memoirText.length, '字符');

  const prompt = `你是一位专业的传记作家。请根据以下初稿回忆录，进行改写和优化，使其更具文采、更连贯、更有感染力。

要求：
1. 保留所有原始信息和事实
2. 改进表达方式，使其更生动、更有文采
3. 增强段落之间的连贯性和逻辑性
4. 保持原有的人物声音和情感基调
5. 字数控制在 2000 字左右

原始初稿：

${memoirText}

请直接输出改写后的回忆录，不需要任何前言或说明。`;

  console.log('[generateMemoirContent] Prompt 长度:', prompt.length, '字符');

  try {
    console.log('[generateMemoirContent] 开始调用 API...');
    const response = await client.chat.completions.create({
      model,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('[generateMemoirContent] API 调用成功');
    console.log('[generateMemoirContent] 响应结构:', JSON.stringify(response, null, 2).substring(0, 500));

    // 检查响应格式
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      console.error('[generateMemoirContent] 响应格式错误:', response);
      throw new Error('Invalid response format: choices is empty or undefined');
    }

    const message = response.choices[0].message;
    if (!message) {
      console.error('[generateMemoirContent] message 不存在:', response.choices[0]);
      throw new Error('Invalid response format: message is undefined');
    }

    // 处理 DeepSeek 推理模型的响应格式
    const content = message.content || (message as any).reasoning_content;

    if (content) {
      console.log('[generateMemoirContent] 生成内容长度:', content.length, '字符');
      return content;
    }

    console.error('[generateMemoirContent] content 不存在:', message);
    throw new Error('Unexpected response format from AI: no content found');
  } catch (error) {
    console.error('[generateMemoirContent] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    throw error;
  }
}

/**
 * 调用 AI 改写题目和选项，使其更贴近用户上下文
 */
export async function rewriteQuestion(
  originalQuestion: string,
  originalOptions: Array<{ label: string; value: string }> | undefined,
  userContext: string,
  previousAnswers: string[]
): Promise<{ question: string; options?: Array<{ label: string; value: string }> }> {
  const client = getAIClient();
  const model = getModelName();

  const previousContext = previousAnswers.slice(-3).join('\n\n');

  const optionsText = originalOptions && originalOptions.length > 0
    ? `\n\n原始选项：\n${originalOptions.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt.label}`).join('\n')}`
    : '';

  const prompt = `你是一位专业的访谈师。请根据用户的背景信息和之前的回答，改写以下问题和选项，使其更贴近用户的实际情况。

用户背景：
${userContext}

用户之前的回答（最近 3 条）：
${previousContext}

原始问题：
${originalQuestion}${optionsText}

要求：
1. 保留问题的核心意图和逻辑结构
2. 根据用户背景调整问题中的关键词（如职业、身份、环境等）
3. 如果有选项，也要相应调整选项的表述，保持逻辑一致
4. 使用更贴近用户生活的表述
5. 避免过于正式或生硬的语言
6. 问题应该简洁、清晰、容易理解

请按以下格式输出：
问题：[改写后的问题]
${originalOptions && originalOptions.length > 0 ? `选项：
A. [改写后的选项A]
B. [改写后的选项B]
C. [改写后的选项C]
${originalOptions.length > 3 ? originalOptions.slice(3).map((_, i) => `${String.fromCharCode(68 + i)}. [改写后的选项${String.fromCharCode(68 + i)}]`).join('\n') : ''}` : ''}`;

  try {
    console.log('[rewriteQuestion] 开始调用 API，模型:', model);
    const response = await client.chat.completions.create({
      model,
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('[rewriteQuestion] API 响应成功');

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('No message in response');
    }

    // 处理 DeepSeek 推理模型的响应格式
    const content = message.content || (message as any).reasoning_content;

    if (!content) {
      throw new Error('No content in message');
    }

    const text = content.trim();
    const questionMatch = text.match(/问题：(.+?)(?:\n|$)/);
    const question = questionMatch ? questionMatch[1].trim() : text;

    // 解析改写后的选项
    let options: Array<{ label: string; value: string }> | undefined;
    if (originalOptions && originalOptions.length > 0) {
      options = [];
      for (let i = 0; i < originalOptions.length; i++) {
        const optionLetter = String.fromCharCode(65 + i);
        const optionMatch = text.match(new RegExp(`${optionLetter}\\.\\s*(.+?)(?:\n|$)`));
        if (optionMatch) {
          options.push({
            label: optionMatch[1].trim(),
            value: originalOptions[i].value,
          });
        } else {
          options.push(originalOptions[i]);
        }
      }
    }

    console.log('[rewriteQuestion] 改写成功');
    return { question, options };
  } catch (error) {
    console.error('[rewriteQuestion] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * 调用 AI 生成新题目
 */
export async function generateNewQuestion(
  userContext: string,
  previousAnswers: string[],
  currentStage: string,
  gapType?: string
): Promise<{ question: string; hint: string }> {
  const client = getAIClient();
  const model = getModelName();

  const previousContext = previousAnswers.slice(-5).join('\n\n');

  const gapDescription = gapType
    ? `\n\n缺口类型：${gapType}（需要补充这方面的内容）`
    : '';

  const prompt = `你是一位专业的访谈师。请根据用户的背景信息、之前的回答和当前的人生阶段，生成一个新的访谈问题。

用户背景：
${userContext}

用户之前的回答（最近 5 条）：
${previousContext}

当前人生阶段：${currentStage}${gapDescription}

要求：
1. 问题应该自然承接之前的对话
2. 问题应该帮助用户回忆更多细节
3. 避免过于正式或生硬的语言
4. 问题应该简洁、清晰、容易理解
5. 提供一个简短的提示（hint），帮助用户理解问题的意图

请按以下格式输出：
问题：[问题内容]
提示：[提示内容]`;

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Unexpected response format from AI');
    }

    const text = content.trim();
    const questionMatch = text.match(/问题：(.+?)(?:\n|$)/);
    const hintMatch = text.match(/提示：(.+?)(?:\n|$)/);

    const question = questionMatch ? questionMatch[1].trim() : text;
    const hint = hintMatch ? hintMatch[1].trim() : '请根据你的真实经历回答。';

    return { question, hint };
  } catch (error) {
    console.error('Error generating new question:', error);
    throw error;
  }
}

/**
 * 生成人生小传的修改建议
 * 分析当前内容，提供 3-5 条改进建议
 */
export async function suggestImprovements(memoirContent: string): Promise<string[]> {
  const client = getAIClient();
  const model = getModelName();

  const prompt = `你是一位专业的传记编辑。请分析以下人生小传，提供 3-5 条具体的改进建议。

建议应该包括：
1. 内容缺口（缺少关键人物、地点、事件等）
2. 表达优化（语句不通顺、重复表述等）
3. 情感深度（可以更深入的地方）

要求：
- 每条建议简洁明了，不超过 30 字
- 建议应该是可操作的
- 优先级从高到低排列

人生小传内容：

${memoirContent}

请按以下格式输出，每行一条建议：
1. [建议内容]
2. [建议内容]
...`;

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Unexpected response format from AI');
    }

    // 解析建议列表
    const suggestions = content
      .split('\n')
      .filter((line: string) => line.match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 5); // 最多 5 条

    return suggestions.length > 0 ? suggestions : ['请继续完善您的人生小传。'];
  } catch (error) {
    console.error('Error suggesting improvements:', error);
    throw error;
  }
}
