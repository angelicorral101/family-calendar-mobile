import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { apiService, CalendarEvent } from '../services/api';

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

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getEventType(event: CalendarEvent): EventType {
  if (event.summary?.toLowerCase().includes('work')) return 'work';
  if (event.summary?.toLowerCase().includes('kid')) return 'kids';
  if (event.summary?.toLowerCase().includes('holiday')) return 'holiday';
  return 'family';
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const grouped: Record<string, CalendarEvent[]> = {};
  days.forEach(day => { grouped[day] = []; });
  events.forEach(event => {
    const date = new Date(event.start_time);
    const dayName = days[date.getDay()];
    grouped[dayName].push(event);
  });
  return grouped;
}

const WeekView: React.FC = () => {
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.getWeekEvents()
      .then((data) => {
        if (mounted) {
          setEventsByDay(groupEventsByDay(data));
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load events.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>This Week's Events</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.noEvents}>{error}</Text>
      ) : (
        days.map((day) => (
          <View key={day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day}</Text>
              <Text style={styles.eventCount}>
                {eventsByDay[day]?.length || 0} events
              </Text>
            </View>
            {eventsByDay[day]?.length > 0 ? (
              eventsByDay[day].map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.eventTime}>{formatTime(event.start_time)}</Text>
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.summary}</Text>
                  </View>
                  <EventIcon type={getEventType(event)} />
                </View>
              ))
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEvents}>No events</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  dayContainer: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e9',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#49557e',
  },
  eventCount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeContainer: {
    width: 80,
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
  noEventsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noEvents: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
});

export default WeekView; 