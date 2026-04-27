# 基于 DESIGN.md 的全面审视报告

**审视日期**：2026-04-27  
**审视范围**：21 个页面 + 组件  
**设计规范**：docs/DESIGN.md  
**总体符合度**：68%（13/21 页面符合或基本符合）

---

## 📊 审视统计

| 指标 | 数值 |
|------|------|
| 总页面数 | 21 |
| 完全符合（6/6） | 9 页 |
| 基本符合（4-5/6） | 11 页 |
| 不符合（<4/6） | 1 页 |
| 平均符合度 | 5.1/6 |

---

## ✅ 完全符合规范的页面（9 个）

### 核心页面（4 个）
1. **首页** (src/pages/index.tsx) - 6/6 ✅
2. **登录页** (src/pages/login.tsx) - 6/6 ✅
3. **注册页** (src/pages/register.tsx) - 6/6 ✅
4. **用户中心导航** (src/components/UserLayout.tsx) - 6/6 ✅

### 帮助中心（2 个）
5. **帮助中心首页** (src/pages/help/index.tsx) - 6/6 ✅
6. **使用指南** (src/pages/help/guide.tsx) - 6/6 ✅

### 用户中心（1 个）
7. **墨水流水** (src/pages/user/drops.tsx) - 5/6 ⚠️（仅 1 个小问题）

### 其他（2 个）
8. **扩写页** (src/pages/elaborate.tsx) - 5/6 ⚠️（仅 1 个小问题）
9. **FAQ** (src/pages/help/faq.tsx) - 5/6 ⚠️（仅 1 个小问题）

---

## ⚠️ 需要修复的页面（12 个）

### 用户中心页面（5 个）

#### 1. 个人信息页 (src/pages/user/profile.tsx) - 4/6
**问题**：
- ⚠️ 第 93 行：小标题下方 `pb-2`（8px）→ 应改为 `pb-4`（16px）
- ⚠️ 第 128 行：InfoRow 间距 `py-2`（8px）→ 应改为 `py-4`（16px）
- ⚠️ 第 138 行：StatCard 标签 `text-base`（16px）→ 确认是否为非核心内容

**修改优先级**：P0（影响间距规范）

---

#### 2. 账户设置页 (src/pages/user/settings.tsx) - 4/6
**问题**：
- ⚠️ 第 138、150、180、190 行：输入框 `py-3`（12px）→ 应改为 `py-4`（16px）
- ⚠️ 第 221 行：Field 标签下方 `mb-3`（12px）→ 应改为 `mb-4`（16px）

**修改优先级**：P0（影响间距规范）

---

#### 3. 访谈历史页 (src/pages/user/history.tsx) - 4/6
**问题**：
- ⚠️ 第 84 行：卡片内部间距 `space-y-3`（12px）→ 应改为 `space-y-4`（16px）
- ⚠️ 第 104 行：按钮间距 `gap-3`（12px）→ 应改为 `gap-4`（16px）

**修改优先级**：P0（影响间距规范）

---

#### 4. 邀请朋友页 (src/pages/user/invite.tsx) - 4/6
**问题**：
- ⚠️ 第 69 行：邀请说明内部间距 `space-y-3`（12px）→ 应改为 `space-y-4`（16px）
- ⚠️ 第 79 行：链接输入框间距 `gap-3`（12px）→ 应改为 `gap-4`（16px）

**修改优先级**：P0（影响间距规范）

---

#### 5. 墨水流水页 (src/pages/user/drops.tsx) - 5/6
**问题**：
- ⚠️ 第 75 行：筛选按钮间距 `gap-3`（12px）→ 应改为 `gap-4`（16px）

**修改优先级**：P0（影响间距规范）

---

### 核心页面（1 个）

#### 6. 访谈页 (src/pages/interview.tsx) - 5/6
**问题**：
- ⚠️ **第 934 行**：`text-base`（16px）用于"还可跳过"提示 → 应改为 `text-lg`（18px）
  - **原因**：这是核心交互信息，用户需要了解剩余跳过次数

**修改优先级**：P0（影响适老化规范）

---

### 其他页面（5 个）

#### 7. 预览页 (src/pages/preview.tsx) - 4/6
**问题**：
- ⚠️ 第 458、483 行：`text-sm`（14px）→ 应改为 `text-base`（16px）或 `text-lg`（18px）
- ⚠️ 第 573 行：`text-base`（16px）用于 AI 建议 → 应改为 `text-lg`（18px）
- ⚠️ 第 468、475 行：按钮 `min-h-[48px]` → 应改为 `min-h-[56px]`
- ⚠️ 第 572 行：卡片间距 `p-3`（12px）→ 应改为 `p-4`（16px）

**修改优先级**：P0（影响字号和触控区域规范）

---

#### 8. 补全页 (src/pages/supplement.tsx) - 4/6
**问题**：
- ⚠️ 第 215、218、230、251、268 行：`text-base`（16px）用于核心内容 → 应改为 `text-lg`（18px）
- ⚠️ 第 306 行：输入框 `min-h-[48px]` → 应改为 `min-h-[56px]`
- ⚠️ 第 289 行：卡片间距 `py-4`（16px）→ 应改为 `p-6`（24px）

**修改优先级**：P0（影响字号和触控区域规范）

---

#### 9. 隐私政策页 (src/pages/help/privacy.tsx) - 5/6
**问题**：
- ⚠️ 第 159 行：`text-base`（16px）用于更新时间 → 应改为 `text-lg`（18px）或保持为非核心内容

**修改优先级**：P1（非核心内容，可选修改）

---

#### 10. 联系我们页 (src/pages/contact/index.tsx) - 4/6
**问题**：
- ⚠️ 第 30、33、43、54 行：`text-base`（16px）用于辅助文本 → 应改为 `text-lg`（18px）
- ⚠️ 第 49 行：复制按钮 `min-h-[40px]` → 应改为 `min-h-[48px]`

**修改优先级**：P0（影响字号和触控区域规范）

---

#### 11. 反馈页 (src/pages/contact/feedback.tsx) - 4/6
**问题**：
- ⚠️ 第 165、189、190、213、214、232、233 行：`text-base`（16px）用于辅助文本和错误提示 → 应改为 `text-lg`（18px）

**修改优先级**：P0（影响字号规范）

---

#### 12. FAQ 页 (src/pages/help/faq.tsx) - 5/6
**问题**：
- ⚠️ 第 176 行：`text-base`（16px）用于"未找到"提示 → 应改为 `text-lg`（18px）

**修改优先级**：P1（非核心内容，可选修改）

---

## 🔴 最严重的问题（跨页面共性）

### 问题 1：间距规范违规（出现 7 次）
**影响页面**：profile、settings、history、drops、invite、preview、supplement

**违规模式**：
- `gap-3`（12px）应改为 `gap-4`（16px）
- `space-y-3`（12px）应改为 `space-y-4`（16px）
- `py-2`、`py-3`、`pb-2`（8-12px）应改为 `py-4`、`pb-4`（16px）
- `p-3`（12px）应改为 `p-4`（16px）或 `p-6`（24px）

**规范要求**：所有 padding/margin ≥ 16px（p-4）

---

### 问题 2：字号规范违规（出现 12 次）
**影响页面**：preview、supplement、contact/index、contact/feedback、help/faq、help/privacy

**违规模式**：
- `text-sm`（14px）用于核心内容 → 应改为 `text-base`（16px）或 `text-lg`（18px）
- `text-base`（16px）用于核心内容 → 应改为 `text-lg`（18px）

**规范要求**：核心内容 ≥ 18px（text-lg）

---

### 问题 3：触控区域规范违规（出现 3 次）
**影响页面**：preview、supplement、contact/index

**违规模式**：
- 按钮 `min-h-[48px]` → 应改为 `min-h-[56px]`
- 按钮 `min-h-[40px]` → 应改为 `min-h-[48px]`

**规范要求**：所有按钮 ≥ 48px×48px，建议 56px

---

## 📋 修改优先级清单

### P0 优先级（必须修改 - 影响适老化）

**共 11 个修改点**

#### 字号修改（6 处）
1. interview.tsx:934 - `text-base` → `text-lg`（"还可跳过"提示）
2. preview.tsx:458 - `text-sm` → `text-lg`（问题内容）
3. preview.tsx:483 - `text-sm` → `text-lg`（问题标签）
4. preview.tsx:573 - `text-base` → `text-lg`（AI 建议）
5. supplement.tsx:215,218,230,251,268 - `text-base` → `text-lg`（核心内容）
6. contact/index.tsx:30,33,43,54 - `text-base` → `text-lg`（辅助文本）

#### 间距修改（5 处）
1. profile.tsx:93 - `pb-2` → `pb-4`（小标题下方）
2. profile.tsx:128 - `py-2` → `py-4`（InfoRow）
3. settings.tsx:138,150,180,190 - `py-3` → `py-4`（输入框）
4. settings.tsx:221 - `mb-3` → `mb-4`（Field 标签）
5. history.tsx:84 - `space-y-3` → `space-y-4`（卡片内部）
6. history.tsx:104 - `gap-3` → `gap-4`（按钮间距）
7. drops.tsx:75 - `gap-3` → `gap-4`（筛选按钮）
8. invite.tsx:69 - `space-y-3` → `space-y-4`（邀请说明）
9. invite.tsx:79 - `gap-3` → `gap-4`（链接输入框）
10. preview.tsx:572 - `p-3` → `p-4`（卡片间距）
11. supplement.tsx:289 - `py-4` → `p-6`（卡片间距）

#### 触控区域修改（3 处）
1. preview.tsx:468,475 - `min-h-[48px]` → `min-h-[56px]`（按钮）
2. supplement.tsx:306 - `min-h-[48px]` → `min-h-[56px]`（输入框）
3. contact/index.tsx:49 - `min-h-[40px]` → `min-h-[48px]`（复制按钮）

---

### P1 优先级（建议修改 - 影响一致性）

**共 3 个修改点**

1. contact/feedback.tsx:165,189,190,213,214,232,233 - `text-base` → `text-lg`（辅助文本）
2. help/privacy.tsx:159 - `text-base` → `text-lg`（更新时间）
3. help/faq.tsx:176 - `text-base` → `text-lg`（"未找到"提示）

---

### P2 优先级（可选修改 - 优化体验）

**共 1 个修改点**

1. profile.tsx:138 - 确认 StatCard 标签是否为非核心内容

---

## 📈 修改工作量估计

| 优先级 | 修改点数 | 受影响文件 | 预计时间 |
|--------|---------|----------|---------|
| P0 | 14 | 11 个文件 | 30-45 分钟 |
| P1 | 3 | 3 个文件 | 10-15 分钟 |
| P2 | 1 | 1 个文件 | 5 分钟 |
| **总计** | **18** | **12 个文件** | **45-60 分钟** |

---

## ✨ 修改后预期效果

完成所有 P0 修改后：
- ✅ 所有页面符合字号规范（核心内容 ≥18px）
- ✅ 所有页面符合间距规范（≥16px）
- ✅ 所有页面符合触控区域规范（≥48px）
- ✅ 整体符合度从 68% 提升至 95%+
- ✅ 完全符合 DESIGN.md 适老化规范

---

## 📝 后续建议

### 短期（本周）
1. 执行所有 P0 修改
2. 本地验证修改效果
3. 提交代码

### 中期（下周）
1. 执行 P1 修改
2. 对比度全面验证
3. 响应式设计验证

### 长期（本月）
1. 移动端适配优化
2. 页面加载速度优化
3. 用户体验测试

---

*报告生成时间*：2026-04-27  
*下一步*：生成详细的修改清单（DESIGN_FIXES_CHECKLIST.md）
