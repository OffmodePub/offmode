import { useEffect, useRef } from 'react';

/*
 * 설정 시간 감지 → 미션 룰렛 트리거 훅.
 *
 * 정책 (CLAUDE.md "미션 룰렛 자동 트리거 정책"):
 * - 같은 분(HH:MM) 안에 이미 트리거됐으면 재트리거하지 않는다
 * - 오늘 미션이 이미 있으면(hasMission) 시간을 바꿔도 재트리거하지 않는다
 */
export default function useMissionRouletteTrigger(missionTime, hasMission, onTrigger) {
  const lastTriggeredRef = useRef(null);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const key = `${now.getHours()}:${now.getMinutes()}`;
      if (
        now.getHours()   === missionTime.hour &&
        now.getMinutes() === missionTime.minute &&
        lastTriggeredRef.current !== key &&
        !hasMission   // 오늘 미션이 없을 때만 룰렛 트리거
      ) {
        lastTriggeredRef.current = key;
        onTriggerRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [missionTime, hasMission]);
}
