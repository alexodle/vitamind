import { WeathType, ProcessedDailyForecast } from "./types"
import { WEATH_TYPES, VALID_DRIVE_HOURS } from "./constants"

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

const PST_OFFSET_MILLIS = -8 * 60 * 60 * 1000

const VOWELS = 'aeiou8'

export const capitalizeFirst = (s: string) => s[0].toUpperCase() + s.substr(1)

export const aOrAn = (nextWord: any): 'a' | 'an' => VOWELS.includes(nextWord.toString()[0].toLowerCase()) ? 'an' : 'a'

export const parseBool = (s: string): boolean => s === 'true'

export const isWeekend = (d: Date): boolean => d.getDay() === 5 || d.getDay() === 6

// returns Date in PST
export const getToday = (): Date => {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const newMillis = d.getTime() - offset + PST_OFFSET_MILLIS
  return new Date(newMillis)
}

export const isValidEmail = (email: string) => email && email.length > 3 && EMAIL_REGEX.test(email)

export const isValidWeathType = (weathType: WeathType) => WEATH_TYPES.indexOf(weathType) !== -1

export const isValidDriveHours = (driveHours: number) => VALID_DRIVE_HOURS.indexOf(driveHours) !== -1

const getWeatherImgNames = (df: ProcessedDailyForecast): [string, string, string] => {
  if (df.rainpct >= 20) {
    return ['rain_s_cloudy.png', 'rain_s_cloudy_30_30.png', 'Rainy']
  } else if (df.cloudcover > 75) {
    return ['cloudy.png', 'cloudy_30_30.png', 'Cloudy']
  } else if (df.cloudcover > 25) {
    return ['partly_cloudy.png', 'partly_cloudy_30_30.png', 'Partly cloudy']
  }
  return ['sunny.png', 'sunny_30_30.png', 'Sunny']
}
export const getWeatherImgs = (df: ProcessedDailyForecast): [string, string, string] => {
  const [img, imgSmall, alt] = getWeatherImgNames(df)
  return [`${process.env.ASSET_URL}/imgs/${img}`, `${process.env.ASSET_URL}/imgs/${imgSmall}`, alt]
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

export const friendlyTemp = (temp: number): JSX.Element => <span>{Math.round(temp)}&deg;F</span>

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const friendlyDayLong = (day: number): string => DAYS[day]

const SHORT_DAYS = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
export const friendlyDayShort = (day: number): string => SHORT_DAYS[day]

export const friendlyDay = (day: number): [string, string] => [friendlyDayLong(day), friendlyDayShort(day)]
