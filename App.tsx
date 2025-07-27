import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, Button, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, useAnimatedGestureHandler } from 'react-native-reanimated';
import TodayView from './components/TodayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import VoiceCommandView from './components/VoiceCommandView';
import ConversationalVoiceView from './components/ConversationalVoiceView';
import { CalendarProvider, useCalendar } from './components/CalendarContext';
import FloatingMicButton from './components/FloatingMicButton';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './components/AuthContext';
import FloatingChoresButton from './components/FloatingChoresButton';
import ChoresModal from './components/ChoresModal';

const { width, height } = Dimensions.get('window');

type ContextType = { startX: number };

// Orientation detection
const isLandscape = () => width > height;

const pages = [
  // { component: ConversationalVoiceView, title: 'Chat' }, // Removed
  { component: TodayView, title: 'Today' },   // 0
  { component: WeekView, title: 'Week' },     // 1
  { component: MonthView, title: 'Month' },   // 2
];

// Create gesture handler factory to prevent recreation
const createGestureHandler = (
  translateX: Animated.SharedValue<number>,
  setCurrentPage: (page: number) => void,
  currentPageRef: React.MutableRefObject<number>
) => {
  return useAnimatedGestureHandler({
    onStart: (_: any, ctx: ContextType) => {
      ctx.startX = translateX.value;
    },
    onActive: (event: any, ctx: ContextType) => {
      translateX.value = ctx.startX + event.nativeEvent.translationX;
    },
    onEnd: (event: any) => {
      const swipeThreshold = width * 0.3;
      const currentPageIndex = currentPageRef.current;
      
      if (event.nativeEvent.translationX < -swipeThreshold && currentPageIndex < pages.length - 1) {
        translateX.value = withTiming(-width, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
          runOnJS(setCurrentPage)(currentPageIndex + 1);
          translateX.value = 0;
        });
      } else if (event.nativeEvent.translationX > swipeThreshold && currentPageIndex > 0) {
        translateX.value = withTiming(width, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
          runOnJS(setCurrentPage)(currentPageIndex - 1);
          translateX.value = 0;
        });
      } else {
        translateX.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      }
    },
  });
};

const AppContent: React.FC = () => {
  // All hooks must be called before any early return!
  const { currentPage, setCurrentPage } = useCalendar();
  const { token, loading } = useAuth();
  const [showChores, setShowChores] = useState(false);
  const translateX = useSharedValue(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(isLandscape() ? 'landscape' : 'portrait');
  
  // Safety check to ensure currentPage is within bounds
  const safeCurrentPage = Math.max(0, Math.min(currentPage, pages.length - 1));
  const CurrentComponent = pages[safeCurrentPage].component;
  
  // Use ref to store latest currentPage to avoid stale closure
  const currentPageRef = useRef(safeCurrentPage);
  currentPageRef.current = safeCurrentPage;

  // Debug log for currentPage
  console.log('[AppContent] currentPage:', currentPage, 'safeCurrentPage:', safeCurrentPage);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      console.log('Orientation changed to:', newOrientation, 'Dimensions:', window.width, 'x', window.height);
      setOrientation(newOrientation);
    });

    return () => subscription?.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Only return after all hooks are called
  if (loading) return null;
  if (!token) return <AuthScreen />;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Navigation Header */}
      <View style={[
        styles.header,
        orientation === 'landscape' && styles.headerLandscape
      ]}>
        <View style={styles.pageIndicator}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === safeCurrentPage && styles.activeDot
              ]}
            />
          ))}
        </View>
        <Text style={[
          styles.title,
          orientation === 'landscape' && styles.titleLandscape
        ]}>{pages[safeCurrentPage].title} ({orientation})</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Swipe Navigation with Smooth Transitions */}
      <PanGestureHandler
        onGestureEvent={(event) => {
          const { translationX } = event.nativeEvent;
          
          // Only process if not already swiping
          if (isSwiping) return;
          
          if (translationX < -100 && safeCurrentPage < pages.length - 1) {
            setIsSwiping(true);
            translateX.value = withTiming(-width, { duration: 300 }, () => {
              runOnJS(setCurrentPage)(safeCurrentPage + 1);
              translateX.value = 0;
              runOnJS(setIsSwiping)(false);
            });
          } else if (translationX > 100 && safeCurrentPage > 0) {
            setIsSwiping(true);
            translateX.value = withTiming(width, { duration: 300 }, () => {
              runOnJS(setCurrentPage)(safeCurrentPage - 1);
              translateX.value = 0;
              runOnJS(setIsSwiping)(false);
            });
          }
        }}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          <CurrentComponent />
        </Animated.View>
      </PanGestureHandler>
      
      <FloatingMicButton />
      <FloatingChoresButton onPress={() => setShowChores(true)} />
      {showChores && <ChoresModal visible={showChores} onClose={() => setShowChores(false)} />}
    </GestureHandlerRootView>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <CalendarProvider>
      <AppContent />
    </CalendarProvider>
  </AuthProvider>
);

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
  headerLandscape: {
    paddingTop: 20,
    paddingBottom: 5,
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
  titleLandscape: {
    fontSize: 18,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;