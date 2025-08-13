import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedLoadingScreen({ onFinish }: { onFinish: () => void }) {
  const leftAnim = useRef(new Animated.Value(0)).current;
  const rightAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simulate loading, then animate doors open
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(leftAnim, {
          toValue: -width / 2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(rightAnim, {
          toValue: width / 2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          delay: 700,
          useNativeDriver: true,
        }),
      ]).start(() => onFinish && onFinish());
    }, 900); // Simulate loading delay
  }, [leftAnim, rightAnim, fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      {/* Left Block */}
      <Animated.View
        style={[
          styles.block,
          styles.leftBlock,
          {
            transform: [{ translateX: leftAnim }],
          },
        ]}
      >
        <View style={styles.curveLeft} />
      </Animated.View>
      {/* Right Block */}
      <Animated.View
        style={[
          styles.block,
          styles.rightBlock,
          {
            transform: [{ translateX: rightAnim }],
          },
        ]}
      >
        <View style={styles.curveRight} />
      </Animated.View>
    </Animated.View>
  );
}

const curveWidth = 32;
const curveHeight = height * 0.4;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#111',
    zIndex: 9999,
    flexDirection: 'row',
  },
  block: {
    width: width / 2,
    height: '100%',
    backgroundColor: '#FFD700',
    overflow: 'hidden',
    position: 'relative',
  },
  leftBlock: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'flex-end',
  },
  rightBlock: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    alignItems: 'flex-start',
  },
  curveLeft: {
    width: curveWidth,
    height: curveHeight,
    marginTop: height / 2 - curveHeight / 2,
    backgroundColor: '#111',
    borderTopRightRadius: curveWidth,
    borderBottomRightRadius: curveWidth,
  },
  curveRight: {
    width: curveWidth,
    height: curveHeight,
    marginTop: height / 2 - curveHeight / 2,
    backgroundColor: '#111',
    borderTopLeftRadius: curveWidth,
    borderBottomLeftRadius: curveWidth,
  },
});
