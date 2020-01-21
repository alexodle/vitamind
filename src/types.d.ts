export interface EvaluatedDailyForecast extends DailyForecast {
  date: Date | string
  mintemp: number
  maxtemp: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
  isGoodDay: boolean
}

export interface EvaluatedForecast {
  city: string
  results: EvaluatedDailyForecast[]
  recommended: boolean
  maxConsecutiveGoodDays: number
}
