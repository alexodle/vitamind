export interface ProcessedDailyForecast extends DailyForecast {
  date: Date | string
  mintemp: number
  maxtemp: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
  isGoodDay: boolean
}

export interface ProcessedForecast {
  city: string
  results: ProcessedDailyForecast[]
  recommended: boolean
  maxConsecutiveGoodDays: number
  driveTimeMinutes: number
}

export interface City {
  id: number
  name: string
}
