import { WeathType, ProcessedDailyForecast } from "./types"
import { WEATH_TYPES } from "./constants"

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

export const isValidEmail = (email: string) => EMAIL_REGEX.test(email)

export const isValidWeathType = (weathType: WeathType) => WEATH_TYPES.indexOf(weathType) !== -1

export const getWeatherImg = (df: ProcessedDailyForecast): [string, string, string] => {
  if (df.rainpct >= 20) {
    return ['rain_s_cloudy.png', 'rain_s_cloudy_30_30.png', 'Rainy']
  } else if (df.cloudcover > 75) {
    return ['cloudy.png', 'cloudy_30_30.png', 'Cloudy']
  } else if (df.cloudcover > 25) {
    return ['partly_cloudy.png', 'partly_cloudy_30_30.png', 'Partly cloudy']
  }
  return ['sunny.png', 'sunny_30_30.png', 'Sunny']
}

export const friendlyHoursText = (driveTimeMinutes: number): string => {
  const driveTimeHours = Math.round(driveTimeMinutes / 60)
  if (driveTimeHours < 1) {
    return 'Less than an hour'
  } else if (driveTimeHours === 1) {
    return '1 hour'
  }
  return `${driveTimeHours} hours`
}

export const friendlyTemp = (temp: number): string => {
  return `${Math.round(temp)}\u00B0F`
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const friendlyDayLong = (day: number): string => DAYS[day]

const SHORT_DAYS = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
export const friendlyDayShort = (day: number): string => SHORT_DAYS[day]

export const friendlyDay = (day: number): [string, string] => [friendlyDayLong(day), friendlyDayShort(day)]
