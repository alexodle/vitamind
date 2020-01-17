export interface DailyForecast {
  min: number
  max: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
}

export interface Forecast {
  city: string
  results: [Date, DailyForecast][]
}

export interface EvaluatedDailyForecast extends DailyForecast {
  isGoodDay: boolean
}

export interface EvaluatedForecast extends Omit<Forecast, 'results'> {
  results: [Date, EvaluatedDailyForecast][]
  recommended: boolean
  maxConsecutiveGoodDays: number
}
