import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface FeedbackRequest {
  type: string;
  title: string;
  content: string;
  contactInfo: string;
}

interface FeedbackResponse {
  success: boolean;
  feedbackId?: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { type, title, content, contactInfo } = req.body as FeedbackRequest;

    // 验证必填字段
    if (!type || !title || !content || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    // 验证字段长度
    if (title.trim().length < 20 || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: '标题需要 20-100 字',
      });
    }

    if (content.trim().length < 20 || content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: '内容需要 20-1000 字',
      });
    }

    // 验证联系方式格式
    const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (
      !contactInfo.trim() ||
      (!emailRegex.test(contactInfo) && !phoneRegex.test(contactInfo))
    ) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱或手机号',
      });
    }

    // 保存到数据库
    const feedback = await prisma.feedback.create({
      data: {
        userId: 'anonymous', // 暂时使用 anonymous，后续可改为真实用户 ID
        type,
        title,
        content,
        contactInfo,
        status: 'pending',
      },
    });

    return res.status(201).json({
      success: true,
      feedbackId: feedback.id,
      message: '反馈已成功提交',
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试',
    });
  }
}
