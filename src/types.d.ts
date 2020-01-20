export interface DailyForecast {
  date: Date | string
  mintemp: number
  maxtemp: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
}

export interface Forecast {
  city: string
  results: DailyForecast[]
}

export interface EvaluatedDailyForecast extends DailyForecast {
  isGoodDay: boolean
}

export interface EvaluatedForecast extends Omit<Forecast, 'results'> {
  results: EvaluatedDailyForecast[]
  recommended: boolean
  maxConsecutiveGoodDays: number
}
