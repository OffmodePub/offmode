import React from 'react';
import { View, Image } from 'react-native';

/** 아바타 얼굴 이미지 렌더러 — source가 없으면 같은 크기의 빈 자리 유지 */
export default function AvatarImage({ source, width = 72, height = 72 }) {
  if (!source) return <View style={{ width, height }} />;
  return <Image source={source} style={{ width, height }} resizeMode="contain" />;
}
