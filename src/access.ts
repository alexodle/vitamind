import { Pool } from 'pg'
import { ProcessedForecast } from './types'
import { groupBy } from 'lodash'

const NDAYS = 6

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STR_NODE
})

function addDays(d: Date, days: number): Date {
  const newDate = new Date(d.valueOf())
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

function isoDate(d: Date): string {
  return d.toISOString().substr(0, 10)
}

export async function getAllLatestProcesssedForecasts(): Promise<ProcessedForecast[]> {
  const today = new Date()

  const latestDateResult = await pool.query(`SELECT MAX(date_forecasted) FROM processed_forecast LIMIT 1;`)
  const dateForecasted: Date = latestDateResult.rows[0].max

  const processedFcResults = await pool.query(`
    SELECT city.id AS city_id, city.name AS city_name, date_forecasted, max_consecutive_good_days, is_recommended, good_days_csl, ndays
    FROM processed_forecast
    RIGHT JOIN city ON city.id = processed_forecast.city_id
    WHERE date_forecasted = $1;
  `, [dateForecasted])

  const [fc_date_start, fc_date_end] = [today, addDays(dateForecasted, NDAYS)]
  const fcResults = await pool.query(`
    SELECT city_id, fc_date, mintemp, maxtemp, minfeel, maxfeel, cloudcover, rainpct, date_forecasted
    FROM forecast
    WHERE date_forecasted = $1 AND fc_date >= $2 AND fc_date < $3
    ORDER BY city_id, fc_date;
  `, [dateForecasted, fc_date_start, fc_date_end]
  )

  const fcResultsByCity = groupBy(fcResults.rows, r => r.city_id)
  const pfcs: ProcessedForecast[] = processedFcResults.rows.map(pfcr => ({
    city: pfcr.city_name,
    recommended: pfcr.is_recommended,
    maxConsecutiveGoodDays: pfcr.max_consecutive_good_days,
    results: fcResultsByCity[pfcr.city_id].map(r => ({
      date: r.fc_date,
      mintemp: r.mintemp,
      maxtemp: r.maxtemp,
      maxfeel: r.maxfeel,
      minfeel: r.minfeel,
      cloudcover: r.cloudcover,
      rainpct: r.rainpct,
      isGoodDay: pfcr.good_days_csl.indexOf(isoDate(r.fc_date as Date)) !== -1
    }))
  }))

  return pfcs
}
