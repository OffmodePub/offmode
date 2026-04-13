module.exports = {
  // Expo에서 권장하는 기본 규칙을 가져옵니다.
  extends: ['expo'],
  
  // 우리가 입맛대로 규칙을 바꿀 수 있는 곳이에요.
  rules: {
    // 안 쓰는 변수가 있으면 빨간 줄(error) 대신 노란 줄(warn)로 부드럽게 알려주기
    'no-unused-vars': 'warn',
    
    // 개발하다가 콘솔 로그(console.log) 남겨둔 거 까먹지 않게 경고 띄우기 (원하면 꺼도 돼!)
    'no-console': 'warn',
  },
};