# 《时光回响》设计系统 v2.0 (DESIGN.md)

**项目**：时光回响 - 适老化回忆录生成平台  
**设计方向**：清晰易用 + 适老化优先  
**目标用户**：60+ 岁老年人  
**设计哲学**：清晰、温暖、易用

---

## 1. 视觉主题与氛围

### 核心气质
- **清晰易读**：高对比度、无衬线字体、清晰的视觉层级
- **温暖感**：柔和的红色点缀，人性化的交互反馈
- **易用性**：大字号、高对比、宽触控区、合理的信息密度
- **无压力感**：简洁界面、清晰的操作路径、充足的操作空间

### 设计原则
1. **适老化优先** - 所有决策都要考虑 60+ 用户的视力、认知、操作能力
2. **清晰第一** - 高对比度、大字号、无衬线字体
3. **信息合理** - 不过度留白，信息密度符合老年人习惯
4. **可访问性** - 符合 WCAG AAA 标准（对比度 ≥7:1）

---

## 2. 色彩系统

### 核心色彩令牌

| 令牌名 | 十六进制 | RGB | 用途 | 对比度 |
|--------|---------|-----|------|--------|
| `paper-base` | #FFFFFF | 255,255,255 | 主背景（纯白） | - |
| `paper-deep` | #F5F5F5 | 245,245,245 | 次级背景、卡片 | - |
| `ink-heavy` | #1A1A1A | 26,26,26 | 标题、正文（纯黑） | 21:1 |
| `ink-medium` | #666666 | 102,102,102 | 次要文本、标签 | 7.5:1 |
| `ink-wash` | #999999 | 153,153,153 | 禁用状态、占位符 | 4.5:1 |
| `seal-red` | #D32F2F | 211,47,47 | 核心按钮、警告 | 8.5:1 |

### 色彩使用规则
- **正文**：ink-heavy（#1A1A1A）on paper-base（纯黑 on 纯白）
- **次要文本**：ink-medium（#666666）on paper-base
- **禁用状态**：ink-wash（#999999）on paper-base
- **核心操作**：seal-red（#D32F2F）on paper-base
- **背景层级**：paper-base（#FFFFFF）> paper-deep（#F5F5F5）

### 禁止事项
- ❌ 不使用其他颜色（除非明确需要）
- ❌ 不使用透明度叠加（保持清晰）
- ❌ 不使用渐变（保持简洁）
- ❌ 不使用阴影（已在 Tailwind 中禁用）

---

## 3. 排版系统

### 字体栈（无衬线体）

```css
font-sans: [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  '"Microsoft YaHei"',
  '"PingFang SC"',
  '"Source Han Sans SC"',
  'sans-serif'
]
```

**为什么改为无衬线体**：
- 微软雅黑是 Windows 标准，老年人电脑预装
- 无衬线体笔画粗，屏幕显示清晰
- 更高的可读性，减少眼睛疲劳
- 符合现代屏幕阅读习惯

### 字号阶梯

| 类名 | 像素 | 用途 | 最小对比度 |
|------|------|------|-----------|
| `text-base` | 16px | 非核心内容（页脚、版权、辅助说明） | 4.5:1 |
| `text-lg` | 18px | 小文本、辅助信息 | 7:1 ✅ |
| `text-xl` | 20px | **核心内容基准**（正文、选项、标签） | 7:1 ✅ |
| `text-2xl` | 24px | 页面标题、卡片标题 | 7:1 ✅ |
| `text-3xl` | 30px | 主标题、入口标题 | 7:1 ✅ |

### 行高

- **正文**：`line-height: 1.6`（leading-relaxed）
- **标题**：`line-height: 1.3`（leading-snug）
- **默认**：`line-height: 1.5`（leading-normal）

### 排版规则
- ✅ 核心内容字号 ≥ 20px（text-xl）
- ✅ 所有正文使用 sans-serif 字体
- ✅ 标题使用 `font-bold` 或 `font-semibold`
- ✅ 长文本使用 `leading-relaxed`（1.6 行高）
- ✅ 不使用 serif 字体
- ✅ 不使用小于 16px 的核心内容

---

## 4. 组件系统

### 4.1 按钮组件

#### 主按钮（强调色）
```tsx
className="w-full min-h-[56px] bg-seal-red text-paper-base text-xl font-semibold rounded-sm transition-colors active:bg-opacity-80 disabled:bg-ink-wash disabled:cursor-not-allowed"
```
- **高度**：56px（≥48px 触控标准）
- **宽度**：全宽（w-full）
- **文字**：20px，白色，sans-serif，半粗体
- **状态**：active 时透明度 80%，disabled 时灰色
- **圆角**：rounded-sm（2px）

#### 次级按钮（边框）
```tsx
className="w-full min-h-[56px] bg-transparent border-2 border-ink-medium text-ink-heavy text-xl font-semibold rounded-sm active:bg-paper-deep"
```
- **高度**：56px
- **边框**：2px ink-medium
- **文字**：20px，深黑，sans-serif，半粗体
- **状态**：active 时背景变浅

### 4.2 输入框组件

#### 文本输入
```tsx
className="w-full min-h-[56px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-xl font-normal outline-none focus:border-seal-red px-2"
```
- **高度**：56px
- **边框**：仅下边框 2px
- **文字**：20px，深黑，sans-serif
- **焦点**：下边框变为强调色
- **背景**：透明

#### 文本区域
```tsx
className="w-full min-h-[180px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-xl leading-relaxed font-normal outline-none focus:border-seal-red resize-none px-2 py-3"
```
- **最小高度**：180px
- **行高**：1.6（leading-relaxed）
- **禁用 resize**：resize-none
- **其他**：同文本输入

### 4.3 卡片组件

```tsx
className="border border-ink-wash rounded-sm bg-paper-deep p-4 space-y-4"
```
- **边框**：1px 浅灰
- **背景**：浅灰
- **圆角**：rounded-sm（2px）
- **内边距**：16px（p-4）
- **间距**：16px（space-y-4）

### 4.4 提示框组件

```tsx
className="bg-paper-deep border-l-4 border-seal-red px-4 py-3 text-ink-medium text-lg rounded-sm"
```
- **背景**：浅灰
- **左边框**：4px 强调色
- **文字**：18px，中灰，sans-serif
- **内边距**：16px
- **圆角**：rounded-sm

---

## 5. 布局系统

### 间距阶梯

| 类名 | 像素 | 用途 |
|------|------|------|
| `p-2` | 8px | 紧凑间距（极少使用） |
| `p-3` | 12px | 小间距（极少使用） |
| `p-4` | 16px | **标准间距** ✅ |
| `p-5` | 20px | 宽间距 |
| `p-6` | 24px | 大间距 |
| `p-8` | 32px | 超大间距（极少使用） |

### 间距规则
- ✅ 所有间距 ≥ 16px（p-4）
- ✅ 相邻元素间距 ≥ 16px
- ✅ 触控区域周围间距 ≥ 16px
- ✅ 信息密度合理（不过度留白）
- ❌ 不使用小于 16px 的间距（除非特殊情况）

### 容器宽度
- **最大宽度**：`max-w-2xl`（672px）
- **内边距**：`px-4` 或 `px-6`（16-24px）
- **中心对齐**：`mx-auto`

### 响应式设计
- **移动优先**：从小屏开始设计
- **断点**：使用 Tailwind 默认断点
- **防止 iOS 底部导航遮挡**：使用 `min-h-dvh` 而非 `h-screen`

---

## 6. 深度与层级

### 背景层级
```
Level 1: paper-base (#FFFFFF) - 主背景
  ↓
Level 2: paper-deep (#F5F5F5) - 卡片、容器
  ↓
Level 3: border-ink-wash - 分隔线
```

### 文字层级
```
Level 1: ink-heavy (#1A1A1A) - 标题、重要内容
  ↓
Level 2: ink-medium (#666666) - 正文、次要内容
  ↓
Level 3: ink-wash (#999999) - 禁用、占位符
```

### 禁止事项
- ❌ 不使用阴影（boxShadow 已禁用）
- ❌ 不使用多层背景
- ❌ 不使用过多颜色层级

---

## 7. 设计规范与禁止事项

### ✅ 必须做

| 规范 | 示例 |
|------|------|
| 核心内容字号 ≥20px | 正文、选项、标签都用 text-xl |
| 对比度 ≥7:1 | ink-heavy on paper-base = 21:1 ✅ |
| 触控区域 ≥48px×48px | 按钮 min-h-[56px] w-full |
| 间距 ≥16px | 所有 padding/margin ≥ p-4 |
| 圆角仅用 rounded-sm | 所有圆角都是 2px |
| 使用 sans-serif 字体 | 所有文本都用 font-sans |
| 使用色彩令牌 | 只用 paper-base、ink-heavy 等 |
| 信息密度合理 | 不过度留白，符合老年人习惯 |

### ❌ 禁止做

| 禁止 | 原因 |
|------|------|
| 使用 serif 字体 | 屏幕显示不清晰，容易疲劳 |
| 使用 text-base（16px）作为核心内容 | 不符合适老化规范 |
| 使用 shadow-* 阴影类 | 简洁设计理念 |
| 使用 rounded-full 或 rounded-lg | 仅用 rounded-sm |
| 使用 h-screen 或 100vh | 使用 min-h-dvh |
| 引入第三方 UI 库 | 手写 Tailwind 组件 |
| 使用其他颜色 | 仅用定义的 6 种色彩令牌 |
| 使用透明度叠加 | 保持清晰度 |
| 使用渐变 | 保持简洁 |
| 过度留白 | 信息密度应合理 |

---

## 8. 响应式行为

### 移动端适配
- **视口宽度**：使用 `min-h-dvh` 防止 iOS Safari 底部导航遮挡
- **触控区域**：所有可点击元素 ≥48px×48px
- **字号**：不因屏幕大小而缩小
- **间距**：不因屏幕大小而减少

### 平板与桌面
- **最大宽度**：`max-w-2xl`（672px）
- **中心对齐**：`mx-auto`
- **两列布局**：仅在 UserLayout 中使用（左导航 + 右内容）

### 禁止事项
- ❌ 不使用响应式字号缩放
- ❌ 不使用响应式间距缩放
- ❌ 不使用响应式触控区域缩放

---

## 9. 适老化检查清单

### 字号检查
- [ ] 所有正文 ≥ 20px（text-xl）
- [ ] 所有标题 ≥ 24px（text-2xl）
- [ ] 所有按钮文字 ≥ 20px（text-xl）
- [ ] 所有输入框文字 ≥ 20px（text-xl）
- [ ] 非核心内容可用 16px（text-base）

### 对比度检查
- [ ] 所有文字对比度 ≥ 7:1
- [ ] 使用浏览器开发者工具验证
- [ ] 特别检查 ink-medium 文字

### 触控区域检查
- [ ] 所有按钮 ≥ 48px×48px
- [ ] 所有输入框 ≥ 48px 高度
- [ ] 所有可点击元素周围间距 ≥ 16px

### 间距检查
- [ ] 所有 padding ≥ 16px（p-4）
- [ ] 所有 margin ≥ 16px
- [ ] 相邻元素间距 ≥ 16px
- [ ] 信息密度合理（不过度留白）

### 字体检查
- [ ] 所有文本使用 sans-serif
- [ ] 没有 serif 字体
- [ ] 标题使用 font-bold 或 font-semibold

### 视觉检查
- [ ] 无阴影
- [ ] 无渐变
- [ ] 无过大圆角
- [ ] 无透明度叠加
- [ ] 仅用定义的 6 种颜色

---

## 10. 代理提示（Agent Prompts）

### 当用户要求 UI 调整时
1. **首先检查**：是否符合本 DESIGN.md 规范
2. **然后修改**：仅修改不符合规范的部分
3. **最后验证**：确保修改后符合所有规范

### 当用户要求新增组件时
1. **参考本文档**：使用定义的色彩、字号、间距
2. **遵循规范**：字号 ≥20px、对比度 ≥7:1、触控区域 ≥48px
3. **保持一致**：使用 Tailwind 类名，不引入新库

### 当用户要求响应式设计时
1. **移动优先**：从小屏开始
2. **不缩放**：字号、间距、触控区域不因屏幕大小而变化
3. **最大宽度**：使用 `max-w-2xl` 限制宽度

---

## 11. 设计决策记录

### 为什么改为无衬线体？
- serif 字体（宋体）笔画细，屏幕显示不清晰
- 无衬线体笔画粗，屏幕显示清晰
- 微软雅黑是 Windows 标准，老年人电脑预装
- 减少眼睛疲劳，提高可读性

### 为什么改为白色背景？
- 米色背景虽然文艺，但对比度不够
- 纯白背景对比度更高，更清晰
- 符合老年人的使用习惯（大多数网站都是白色背景）

### 为什么改为纯黑文字？
- 深灰文字对比度不足
- 纯黑文字对比度更高（21:1）
- 更清晰，减少眼睛疲劳

### 为什么字号基准改为 20px？
- 18px 对 60+ 岁老年人可能还是有点小
- 20px 是更合理的基准
- 符合适老化设计标准

### 为什么减少留白？
- 过度留白显得空旷，不符合老年人习惯
- 老年人习惯信息更紧凑
- 合理的信息密度更易理解

### 为什么保持触控区域 56px？
- 48px 是最小标准，56px 更安全
- 老年人手指灵活度下降，需要更大的触控区域
- 防止误触

---

## 12. 参考资源

- **Tailwind CSS**：https://tailwindcss.com/
- **WCAG 2.1 标准**：https://www.w3.org/WAI/WCAG21/quickref/
- **适老化设计指南**：https://www.w3.org/WAI/older-users/
- **项目 CLAUDE.md**：见项目根目录

---

*设计系统版本*：v2.0（重新设计）  
*最后更新*：2026-04-27  
*核心改进*：字体改为 sans-serif、配色改为白色+纯黑、版式减少留白、字号基准改为 20px
