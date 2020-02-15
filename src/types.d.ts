export interface User {
  id: number
  email: string
  email_confirmed: boolean
  user_uuid?: string
}

export interface City {
  id: number
  name: string
  selectable: string
}

export interface UserAlert {
  id: number
  user: Omit<User, 'email_confirmed'>
  city: Omit<City, 'selectable'>
  max_drive_minutes: number
  weath_type: WeathType
  active: boolean
}

export interface UserAlertWithStatus extends UserAlert {
  start_date_forecasted: Date
  end_date_forecasted: Date
  cities_gained: Omit<City, 'selectable'>[]
  cities_lost: Omit<City, 'selectable'>[]
  did_change: boolean
}

export interface UserConf {
  conf_id: string
  user_id?: number
  conf_timestampz?: Date
}

export interface ProcessedDailyForecast {
  date: Date | string
  city_id: number
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
  city: Omit<City, 'selectable'>,
  dateForecasted: Date
  results: ProcessedDailyForecast[]
  recommended: boolean
  maxConsecutiveGoodDays: number
  maxConsecutiveWarmDays: number
  driveTimeMinutes: number
}

// API

export type WeathType = 'sunny' | 'warm'

export interface WeathResult {
  sourceCityForecasts: ProcessedDailyForecast[]
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

export interface GetUserAlertsResult {
  user: User
  userAlerts: UserAlert[]
}
