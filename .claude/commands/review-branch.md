---
description: 머지 전 브랜치·PR diff를 시니어 관점으로 리뷰 (backend-tech-lead / client-tech-lead 위임)
argument-hint: "[PR 번호 또는 파일 경로 — 생략 시 origin/develop...HEAD] [--comment 로 PR에 인라인 게시]"
---

# /review-branch

머지 전 **시니어 코드 리뷰**를 수행한다. 브랜치 또는 PR diff 전체를 아키텍처·컨벤션·잠재버그·보안·성능·정합성·CI 게이트 관점으로 본다.

리뷰 범위: `$ARGUMENTS` (생략 시 `git diff origin/develop...HEAD`)

## 실행

1. **범위의 변경 파일을 먼저 확인한다** (`git diff --stat` 또는 `gh pr view <N> --json files`).

2. **바뀐 영역에 따라 위임한다.** offmode는 한 레포에 프론트와 백엔드가 같이 있으므로 범위를 보고 고른다:
   - `backend/` 변경 있음 → `backend-tech-lead`
   - `screens/`·`components/`·`utils/`·`constants/`·`assets/`·`App.jsx`·`app.json` 변경 있음 → `client-tech-lead`
   - **둘 다 바뀌었으면 두 에이전트를 한 메시지에서 동시에 띄운다.** 각각에게 자기 영역 파일 목록을 넘기되, **"반대편 영역과 짝을 이루는 정의가 함께 바뀌었는지 확인하라"**고 명시한다 (프론트 상수 ↔ 백엔드 enum 정합성은 양쪽 모두의 필수 점검 항목이다).

3. 두 에이전트 모두 **READ-ONLY**다. 마크다운 리뷰 보고서만 산출하며 코드를 수정하지 않는다.

## 결과 처리

1. 보고서를 그대로 사용자에게 전달한다. 두 에이전트를 돌렸으면 **must-fix를 한 곳에 합쳐 먼저 보여주고**, 영역별 상세를 뒤에 붙인다.
2. **must-fix가 있으면** 맨 앞에 한 줄로 `NO-GO — N건의 머지 차단 이슈`를 알린다.
3. `--comment` 가 인자에 있으면, 보고서를 PR 인라인 리뷰로 게시할지 **먼저 사용자에게 확인**한 뒤 `gh api repos/{owner}/{repo}/pulls/{N}/reviews` 로 올린다. 기본 `event`는 `COMMENT` — `REQUEST_CHANGES`는 사용자가 명시적으로 요청했을 때만 쓴다.
4. 사용자가 "반영해줘"라고 하면 그때 일반 편집 플로우(또는 본인 PR이면 `apply-pr-review` 스킬)로 수정한다. **리뷰와 반영은 분리한다 — 리뷰어는 손대지 않는다.**

## 적용 대상

**기본은 본인(calla1102)이 올린 PR과 작업 브랜치다.** 협업자 PR에 이 리뷰를 자동으로 돌리지 않는다 — 사용자가 그 PR 번호를 직접 지정했을 때만 리뷰한다.

## 주의

- 남의 PR을 리뷰할 때는 상대가 담당하지 않는 영역(예: 프론트 담당자에게 백엔드 수정)을 요구하지 말고, **그 부분은 누가 처리할지 보고서에 명시**한다.
- 실기기에서만 확인 가능한 UX 항목은 단정하지 말고 체크리스트로 넘긴다 (사용자가 직접 확인).
