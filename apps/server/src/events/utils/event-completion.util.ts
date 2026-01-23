/**
 * Utility functions for checking event completion status
 */

/**
 * Check if an event is completed.
 * An event is considered completed when its endDate has passed.
 *
 * @param event - Event object with endDate property
 * @returns true if the event is completed, false otherwise
 */
export function isEventCompleted(event: { endDate: Date | string }): boolean {
  const endDate = typeof event.endDate === 'string' 
    ? new Date(event.endDate) 
    : event.endDate;
  return new Date() > endDate;
}
