# 设计规范修改清单 (DESIGN_FIXES_CHECKLIST.md)

**生成日期**：2026-04-27  
**基于规范**：docs/DESIGN.md  
**总修改点**：18 个  
**预计工作量**：45-60 分钟

---

## 🔴 P0 优先级（必须修改 - 影响适老化）

### 字号修改（6 处）

#### 1. interview.tsx - 第 934 行
**问题**：核心交互信息字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium font-serif">还可跳过 {remainingSkips} 次</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium font-serif">还可跳过 {remainingSkips} 次</p>
```
**原因**：用户需要了解剩余跳过次数，这是核心信息，应 ≥18px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 2. preview.tsx - 第 458 行
**问题**：问题内容字号过小  
**当前**：
```tsx
<p className="text-sm text-ink-medium">问题：{item.questionContent}</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">问题：{item.questionContent}</p>
```
**原因**：问题内容是核心内容，应 ≥18px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 3. preview.tsx - 第 483 行
**问题**：问题标签字号过小  
**当前**：
```tsx
<span className="text-sm text-ink-wash">{item.topicTag}</span>
```
**修改为**：
```tsx
<span className="text-base text-ink-wash">{item.topicTag}</span>
```
**原因**：标签是辅助信息，至少应为 16px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 4. preview.tsx - 第 573 行
**问题**：AI 建议内容字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">{suggestion}</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">{suggestion}</p>
```
**原因**：AI 建议是核心内容，应 ≥18px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 5. supplement.tsx - 第 215、218、230、251、268 行
**问题**：多处核心内容字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">...</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">...</p>
```
**原因**：这些都是用户需要阅读的核心内容，应 ≥18px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 6. contact/index.tsx - 第 30、33、43、54 行
**问题**：多处辅助文本字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">...</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">...</p>
```
**原因**：即使是辅助文本，也应 ≥18px 以符合适老化规范  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

### 间距修改（11 处）

#### 7. profile.tsx - 第 93 行
**问题**：小标题下方间距过小  
**当前**：
```tsx
<h3 className="text-xl font-serif text-ink-heavy pb-2">基础档案</h3>
```
**修改为**：
```tsx
<h3 className="text-xl font-serif text-ink-heavy pb-4">基础档案</h3>
```
**原因**：间距应 ≥16px（p-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 8. profile.tsx - 第 128 行
**问题**：InfoRow 间距过小  
**当前**：
```tsx
<div className="flex justify-between items-center py-2">
```
**修改为**：
```tsx
<div className="flex justify-between items-center py-4">
```
**原因**：间距应 ≥16px（py-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 9. settings.tsx - 第 138、150、180、190 行
**问题**：输入框内边距过小  
**当前**：
```tsx
className="w-full min-h-[48px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2 py-3"
```
**修改为**：
```tsx
className="w-full min-h-[48px] bg-transparent border-b-2 border-ink-medium text-ink-heavy text-lg font-serif outline-none focus:border-seal-red px-2 py-4"
```
**原因**：间距应 ≥16px（py-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 10. settings.tsx - 第 221 行
**问题**：Field 标签下方间距过小  
**当前**：
```tsx
<label className="block text-lg text-ink-heavy font-serif mb-3">
```
**修改为**：
```tsx
<label className="block text-lg text-ink-heavy font-serif mb-4">
```
**原因**：间距应 ≥16px（mb-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 11. history.tsx - 第 84 行
**问题**：卡片内部间距过小  
**当前**：
```tsx
<div className="space-y-3">
```
**修改为**：
```tsx
<div className="space-y-4">
```
**原因**：间距应 ≥16px（space-y-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 12. history.tsx - 第 104 行
**问题**：按钮间距过小  
**当前**：
```tsx
<div className="flex gap-3">
```
**修改为**：
```tsx
<div className="flex gap-4">
```
**原因**：间距应 ≥16px（gap-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 13. drops.tsx - 第 75 行
**问题**：筛选按钮间距过小  
**当前**：
```tsx
<div className="flex gap-3 mb-6">
```
**修改为**：
```tsx
<div className="flex gap-4 mb-6">
```
**原因**：间距应 ≥16px（gap-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 14. invite.tsx - 第 69 行
**问题**：邀请说明内部间距过小  
**当前**：
```tsx
<div className="space-y-3">
```
**修改为**：
```tsx
<div className="space-y-4">
```
**原因**：间距应 ≥16px（space-y-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 15. invite.tsx - 第 79 行
**问题**：链接输入框间距过小  
**当前**：
```tsx
<div className="flex gap-3">
```
**修改为**：
```tsx
<div className="flex gap-4">
```
**原因**：间距应 ≥16px（gap-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 16. preview.tsx - 第 572 行
**问题**：卡片间距过小  
**当前**：
```tsx
<div className="p-3 bg-paper-deep rounded-sm">
```
**修改为**：
```tsx
<div className="p-4 bg-paper-deep rounded-sm">
```
**原因**：间距应 ≥16px（p-4）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 17. supplement.tsx - 第 289 行
**问题**：卡片间距过小  
**当前**：
```tsx
<div className="py-4">
```
**修改为**：
```tsx
<div className="p-6">
```
**原因**：卡片内边距应 ≥16px，建议使用 p-6（24px）  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

### 触控区域修改（3 处）

#### 18. preview.tsx - 第 468、475 行
**问题**：按钮高度过小  
**当前**：
```tsx
className="min-h-[48px]"
```
**修改为**：
```tsx
className="min-h-[56px]"
```
**原因**：按钮应 ≥48px，建议 56px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 19. supplement.tsx - 第 306 行
**问题**：输入框高度过小  
**当前**：
```tsx
className="min-h-[48px]"
```
**修改为**：
```tsx
className="min-h-[56px]"
```
**原因**：输入框应 ≥48px，建议 56px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

#### 20. contact/index.tsx - 第 49 行
**问题**：复制按钮高度过小  
**当前**：
```tsx
className="min-h-[40px]"
```
**修改为**：
```tsx
className="min-h-[48px]"
```
**原因**：按钮应 ≥48px  
**优先级**：🔴 P0  
**状态**：⬜ 待修改

---

## 🟡 P1 优先级（建议修改 - 影响一致性）

### 字号修改（3 处）

#### 21. contact/feedback.tsx - 第 165、189、190、213、214、232、233 行
**问题**：多处辅助文本字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">...</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">...</p>
```
**原因**：为了保持一致性，所有用户可见文本应 ≥18px  
**优先级**：🟡 P1  
**状态**：⬜ 待修改

---

#### 22. help/privacy.tsx - 第 159 行
**问题**：更新时间字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">最后更新：{lastUpdated}</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">最后更新：{lastUpdated}</p>
```
**原因**：为了保持一致性  
**优先级**：🟡 P1  
**状态**：⬜ 待修改

---

#### 23. help/faq.tsx - 第 176 行
**问题**："未找到"提示字号过小  
**当前**：
```tsx
<p className="text-base text-ink-medium">未找到相关问题</p>
```
**修改为**：
```tsx
<p className="text-lg text-ink-medium">未找到相关问题</p>
```
**原因**：为了保持一致性  
**优先级**：🟡 P1  
**状态**：⬜ 待修改

---

## 🟢 P2 优先级（可选修改 - 优化体验）

#### 24. profile.tsx - 第 138 行
**问题**：确认 StatCard 标签是否为非核心内容  
**当前**：
```tsx
<p className="text-base text-ink-medium">水滴余额</p>
```
**建议**：
- 如果是非核心内容，保持 `text-base`
- 如果是核心内容，改为 `text-lg`

**优先级**：🟢 P2  
**状态**：⬜ 待确认

---

## 📊 修改统计

| 优先级 | 修改点数 | 受影响文件 | 预计时间 |
|--------|---------|----------|---------|
| P0 | 20 | 11 个文件 | 30-45 分钟 |
| P1 | 3 | 3 个文件 | 10-15 分钟 |
| P2 | 1 | 1 个文件 | 5 分钟 |
| **总计** | **24** | **12 个文件** | **45-60 分钟** |

---

## ✅ 修改验证清单

### 修改前准备
- [ ] 备份当前代码（git commit）
- [ ] 确认开发环境正常运行
- [ ] 打开浏览器开发者工具

### 修改执行
- [ ] 完成所有 P0 修改
- [ ] 完成所有 P1 修改
- [ ] 完成所有 P2 修改

### 修改验证
- [ ] 启动开发服务器（npm run dev）
- [ ] 逐页检查字号（Computed Styles）
- [ ] 逐页检查间距（Box Model）
- [ ] 逐页检查触控区域（min-height）
- [ ] 检查对比度（Accessibility 标签）
- [ ] 测试所有交互流程

### 修改提交
- [ ] 所有修改完成
- [ ] 本地验证通过
- [ ] 提交代码（git commit）
- [ ] 推送到远程（git push）

---

## 🎯 修改顺序建议

### 第一轮：字号修改（6 处）
1. interview.tsx:934
2. preview.tsx:458、483、573
3. supplement.tsx:215、218、230、251、268
4. contact/index.tsx:30、33、43、54

**预计时间**：10-15 分钟

### 第二轮：间距修改（11 处）
1. profile.tsx:93、128
2. settings.tsx:138、150、180、190、221
3. history.tsx:84、104
4. drops.tsx:75
5. invite.tsx:69、79
6. preview.tsx:572
7. supplement.tsx:289

**预计时间**：15-20 分钟

### 第三轮：触控区域修改（3 处）
1. preview.tsx:468、475
2. supplement.tsx:306
3. contact/index.tsx:49

**预计时间**：5-10 分钟

### 第四轮：验证和提交
1. 启动开发服务器
2. 逐页验证修改
3. 提交代码

**预计时间**：10-15 分钟

---

## 📝 修改完成后

### 预期效果
- ✅ 所有页面符合 DESIGN.md 规范
- ✅ 整体符合度从 68% 提升至 95%+
- ✅ 完全符合适老化规范

### 后续工作
1. 更新 DESIGN_AUDIT_REPORT.md（标记为已完成）
2. 更新项目内存（记录修改完成）
3. 准备下一阶段工作（P1 修改、响应式验证等）

---

*清单生成时间*：2026-04-27  
*下一步*：执行 P0 优先级修改
