"use client";

import { CalendarProvider, CalendarDate, CalendarMonthPicker, CalendarYearPicker, CalendarDatePagination, CalendarHeader, CalendarBody, CalendarItem } from '@/components/ui/kibo-ui/calendar';

const sampleFeatures = [
  {
    id: '1',
    name: 'Feature Meeting',
    startAt: new Date(2025, 8, 6),
    endAt: new Date(2025, 8, 6),
    status: { id: '1', name: 'Scheduled', color: '#007bff' }
  },
  {
    id: '2',
    name: 'Code Review',
    startAt: new Date(2025, 8, 10),
    endAt: new Date(2025, 8, 10),
    status: { id: '2', name: 'Completed', color: '#28a745' }
  },
  {
    id: '3',
    name: 'User Testing',
    startAt: new Date(2025, 8, 15),
    endAt: new Date(2025, 8, 17),
    status: { id: '3', name: 'In Progress', color: '#ffc107' }
  }
];

export default function TestCalendar() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Calendar Test Component</h1>
      <CalendarProvider>
        <CalendarDate>
          <CalendarMonthPicker />
          <CalendarYearPicker start={2023} end={2026} />
          <CalendarDatePagination />
        </CalendarDate>
        <CalendarHeader />
        <CalendarBody features={sampleFeatures}>
          {({ feature }) => <CalendarItem feature={feature} />}
        </CalendarBody>
      </CalendarProvider>
    </div>
  );
}