---
name: new-screen
description: offmode 컨벤션(useColors+makeStyles+useMemo, <T> 컴포넌트)에 맞는 새 RN 화면을 스캐폴드한다. "새 화면 만들어줘", "스크린 추가", 또는 /new-screen 호출 시 동작. 탭/스택 네비게이션 연결 안내까지 포함.
---

# new-screen — RN 화면 스캐폴드

`screens/<Name>Screen.jsx` 를 offmode 프론트 컨벤션대로 생성하고, `App.jsx` 네비게이션 연결을 안내한다.

## 1. 입력 확인

사용자에게 (없으면) 물어본다: 화면 이름(PascalCase), **탭 화면**인지 **스택(오버레이) 화면**인지, 받을 props.

## 2. 파일 생성 — `screens/<Name>Screen.jsx`

아래 보일러플레이트를 기준으로 생성한다. 텍스트는 전부 `<T>`, 색은 토큰, 스타일은 `makeStyles(C)`+`useMemo`.

```jsx
import React, { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import T from '../components/ThemedText';
import { useColors } from '../utils/ThemeContext';

export default function <Name>Screen({ onBack }) {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.body}>
        <T v="heading"><Name></T>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    body: { flex: 1, padding: 20 },
  });
}
```

> `useColors`/`useTheme`의 정확한 import 경로는 기존 화면(예: `screens/MissionScreen.jsx`)을 Read 해서 맞춘다. 스택 화면이면 `onBack` prop으로 `pop()`을 받는 헤더 뒤로가기 버튼을 추가하고, 탭 화면이면 `onBack`을 빼고 SafeArea/패딩만 둔다.

## 3. 네비게이션 연결 안내

`App.jsx`를 Read 해서 현재 패턴을 확인한 뒤, 해당하는 연결 코드를 **제시**한다(직접 무단 수정보다 사용자 확인 권장):

- **탭 화면**: `TABS` 배열에 `{ key, label, ionicon }` 추가 + `AppInner` 탭 렌더 분기에 `{tab === '<key>' && <<Name>Screen />}` 추가.
- **스택 화면**: 여는 쪽에서 `push('<name>')`, `App.jsx` 스택 분기에
  ```jsx
  {currentStack === '<name>' && (
    <View style={StyleSheet.absoluteFillObject}>
      <<Name>Screen onBack={pop} />
    </View>
  )}
  ```

## 4. 검증

```bash
cd /Users/calla20031/offmode && npm run lint
```
lint 통과 확인 후, 생성 파일 + 연결해야 할 `App.jsx` 변경점을 보고한다. 실기기 동작 확인은 사용자 몫.

## 주의

- `<Text>` 직접 사용 금지(`<T>`만), 하드코딩 색 금지(토큰만).
- `git commit/push` 자동 실행 금지.
