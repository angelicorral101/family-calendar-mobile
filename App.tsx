import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useAnimatedGestureHandler } from 'react-native-reanimated';
import TodayView from './components/TodayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import VoiceCommandView from './components/VoiceCommandView';
import ConversationalVoiceView from './components/ConversationalVoiceView';

const { width } = Dimensions.get('window');

type ContextType = { startX: number };

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const translateX = useSharedValue(0);

  const pages = [
    { component: ConversationalVoiceView, title: 'Chat' },
    { component: VoiceCommandView, title: 'Voice' },
    { component: TodayView, title: 'Today' },
    { component: WeekView, title: 'Week' },
    { component: MonthView, title: 'Month' },
  ];

  const CurrentComponent = pages[currentPage].component;

  // Real-time tracking with Reanimated 2 gesture handler
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      const swipeThreshold = width * 0.3;
      if (event.translationX < -swipeThreshold && currentPage < pages.length - 1) {
        translateX.value = withTiming(-width, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
          runOnJS(setCurrentPage)(currentPage + 1);
          translateX.value = 0;
        });
      } else if (event.translationX > swipeThreshold && currentPage > 0) {
        translateX.value = withTiming(width, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
          runOnJS(setCurrentPage)(currentPage - 1);
          translateX.value = 0;
        });
      } else {
        translateX.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.pageIndicator}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage && styles.activeDot
              ]}
            />
          ))}
        </View>
        <Text style={styles.title}>{pages[currentPage].title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Page Content with Real-time Gesture Tracking */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <CurrentComponent />
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
});

export default App;