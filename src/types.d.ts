export interface User {
  id: number
  email: string
  email_confirmed: bool

  // secret
  email_conf_uuid?: string
}

export interface UserAlert {
  user_id: number
  city_id: number
  max_drive_minutes: number

  // secret
  unique_id?: string
}

export interface ProcessedDailyForecast extends DailyForecast {
  date: Date | string
  mintemp: number
  maxtemp: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
  isGoodDay: boolean
  isWarmDay: boolean
}

export interface ProcessedForecast {
  city: string
  results: ProcessedDailyForecast[]
  recommended: boolean
  maxConsecutiveGoodDays: number
  maxConsecutiveWarmDays: number
  driveTimeMinutes: number
}

export interface City {
  id: number
  name: string
  selectable: string
}

// API

export type WeathType = 'sunny' | 'warm'

export interface WeathResult {
  forecasts: ProcessedForecast[]
  city: City
  limit: number
  weathType: WeathType,

  driveHoursRequested: number
  minimumDriveHours: number

  // Included if there were 0 forecasts within the radius
  forecastsOutsideRadius: ProcessedForecast[]
}

export interface PostUserAlertResult {
  user: User
  userAlert: UserAlert
}
