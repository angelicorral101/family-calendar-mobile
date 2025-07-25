import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { apiService, CalendarEvent } from '../services/api';
import { useCalendar } from './CalendarContext';

// Event type definitions
type EventType = 'work' | 'family' | 'holiday' | 'kids';

// Icon component for event types
const EventIcon: React.FC<{ type: EventType }> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'work':
        return '💼';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'holiday':
        return '🎉';
      case 'kids':
        return '👶';
      default:
        return '📅';
    }
  };

  return (
    <View style={[styles.iconContainer, styles[`${type}Icon`]]}>
      <Text style={styles.iconText}>{getIcon()}</Text>
    </View>
  );
};

const TodayView: React.FC = () => {
  const { selectedDate } = useCalendar();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Calculate start and end of the selected day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    apiService.getEvents(startOfDay, endOfDay)
      .then((data) => {
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError('Failed to load events.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedDate]);

  const renderItem = ({ item }: { item: CalendarEvent }) => (
    <View style={styles.eventItem}>
      <View style={styles.timeContainer}>
        <Text style={styles.eventTime}>{formatTime(item.start_time)}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.summary}</Text>
      </View>
      <EventIcon type={getEventType(item)} />
    </View>
  );

  function getEventType(event: CalendarEvent): EventType {
    // You may want to infer type from event.summary/description or add a type field in backend
    if (event.summary?.toLowerCase().includes('work')) return 'work';
    if (event.summary?.toLowerCase().includes('kid')) return 'kids';
    if (event.summary?.toLowerCase().includes('holiday')) return 'holiday';
    return 'family';
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{formatDate(selectedDate)}'s Events</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.noEvents}>{error}</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.noEvents}>No events for this day.</Text>}
        />
      )}
    </View>
  );
};

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeContainer: {
    width: 90,
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconText: {
    fontSize: 16,
  },
  workIcon: {
    backgroundColor: '#e3f2fd',
  },
  familyIcon: {
    backgroundColor: '#f3e5f5',
  },
  holidayIcon: {
    backgroundColor: '#fff3e0',
  },
  kidsIcon: {
    backgroundColor: '#e8f5e8',
  },
  noEvents: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 16,
  },
});

export default TodayView; 