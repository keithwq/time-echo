# TypeScript 编译错误清单

> 运行 `npx tsc --noEmit` 的输出，共 9 个错误 / 5 个文件。所有错误均与 v2.0 题库修改无关。

---

## 错误清单

### 1. `src/lib/aiUtils.ts:310-312` — 参数缺类型

```
:310  .filter((line) => line.match(/^\d+\./))
:311  .map((line) => line.replace(/^\d+\.\s*/, '').trim())
:312  .filter((line) => line.length > 0)
```

**原因**：严格模式下回调参数必须显式标注类型。  
**修法**：`(line: string)` 即可。

---

### 2. `src/pages/api/interview/generate.ts:3` — 死 import

```typescript
import { generateMemoirWithUnused, memoirToMarkdown } from '@/lib/memoirGenerator';
```

**原因**：`memoirToMarkdown` 全局未被调用。  
**修法**：从 import 中移除此项。

---

### 3. `src/pages/api/interview/generate.ts:93` — 解构未使用

```typescript
const { memoir, markdown, unusedAnswers } = generateMemoirWithUnused(...)
```

**原因**：解构出的 `markdown` 从未被引用。`generateMemoirWithUnused` 返回 `{ memoir, markdown, unusedAnswers }`，但当前代码只用 `memoir` 做 AI 改写，`markdown` 可能是重构遗留。  
**修法**：`const { memoir, unusedAnswers } = ...`，去掉 `markdown`。

---

### 4. `src/pages/api/test-env.ts:4` — 框架签名参数

```typescript
export default async function handler(
  req: NextApiRequest,  // ← 未使用但签名必须存在
  res: NextApiResponse
)
```

**原因**：Next.js API Route 强制 `(req, res)` 签名。这是框架模式，不是代码错误。  
**修法**：`_req: NextApiRequest` 前缀即可消除 TS 告警。 **可忽略**。

---

### 5. `src/pages/interview.tsx:1` — 死 import

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
```

**原因**：`useRef` 全局未被调用。  
**修法**：从 import 中移除此项。

---

### 6. `src/pages/preview.tsx:138` — state 声明未读取

```typescript
const [isPolishing, setIsPolishing] = useState(false);
```

**原因**：`setIsPolishing` 在 `handlePolish` 函数中正确调用了 `setIsPolishing(true/false)`，但 `isPolishing` 本身从未在 JSX 或逻辑中被读取。AI 润色功能的加载态 state 写了但 UI 未接。  
**修法**：将 `isPolishing` 接入手册润色按钮的 `disabled` 属性及文本状态。**属功能不完整，非阻塞错误**。

---

### 7. `src/pages/preview.tsx:301` — 函数声明未调用

```typescript
const handlePolish = async () => { ... }
```

**原因**：`handlePolish` 定义了完整的 AI 润色逻辑，但没有任何 JSX 元素的 `onClick` 引用它。对应的"润色人生小传"按钮尚未接入 UI。  
**修法**：在合适位置添加按钮并绑定 `onClick={handlePolish}`。**属功能不完整，非阻塞错误**。

---

## 分类汇总

| 类型 | 数量 | 文件 |
|------|:--:|------|
| 真错误（应修） | 5 | aiUtils ×3, generate ×2, interview ×1 |
| 框架模式（可忽略） | 1 | test-env ×1 |
| 功能不完整 | 2 | preview ×2 |

---

*生成时间：2026-04-27*
