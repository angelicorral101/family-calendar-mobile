import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
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

const MonthView: React.FC = () => {
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  const { monthRange } = useCalendar();

  // Use monthRange if available, otherwise use current month
  const currentDate = monthRange ? monthRange[0] : new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.getMonthEvents()
      .then((data) => {
        if (mounted) {
          setMonthEvents(data);
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
  }, [monthRange]);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
    });

    return () => subscription?.remove();
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const days: any[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Add day headers
    dayNames.forEach(day => {
      days.push({ type: 'header', value: day });
    });
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ type: 'empty', value: '' });
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = monthEvents.filter(event => {
        const eventDate = new Date(event.start_time).getDate();
        return eventDate === day;
      });
      days.push({ type: 'day', value: day, events: dayEvents });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleDayPress = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const renderDay = (day: any, index: number) => {
    if (day.type === 'header') {
      return (
        <View key={index} style={[
          styles.dayHeader,
          orientation === 'landscape' && styles.dayHeaderLandscape
        ]}>
          <Text style={[
            styles.dayHeaderText,
            orientation === 'landscape' && styles.dayHeaderTextLandscape
          ]}>{day.value}</Text>
        </View>
      );
    }
    if (day.type === 'empty') {
      return <View key={index} style={[
        styles.emptyDay,
        orientation === 'landscape' && styles.emptyDayLandscape
      ]} />;
    }
    const isToday = day.value === currentDate.getDate();
    const isSelected = selectedDay === day.value;
    const hasEvents = day.events && day.events.length > 0;
    
    return (
      <TouchableOpacity 
        key={index} 
        style={[
          styles.calendarDay,
          orientation === 'landscape' && styles.calendarDayLandscape,
          isToday && styles.today,
          isSelected && styles.selectedDay
        ]}
        onPress={() => handleDayPress(day.value)}
      >
        <Text style={[
          styles.dayNumber,
          orientation === 'landscape' && styles.dayNumberLandscape,
          isToday && styles.todayText,
          isSelected && styles.selectedDayText
        ]}>{day.value}</Text>
        
        {hasEvents && (
          <View style={[
            styles.eventIndicators,
            orientation === 'landscape' && styles.eventIndicatorsLandscape
          ]}>
            {orientation === 'landscape' ? (
              // Show event descriptions in landscape
              day.events.slice(0, 2).map((event: CalendarEvent, eventIndex: number) => (
                <View key={eventIndex} style={styles.eventDescriptionContainer}>
                  <Text style={styles.eventDescription} numberOfLines={1}>
                    {formatTime(event.start_time)} {event.summary}
                  </Text>
                </View>
              ))
            ) : (
              // Show icons in portrait
              <>
                {day.events.slice(0, 3).map((event: CalendarEvent, eventIndex: number) => (
                  <EventIcon key={eventIndex} type={getEventType(event)} />
                ))}
                {day.events.length > 3 && (
                  <Text style={styles.moreEvents}>+{day.events.length - 3}</Text>
                )}
              </>
            )}
            {orientation === 'landscape' && day.events.length > 2 && (
              <Text style={styles.moreEventsLandscape}>+{day.events.length - 2}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSelectedDayEvents = () => {
    if (!selectedDay) {
      return (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Event Types:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <EventIcon type="work" />
              <Text style={styles.legendText}>Work</Text>
            </View>
            <View style={styles.legendItem}>
              <EventIcon type="family" />
              <Text style={styles.legendText}>Family</Text>
            </View>
            <View style={styles.legendItem}>
              <EventIcon type="kids" />
              <Text style={styles.legendText}>Kids</Text>
            </View>
            <View style={styles.legendItem}>
              <EventIcon type="holiday" />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
          </View>
        </View>
      );
    }
    const selectedDayEvents = monthEvents.filter(event => {
      const eventDate = new Date(event.start_time).getDate();
      return eventDate === selectedDay;
    });
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return (
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          {monthNames[currentMonth]} {selectedDay}, {currentYear}
        </Text>
        {selectedDayEvents.length > 0 ? (
          selectedDayEvents.map((event) => (
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
          <Text style={styles.noEvents}>No events on this day</Text>
        )}
      </View>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <ScrollView style={[
      styles.container,
      orientation === 'landscape' && styles.containerLandscape
    ]} showsVerticalScrollIndicator={false}>
      <Text style={[
        styles.header,
        orientation === 'landscape' && styles.headerLandscape
      ]}>{monthNames[currentMonth]} {currentYear}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.noEvents}>{error}</Text>
      ) : (
        <>
          <View style={[
            styles.calendarContainer,
            orientation === 'landscape' && styles.calendarContainerLandscape
          ]}>
            <View style={[
              styles.calendarGrid,
              orientation === 'landscape' && styles.calendarGridLandscape
            ]}>
              {calendarDays.map((day, index) => renderDay(day, index))}
            </View>
          </View>
          {renderSelectedDayEvents()}
        </>
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
  containerLandscape: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#49557e',
  },
  emptyDay: {
    width: '14.28%',
    height: 80,
  },
  calendarDay: {
    width: '14.28%',
    height: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9e9e9',
    backgroundColor: '#fff',
  },
  today: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  selectedDay: {
    backgroundColor: '#7F',
    borderColor: '#7',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  iconText: {
    fontSize: 10,
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
  moreEvents: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  eventsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#49557e',
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
    width: 90,
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 600,
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
  noEvents: {
    fontSize: 14,
    color: '#adb5bd',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20
  },
  legend: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#49557e',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  // Landscape styles
  headerLandscape: {
    fontSize: 24,
    marginBottom: 16,
  },
  dayHeaderLandscape: {
    height: 30,
    marginBottom: 4,
  },
  dayHeaderTextLandscape: {
    fontSize: 12,
  },
  emptyDayLandscape: {
    height: 120,
  },
  calendarDayLandscape: {
    height: 120,
    padding: 2,
  },
  dayNumberLandscape: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventIndicatorsLandscape: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  eventDescriptionContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginVertical: 1,
    width: '100%',
  },
  eventDescription: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  moreEventsLandscape: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: 'bold',
    marginTop: 2,
  },
  calendarContainerLandscape: {
    padding: 8,
    marginBottom: 16,
  },
  calendarGridLandscape: {
    // Keep existing flexDirection and flexWrap
  },
});

export default MonthView; 