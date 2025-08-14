export const formatDateISO = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const formatSecondsToMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};