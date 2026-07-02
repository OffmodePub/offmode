# Rooms v2 — API 계약 (초안)

> 방(Room) 기반 소셜 미션 리디자인. 프론트/백엔드 병렬 작업의 단일 기준 문서.
> 기존 컨벤션 준수: 성공 = `ResponseEntity<DTO>`(200) / 데이터 없음 = 204 / 빈 목록 = `[]` 200,
> 에러 = `ApiResponse`(`isSuccess/code/message`), `photoUrl`은 상대경로(`/uploads/...`),
> 리액션 = emoji 문자열(unique: room_proof + user + emoji).

## 1. 도메인 모델

### Room
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | Long | |
| `name` | String | 방 이름 |
| `iconKey` | enum | 방 아이콘: `FIRE`/`MOON`/`COFFEE`/`RUN`/`BOOKS`/`SPARKLE` |
| `type` | enum | `SOLO`(혼자) / `GROUP`(함께) |
| `inviteCode` | String | 6자리, GROUP만 (예: `OFF111`). SOLO는 null |
| `memberCount` | int | |
| `streak` | int | 연속 달성 일수 (예: 3 → "3일 연속 달성 중") |

### RoomMember
| 필드 | 타입 | 설명 |
|---|---|---|
| `memberId` | Long | room_member PK |
| `userId` | Long | |
| `nickname` | String | |
| `avatarId` | String | `'01'`~`'06'` |
| `role` | enum | `OWNER`(방장) / `MEMBER` |
| `todayStatus` | enum | `DONE`(인증완료) / `PENDING`(대기중) / `NONE`(미인증) |

### RoomMission (방의 당일 미션)
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | Long | |
| `date` | LocalDate | |
| `title` | String | 미션 텍스트 |
| `icon` | String | emoji |
| `source` | enum | `DIRECT`(직접 입력) / `RANDOM`(랜덤 뽑기) |

### RoomProof (인증)
| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | Long | |
| `authorNickname` / `authorAvatarId` | String | |
| `photoUrl` | String | 상대경로 |
| `caption` | String | 한마디 (nullable) |
| `createdAt` | LocalDateTime | |
| `status` | enum | `VERIFIED`(인증완료) / `PENDING`(대기중) |
| `confirmCount` / `requiredConfirm` | int | 피어 인증 진행 (예: 2/4) |
| `myConfirmed` | boolean | 내가 인증해줬는지 |
| `mine` | boolean | 이 인증의 작성자가 나인지 — 본인 콘텐츠 신고 버튼 미노출용 |
| `reactions` | ReactionSummary[] | `{ emoji, count, mine }` — emoji 자유 문자열(기존 Reaction 엔티티 방식). UI 기본 🔥👍❤️ 노출 + `+`로 이모지 피커 |

---

## 2. 엔드포인트

> 베이스: `/api/v1/rooms`. 전부 `authenticated` (SecurityConfig 등록 필요).

### 방
| 메서드 | 경로 | 설명 | 화면 |
|---|---|---|---|
| `POST` | `/api/v1/rooms` | 방 생성 | CreateRoom |
| `GET` | `/api/v1/rooms` | 내 방 목록 | RoomList |
| `POST` | `/api/v1/rooms/join` | 초대코드 참여 | JoinRoom |
| `GET` | `/api/v1/rooms/{roomId}` | 방 상세 | RoomDetail / Solo / Empty |
| `PATCH` | `/api/v1/rooms/{roomId}` | 방 이름 변경 | RoomSettings |
| `DELETE` | `/api/v1/rooms/{roomId}/members/me` | 방 나가기 | RoomSettings |
| `DELETE` | `/api/v1/rooms/{roomId}/members/{memberId}` | 멤버 내보내기(방장) | RoomSettings |
| `POST` | `/api/v1/rooms/{roomId}/members/{memberId}/nudge` | 콕 찌르기(재촉) | RoomDetail |

### 미션
| 메서드 | 경로 | 설명 | 화면 |
|---|---|---|---|
| `GET` | `/api/v1/rooms/{roomId}/mission/candidates` | 지난 미션 후보 목록 | MissionPicker |
| `POST` | `/api/v1/rooms/{roomId}/mission` | 오늘 미션 정하기 | MissionPicker |

### 인증/리액션
| 메서드 | 경로 | 설명 | 화면 |
|---|---|---|---|
| `POST` | `/api/v1/rooms/{roomId}/proofs` | 사진 인증 (multipart) | Verify(Room) |
| `GET` | `/api/v1/rooms/{roomId}/proofs/{proofId}` | 인증 상세 | ProofDetail |
| `POST` | `/api/v1/rooms/{roomId}/proofs/{proofId}/reactions` | 리액션 토글 | RoomDetail/ProofDetail |
| `POST` | `/api/v1/rooms/{roomId}/proofs/{proofId}/confirm` | 피어 인증해주기 | ProofDetail |
| `POST` | `/api/v1/rooms/{roomId}/proofs/{proofId}/report` | 콘텐츠 신고 (UGC) | ProofDetail/RoomDetail |

### 기록
| 메서드 | 경로 | 설명 | 화면 |
|---|---|---|---|
| `GET` | `/api/v1/rooms/{roomId}/history?month=YYYY-MM` | 지난 기록 | RoomHistory |

---

## 3. 요청/응답 상세

### POST /api/v1/rooms — 방 생성
```json
// req
{ "name": "우리 동네 갓생러", "iconKey": "FIRE", "type": "GROUP" }
// res 200 → RoomDetailResponse (아래 GET 상세와 동일, inviteCode 포함)
```

### GET /api/v1/rooms — 내 방 목록
```json
// res 200
{
  "soloRoom": {                       // 없으면 null
    "id": 1, "name": "나 혼자", "iconKey": "MOON", "type": "SOLO",
    "memberCount": 1,
    "todayMission": { "icon": "🪟", "title": "창문 열고 하늘 사진 찍기" },
    "todayDone": true
  },
  "groupRooms": [
    {
      "id": 2, "name": "우리 동네 갓생러", "iconKey": "FIRE", "type": "GROUP",
      "memberCount": 4,
      "todayMission": { "icon": "🚶", "title": "동네 한 바퀴 산책하기" },
      "verifiedCount": 2, "requiredCount": 4   // "2/4 인증"
    }
  ]
}
// 방 없음 → soloRoom:null, groupRooms:[]  (RoomList Empty)
```

### POST /api/v1/rooms/join — 초대코드 참여
```json
// req
{ "inviteCode": "OFF111" }
// res 200 → RoomDetailResponse
// 에러: 코드 없음 ROOM_404_xxx / 이미 참여 ROOM_409_xxx (한국어 메시지)
```

### GET /api/v1/rooms/{roomId} — 방 상세
```json
// res 200
{
  "id": 2, "name": "우리 동네 갓생러", "iconKey": "FIRE", "type": "GROUP",
  "inviteCode": "OFF111",            // SOLO면 null
  "memberCount": 4, "streak": 3,
  "isOwner": true,
  "todayMission": {                  // 아직 안 정해졌으면 null (RoomDetail Empty)
    "id": 10, "date": "2026-06-11",
    "icon": "🚶", "title": "동네 한 바퀴 산책하기", "source": "RANDOM"
  },
  "myTodayStatus": "NONE",           // NONE/PENDING/DONE
  "progress": { "verifiedCount": 2, "requiredCount": 4 },
  "members": [
    { "memberId": 11, "nickname": "하준", "avatarId": "03",
      "role": "MEMBER", "todayStatus": "NONE" }
  ],
  "proofs": [                        // 오늘의 인증 피드 (최신순)
    {
      "id": 100, "authorNickname": "오프모더", "authorAvatarId": "01",
      "photoUrl": "/uploads/xxx.jpg", "caption": "동네 한 바퀴 돌고 왔어요 :)",
      "createdAt": "2026-06-11T14:02:00", "status": "VERIFIED",
      "confirmCount": 2, "requiredConfirm": 4, "myConfirmed": false,
      "reactions": [ { "emoji": "🔥", "count": 3, "mine": true },
                     { "emoji": "👍", "count": 1, "mine": false },
                     { "emoji": "❤️", "count": 0, "mine": false } ]
    }
  ]
}
```

### GET /api/v1/rooms/{roomId}/mission/candidates — 미션 후보
```json
// res 200 → 지난 미션 + 마스터 풀에서 추림
[ { "id": 1, "icon": "🚶", "title": "동네 한 바퀴 산책하기" }, ... ]
```

### POST /api/v1/rooms/{roomId}/mission — 오늘 미션 정하기
```json
// 직접/후보 선택
{ "source": "DIRECT", "title": "좋아하는 노래 들으며 산책", "icon": "🎵" }
// 또는 후보에서: { "source": "DIRECT", "missionId": 1 }
// 랜덤
{ "source": "RANDOM" }
// res 200 → RoomMissionResponse
// 에러: 오늘 이미 정함 ROOM_409_xxx
```

### POST /api/v1/rooms/{roomId}/proofs — 인증 (multipart/form-data)
```
photo: <file> (필수)
caption: <string> (선택, 최대 80자)
// res 200 → RoomProofResponse
// 에러: 오늘 미션 없음 / 이미 인증함
```

### POST …/proofs/{proofId}/reactions — 리액션 토글
```json
{ "emoji": "🔥" }     // 임의 emoji 문자열. 있으면 제거, 없으면 추가 (토글)
// res 200 → 갱신된 reactions[]
// emoji는 서버에서 길이/유효성만 검증(최대 10자), 종류 제한 없음
```

### POST …/proofs/{proofId}/confirm — 피어 인증해주기
```json
// 본문 없음. 멱등(이미 했으면 무시 또는 409)
// res 200 → { confirmCount, requiredConfirm, status }  // 전원 인증 시 status=VERIFIED
// 본인 인증은 confirm 불가 (ROOM_400_xxx)
```

### POST …/proofs/{proofId}/report — 콘텐츠 신고 (UGC)
```jsonc
// req
{ "reason": "SEXUAL", "detail": "부적절한 사진" }  // reason: SPAM|OFFENSIVE|SEXUAL|VIOLENCE|OTHER (@NotNull), detail: 자유입력(nullable, ≤500)
// res 200 → { "reportId": 555 }
// 본인 인증 신고 불가 (ROOM_400_004), 동일 인증 중복 신고 불가 (ROOM_409_004)
// 프론트: mine=true 인 인증에는 신고 버튼 미노출 (이슈 #71)
```

### POST /api/v1/rooms/{roomId}/members/{memberId}/nudge — 콕 찌르기(재촉)
```json
// 본문 없음. 오늘 미션을 아직 인증하지 않은 멤버를 재촉한다.
// res 200 → { "memberId": 11, "nudged": true }
// 오늘 미션 기준 멱등 — 이미 찔렀으면 저장 없이 nudged:true 반환
// 에러: 본인 찌르기 ROOM_400_002 / 이미 인증 완료한 멤버 ROOM_400_003 / 오늘 미션 없음 ROOM_404_004
```
> RoomDetailResponse 의 `members[]` 각 항목에 `isMe`(본인 여부)·`nudgedByMe`(내가 오늘 찔렀는지) 필드가 추가됨 → Sent 상태 복원·본인 식별용.

### GET /api/v1/rooms/{roomId}/history?month=2026-06 — 지난 기록
```json
// res 200 → 날짜별 그룹
[
  {
    "date": "2026-06-10", "confirmedCount": 3,
    "mission": { "icon": "🚶", "title": "동네 한 바퀴 산책하기" },
    "proofs": [
      { "time": "08:12", "authorNickname": "오프모더", "authorAvatarId": "01",
        "photoUrl": "/uploads/a.jpg", "status": "VERIFIED" }
    ]
  }
]
```

---

## 4. 에러 코드 (ErrorStatus 등록 대상, 메시지 한국어)
| code | 상황 |
|---|---|
| `ROOM_404_001` | 방을 찾을 수 없음 |
| `ROOM_404_002` | 초대코드에 해당하는 방 없음 |
| `ROOM_403_001` | 방 멤버가 아님 / 권한 없음(방장 전용) |
| `ROOM_409_001` | 이미 참여한 방 |
| `ROOM_409_002` | 오늘 미션 이미 정해짐 |
| `ROOM_409_003` | 오늘 이미 인증함 |
| `ROOM_400_001` | 본인 인증은 확인 불가 |
| `ROOM_400_002` | 본인은 콕 찌를 수 없음 |
| `ROOM_400_003` | 이미 인증 완료한 멤버는 찌를 수 없음 |
| `ROOM_400_004` | 본인 인증은 신고 불가 |
| `ROOM_409_004` | 이미 신고한 콘텐츠 |

## 5. 마이그레이션
`db/migration/h2/V*__create_rooms.sql` + `db/migration/mysql/V*__create_rooms.sql` 동시.
테이블: `rooms`, `room_members`, `room_missions`, `room_proofs`, `room_proof_confirms`, `room_reactions`, `room_nudges`(V7), `room_proof_reports`(V9).
`ddl-auto: validate`이므로 엔티티-스키마 일치 필수.

---

## 6. 범위 (1차)
**포함**: RoomList / RoomDetail / CreateRoom / JoinRoom / MissionPicker / RoomSettings /
Verify(Room) / ProofDetail / RoomDetail(Solo) / RoomList·RoomDetail Empty / RoomComplete / RoomHistory
**제외(후순위)**: Mission Profile, 알림/리더보드, JoinRoom 에러 상세
**추가 구현됨(2차)**: 콕 찌르기(nudge) — 위 엔드포인트/에러코드/`room_nudges` 테이블 참고
**추가 구현됨(3차)**: 콘텐츠 신고(report, UGC) — App Store 12+ 심사(이슈 #71). 위 엔드포인트/에러코드/`room_proof_reports` 테이블 + `RoomProofResponse.mine` 참고
