export const buildBaseContext = () => {
  return {
    system: {
      currentTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };
};