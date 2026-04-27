# 时光回响 · 题库 v2.0

> 来源：`src/data/question-templates.ts`  
> 设计原则：以终为始，场景驱动，人物优先。选择题主力，短填空点睛，AI 动态深追。

---

## 题库总览

| 维度 | 数值 |
|------|:--:|
| 入口题 | **12** |
| 题链总数（含静态追问） | **78** |
| 阶段 | 6 大主题 |
| 答题方式 | `single` / `multi` / `hybrid` |
| AI 动态追问 | 8 道入口题配有 L3+ AI 深追模块 |

---

## 6 大阶段

| 阶段 | 题号 | 入口题数 |
|------|:--:|:--:|
| 来时路 | Q1, Q2 | 2 |
| 童年 | Q3 | 1 |
| 求学 | Q4 | 1 |
| 青年闯荡 | Q5 | 1 |
| 重要关系 | Q6, Q7 | 2 |
| 晚年回望 | Q8, Q9, Q10, Q11, Q12 | 5 |

---

## 逐题索引

### Q1 · 来时路 — 您小时候是谁带大的？

```
入口：q01_entry（multi，8 选项）
逐人追问链：
  q01_persona → q01_persona_age → q01_persona_saying → q01_persona_deed
开关：q01_sibling_switch（有/无兄弟姐妹）
收束：q01_close（这个家给了您什么）
```

### Q2 · 兄弟姐妹

```
入口：q02_entry（0个/1个/2个/3个/4个+/独生）
有 → q02_ranking → q02_closest → q02_sibling_status
独生 → q02_only_reason → q02_only_feeling
```

### Q3 · 童年记忆

```
入口：q03_entry（multi，高兴/得意/委屈/难过/无/其他）
聚焦：q03_focus（单选一件往下聊）
深挖：q03_deep（hybrid，自由讲述）
```

### Q4 · 学校生活

```
入口：q04_entry（小学/初中/高中/大学/师傅/没上过/其他）
记忆：q04_memory（multi，老师/同学/事件/场景）
老师线：q04_teacher_name → q04_teacher_persona → q04_teacher_saying
同学线：q04_classmate_name → q04_classmate_status
事件线：q04_event_detail
```

### Q5 · 青年闯荡

```
入口：q05_entry（种地/工厂/买卖/学手艺/参军/念书/在家/到处跑/其他）
细节：q05_career_detail（hybrid 自由讲述）
得意：q05_proud_check → q05_proud_detail
```

### Q6 · 重要的人

```
入口：q06_entry（伴侣/非伴侣/无/不方便）
伴侣线：
  q06_partner_name → q06_partner_how → q06_partner_first
  → q06_partner_memory → q06_partner_alive
  → q06_partner_regret（如不在了）
  → q06_partner_message
非伴侣线：
  q06_nonpartner_who → q06_nonpartner_how → q06_nonpartner_change
```

### Q7 · 孩子（条件：has_children）

```
入口：q07_entry（都好/各有难处/放心不下/特别骄傲/走的远近/其他）
聚焦：q07_focus（hybrid）
传承：q07_taught（怎么做人/怎么扛事/手艺/ta们教我/其他）
```

### Q8 · 现在

```
入口：q08_entry（multi，14 个关系网选项：父母/老伴/兄弟姐妹/子女/孙辈/护工/独居/身体状况）
```

### Q9 · 没说的话

```
入口：q09_entry（multi，感谢/抱歉/交代/委屈/无/不方便）
```

### Q10 · 这辈子最记得的事

```
入口：q10_entry（大事/重要的人/大难/无/其他）
成就线：q10_achievement_what → q10_achievement_age → q10_achievement_feeling → q10_achievement_impact
人物线：q10_person_who → q10_person_change → q10_person_message
灾难线：q10_disaster_what → q10_disaster_who → q10_disaster_how → q10_disaster_change
```

### Q11 · 最想对谁说一声谢谢

```
入口：q11_entry（multi，父母/伴侣/孩子/兄弟姐妹/朋友/老师/其他/无）
聚焦：q11_focus → q11_thank_what → q11_said → q11_express
```

### Q12 · 寄语 + 打分

```
入口：q12_entry（multi，要知足/身体/珍惜/良心/别贪/别累/陪家人/学本事/其他）
打分：q12_score（60以下/60-70/70-80/80-90/90以上）
总结：q12_word（一个词说一生）
```

---

## AI 动态追问模块

文件：`src/lib/question-ai.ts`

覆盖的入口题：Q1、Q3、Q4、Q5、Q6、Q7、Q10

自适应策略：
- ≤16 字 → `deepen`（动态生成选项追问）
- 17-50 字 → `light_followup`（轻改写追问）
- >50 字 → `close`（收束，"这段已经很好了"）

---

## 交互规范

- **一屏一题**：每屏一道题 + 选项/填空区
- **后悔药**：L1 提交前可取消选项；L2 开始后页面右下角小字"点错了，没有某某"
- **生长式输入区**：初始 1-2 行高，无硬限制，>50 字轻提示
- **填空 placeholder**："如果有想说的，也可以写几个字"
- **逐人展开**：Q1 选了 N 个人，逐人追问，每人追完后给出口

---

*生成时间：2026-04-27*  
*数据来源：src/data/question-templates.ts v2.0*
