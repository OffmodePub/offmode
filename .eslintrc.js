module.exports = {
  root: true,
  extends: ['expo'],
  // 백엔드는 Gradle 프로젝트라 프론트 lint 대상이 아니다.
  // 특히 ./gradlew test 가 만드는 backend/build/reports/jacoco 의 서드파티 JS가
  // no-undef 에러로 잡혀서, 백엔드 테스트를 돌린 뒤에는 커밋 훅이 항상 막혔다.
  ignorePatterns: ['backend/'],
  env: {
    browser: true, // setTimeout, setInterval, requestAnimationFrame 등 전역 허용
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',

    // <Text> 직접 사용 금지 — 반드시 components/ThemedText.js의 <T> 사용
    // 기존 위반은 issue #12에서 순차 수정 예정. 수정 완료 후 error로 격상
    'no-restricted-imports': ['warn', {
      paths: [{
        name: 'react-native',
        importNames: ['Text'],
        message: '<Text> 직접 사용 금지. components/ThemedText.js의 <T> 컴포넌트를 사용하세요.',
      }],
    }],
  },
  overrides: [
    {
      // 텍스트 래퍼 컴포넌트 자체는 예외 (ThemedText=기본, WarmText=웜 리디자인)
      files: ['components/ThemedText.js', 'components/WarmText.jsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};