import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

export type TimeSlot = 'dopoledne' | 'odpoledne';

export interface TimeSlotOption {
  date: Date;
  dateString: string;
  displayDate: string;
  slot: TimeSlot;
  displayLabel: string;
}

/**
 * Calculate available arrival time slots
 * Arrival: 2 days before startDate + 1 day after startDate
 */
export function getArrivalTimeSlots(startDate: string): TimeSlotOption[] {
  const start = parseISO(startDate);
  const arrivalStart = addDays(startOfDay(start), -2); // 2 days before
  const arrivalEnd = addDays(startOfDay(start), 1); // 1 day after

  const slots: TimeSlotOption[] = [];
  let currentDate = arrivalStart;

  while (currentDate <= arrivalEnd) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    slots.push(
      {
        date: new Date(currentDate),
        dateString,
        displayDate: format(currentDate, 'EEEE d.M.', { locale: cs }),
        slot: 'dopoledne',
        displayLabel: `${format(currentDate, 'EEEE d.M.', { locale: cs })} - dopoledne`,
      },
      {
        date: new Date(currentDate),
        dateString,
        displayDate: format(currentDate, 'EEEE d.M.', { locale: cs }),
        slot: 'odpoledne',
        displayLabel: `${format(currentDate, 'EEEE d.M.', { locale: cs })} - odpoledne`,
      },
    );
    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

/**
 * Calculate available leave time slots
 * Leave: day before endDate to endDate
 */
export function getLeaveTimeSlots(endDate: string): TimeSlotOption[] {
  const end = parseISO(endDate);
  const leaveStart = addDays(startOfDay(end), -1); // day before
  const leaveEnd = startOfDay(end);

  const slots: TimeSlotOption[] = [];
  let currentDate = leaveStart;

  while (currentDate <= leaveEnd) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    slots.push(
      {
        date: new Date(currentDate),
        dateString,
        displayDate: format(currentDate, 'EEEE d.M.', { locale: cs }),
        slot: 'dopoledne',
        displayLabel: `${format(currentDate, 'EEEE d.M.', { locale: cs })} - dopoledne`,
      },
      {
        date: new Date(currentDate),
        dateString,
        displayDate: format(currentDate, 'EEEE d.M.', { locale: cs }),
        slot: 'odpoledne',
        displayLabel: `${format(currentDate, 'EEEE d.M.', { locale: cs })} - odpoledne`,
      },
    );
    currentDate = addDays(currentDate, 1);
  }

  return slots;
}

/**
 * Convert time slot selection to a DateTime
 * dopoledne = 10:00, odpoledne = 14:00
 */
export function timeSlotToDateTime(dateString: string, slot: TimeSlot, manualTime?: string): Date {
  const date = parseISO(dateString);
  
  if (manualTime) {
    // Parse manual time (HH:mm format)
    const [hours, minutes] = manualTime.split(':').map(Number);
    date.setHours(hours, minutes || 0, 0, 0);
    return date;
  }

  // Default times for slots
  if (slot === 'dopoledne') {
    date.setHours(10, 0, 0, 0);
  } else {
    date.setHours(14, 0, 0, 0);
  }

  return date;
}
