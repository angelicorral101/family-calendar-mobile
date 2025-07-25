import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CalendarContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  triggerMic: () => void;
  setTriggerMic: (fn: () => void) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  monthRange?: [Date, Date];
  setMonthRange?: (range: [Date, Date]) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [triggerMic, setTriggerMic] = useState<() => void>(() => () => {});
  const [currentPage, setCurrentPage] = useState(0);
  const [monthRange, setMonthRange] = useState<[Date, Date] | undefined>(undefined);

  return (
    <CalendarContext.Provider value={{ selectedDate, setSelectedDate, triggerMic, setTriggerMic, currentPage, setCurrentPage, monthRange, setMonthRange }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 