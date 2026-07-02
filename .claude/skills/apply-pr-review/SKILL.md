---
name: apply-pr-review
description: 본인 PR에 달린 리뷰 코멘트를 수집/분류하고, 반영 대상은 코드 수정 + 빌드 검증 + 커밋 메시지 제안 + 답글 문구까지 워크플로로 처리한다. "내 PR 코멘트 반영해줘", "PR #N 리뷰 확인", "PR #N 코멘트 처리해줘" 류 한국어 또는 /apply-pr-review 호출 시 동작.
---

# apply-pr-review — 내 PR 리뷰 코멘트 수집·분류·반영

사용자가 이 스킬을 호출하면 다음 절차를 수행한다. **커밋·푸시는 절대 직접 하지 않는다** (사용자가 직접). 빌드 검증은 offmode 기준(백엔드: `backend/` 단일 Gradle 모듈, 프론트: `npm run lint`)이다.

## 1. PR 식별

사용자가 PR 번호를 명시했으면 그대로 사용. 명시 안 했으면 현재 브랜치에서 자동 추론:

```bash
gh pr list --head "$(git branch --show-current)" --json number,title --jq '.[0]'
```

매칭되는 PR이 없으면 사용자에게 PR 번호를 물어본다.

## 2. 코멘트/리뷰 수집

다음 3개 엔드포인트를 병렬 호출:

```bash
gh pr view {N}                                                  # 본문/리뷰어/상태
gh api repos/{owner}/{repo}/pulls/{N}/comments                  # inline review comments
gh api repos/{owner}/{repo}/issues/{N}/comments                 # 일반 코멘트
gh api repos/{owner}/{repo}/pulls/{N}/reviews                   # 리뷰 본문 (Copilot 요약 포함)
```

수집한 코멘트는 **인라인 코멘트 ID, 파일 경로, 라인 번호, 작성자, body, commit_id** 까지 보관 (답글 작성 시 필요).

## 3. 코멘트 분류

각 코멘트를 다음 3가지 중 하나로 분류해 사용자에게 보여준다:

| 분류 | 기준 | 처리 |
|---|---|---|
| **반영** | 코드 수정이 필요한 구체적 지적 (네이밍/로직/버그/누락/관측성 등) | 본 PR에서 코드 수정 |
| **답변만** | 의도/이유 질문, 정보 요청 (코드 변경 불필요) | inline reply로 답변 작성 |
| **이관** | 다른 도메인/이슈에 더 적합하거나 본 PR 스코프 밖 | 해당 이슈로 이관, PR에는 안내 |

**이관 판단은 코멘트 분석 전에 GitHub 이슈 매핑부터 먼저 확인.** `gh issue list` 등으로 관련 이슈가 따로 있는지 확인하고, 겹치면 그쪽으로 보낸다. 본 PR 스코프 안에서 다룰 변경인지(특히 신규 enum/필드/네이밍 변경처럼 머지 후 변경 비용이 큰 것)도 함께 판단.

분류 결과를 표/리스트로 요약 보고하고, **사용자에게 "어느 것부터 반영할까요?"를 묻는다.** 임의로 일괄 진행하지 않는다.

## 4. 반영 (코드 수정)

사용자 지목에 따라 한 번에 한 코멘트씩 처리:

1. 대상 파일 Read → 수정 (Edit/Write)
2. 같은 도메인에 다른 참조가 있는지 grep으로 확인 (네이밍 변경 등은 누락 시 빌드 실패)
3. 필요 시 테스트 케이스 추가/수정

## 5. 빌드 검증 (필수 순서)

수정 후 반드시 다음 순서로 검증. 한 단계라도 실패하면 다음 단계로 넘어가지 않는다. 변경 범위에 맞는 것만 돌린다.

**백엔드(.java)를 고쳤으면** (`backend/` 기준):
```bash
cd backend
./gradlew spotlessApply
./gradlew compileJava
./gradlew test --tests "{관련 테스트 클래스 FQN}"
```

**프론트(.jsx/.js)를 고쳤으면**:
```bash
npm run lint
```

`spotlessApply`는 **커밋 메시지 추천 전 무조건 먼저** 돌린다 (포맷 차이로 인한 noise 방지). offmode는 단일 모듈이라 `:{module}:` prefix·checkstyle은 쓰지 않는다.

## 6. 사용자 보고 (수정파일 + 커밋 메시지)

검증 통과하면 사용자에게 다음 형식으로 보고:

```
### 수정된 파일 (N개) — {N번} 리뷰 반영분
- `{경로}`: {짧은 설명}

### 커밋 메시지
[{라벨}] #{이슈번호} {제목}

{본문 2~3줄, why 중심}
```

라벨 컨벤션: `Feat` / `Fix` / `Refactor` / `Chore` / `Docs` / `Test` 중 선택. 이름 변경은 `Refactor`, 신규 매핑/케이스 추가는 `Feat`, 로그/주석/포맷은 `Chore`.

**커밋·푸시는 사용자가 직접 한다.** 절대 `git commit` / `git push` 를 자동 실행하지 않는다.

## 7. PR 답글 작성

사용자가 커밋·푸시 완료 후 SHA를 알려주면(또는 `gh pr view` 로 최신 커밋 확인 후), 각 코멘트에 답글을 단다.

### 반영 코멘트 → inline reply

```
반영하였습니다 : {PR_URL}/changes/{full-sha}
```

`gh api` 로 인라인 답글:

```bash
gh api -X POST repos/{owner}/{repo}/pulls/{N}/comments \
  -f body="반영하였습니다 : {PR_URL}/changes/{full-sha}" \
  -F in_reply_to={original_comment_id}
```

### 답변만 → inline reply (답변 본문)

답변은 **4~5줄 이내**로 줄여서 작성. 분리 이유/의도/맥락 위주, 코드 인용 최소화.
사용자에게 답변 초안을 먼저 보여주고 confirm 받은 뒤 등록.

### 이관 → 마지막에 일반 코멘트 하나로 묶음

여러 코멘트를 한 이슈로 이관할 경우 PR 최하단에 하나의 issue comment로 안내 (개별 답글로 분산하지 않음):

```bash
gh pr comment {N} --body "다음 코멘트들은 #{다른이슈번호} 로 이관했습니다: ..."
```

## 8. 마무리

- 모든 코멘트가 처리됐는지 (반영/답변/이관 중 하나로) 점검
- 미해결 코멘트가 남아 있으면 사용자에게 명시적으로 알린다
- "PR 상태 변경(Re-request review 등)" 은 사용자가 직접

## 주의사항

- **커밋·푸시·force-push 절대 자동 실행 금지.** 사용자가 직접 한다는 게 기본 전제.
- 답글에 라인 번호를 언급할 때는 PR 브랜치의 **실제 현재 파일** 라인을 검증 (코멘트 시점과 라인이 달라졌을 수 있음).
- Copilot 봇 리뷰는 보통 요약만 있고 inline 코멘트 없음 — 요약을 한 줄로 보고하고 넘어간다.
- 4건 이상 코멘트가 한꺼번에 들어왔어도 "한 번에 한 코멘트씩, 사용자 지목 순서대로" 가 기본. 일괄 반영은 사용자가 명시적으로 요청한 경우만.
