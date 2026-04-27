请修复 `docs/TS_ERRORS.md` 中列出的 5 个真错误。只修代码，不改逻辑。

## 执行顺序

1. `src/lib/aiUtils.ts:310-312` — 三个 `(line)` 改为 `(line: string)`
2. `src/pages/api/interview/generate.ts:3` — 移除 `memoirToMarkdown` import
3. `src/pages/api/interview/generate.ts:93` — `const { memoir, markdown, unusedAnswers }` 改为 `const { memoir, unusedAnswers }`
4. `src/pages/interview.tsx:1` — 移除 `useRef` import
5. `src/pages/api/test-env.ts:4` — `req` 改为 `_req`

完成后运行 `npx tsc --noEmit` 验证零错误。

## 不碰的文件

- `src/pages/preview.tsx`（`isPolishing` 和 `handlePolish` 属功能不完整，非阻断错误，不修）
