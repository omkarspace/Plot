export const formatRuntime = (minutes: number): string => {
  if (minutes === 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatDaysHours = (minutes: number): string => {
  const totalHours = minutes / 60;
  const days = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  if (days === 0) return `${hours}h`;
  if (hours === 0) return `${days}d`;
  return `${days}d ${hours}h`;
};

export const calculateBingeTime = (
  totalEpisodes: number,
  episodeRuntime: number,
  episodesPerDay: number = 2
): { hours: number; days: number } => {
  const totalMinutes = totalEpisodes * episodeRuntime;
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  const days = Math.round((totalMinutes / (episodesPerDay * episodeRuntime * 60)) * 10) / 10;
  return { hours, days };
};
