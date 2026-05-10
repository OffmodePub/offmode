module.exports = {
  extends: ['expo'],
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
      // ThemedText.js 자체는 예외
      files: ['components/ThemedText.js'],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};