import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 화면 하단에 고정 버튼/바를 둘 때 쓰는 하단 여백.
 * - 홈버튼 없는 기기(하단 세이프 인셋 존재): 인디케이터 높이만큼만 (추가 패딩 없음)
 * - 홈버튼 있는 기기(인셋 0): 하단 패딩 24px
 * SafeAreaProvider 하위에서만 호출할 것.
 */
export default function useBottomInset() {
  const insets = useSafeAreaInsets();
  return insets.bottom > 0 ? insets.bottom : 24;
}
