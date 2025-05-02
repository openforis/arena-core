export const determineUTMZoneNumber = (lat: number, lon: number): number => {
  // Special Cases for Norway and Svalbard
  if (lat > 55 && lat < 64 && lon > 2 && lon < 6) {
    return 32
  }
  if (lat > 71 && lon >= 6 && lon < 9) {
    return 31
  }
  if (lat > 71 && ((lon >= 9 && lon < 12) || (lon >= 18 && lon < 21))) {
    return 33
  }
  if (lat > 71 && ((lon >= 21 && lon < 24) || (lon >= 30 && lon < 33))) {
    return 35
  }
  // Calculate standard UTM zone number
  return Math.floor((lon + 180) / 6) + 1
}
