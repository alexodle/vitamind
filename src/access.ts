import { Pool } from 'pg'
import { ProcessedForecast, City } from './types'
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

async function getLatestForecastDate(): Promise<Date> {
  const latestDateResult = await pool.query(`SELECT MAX(date_forecasted) FROM processed_forecast LIMIT 1;`)
  const dateForecasted: Date = latestDateResult.rows[0].max
  return dateForecasted
}

export async function getCity(id: number): Promise<City | null> {
  const targetCityResults = await pool.query(`SELECT id, name FROM city WHERE id = $1`, [id])
  if (targetCityResults.rowCount < 1) return null
  return targetCityResults.rows[0]
}

export async function buildProcessedForecasts(dateForecasted: Date, processedFcResults: any[]): Promise<ProcessedForecast[]> {
  const today = new Date()
  const cities: number[] = processedFcResults.map(pfcr => pfcr.city_id)

  const [fc_date_start, fc_date_end] = [today, addDays(dateForecasted, NDAYS)]
  const fcResults = await pool.query(`
    SELECT city_id, fc_date, mintemp, maxtemp, minfeel, maxfeel, cloudcover, rainpct, date_forecasted
    FROM forecast
    WHERE date_forecasted = $1 AND fc_date >= $2 AND fc_date < $3 AND city_id = ANY($4::int[])
    ORDER BY city_id, fc_date;
  `, [dateForecasted, fc_date_start, fc_date_end, cities]
  )

  const fcResultsByCity = groupBy(fcResults.rows, r => r.city_id)
  const pfcs: ProcessedForecast[] = processedFcResults.map(pfcr => ({
    city: pfcr.city_name,
    recommended: pfcr.is_recommended,
    maxConsecutiveGoodDays: pfcr.max_consecutive_good_days,
    driveTimeMinutes: pfcr.gmap_drive_time_minutes,
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

export async function getRecommendationsForCity(targetCityID: number, radiusDriveHours: number, limit: number): Promise<ProcessedForecast[]> {
  const dateForecasted = await getLatestForecastDate()

  if (process.env.NODE_ENV !== 'production') {
    console.log('Query params:' + [dateForecasted, targetCityID, radiusDriveHours * 60, limit])
  }

  const processedFcResults = await pool.query(`
    SELECT
      city.id AS city_id, city.name AS city_name, date_forecasted, max_consecutive_good_days, is_recommended, good_days_csl, ndays,
      ctt.gmap_drive_time_minutes AS gmap_drive_time_minutes
    FROM processed_forecast pf
    JOIN city ON city.id = pf.city_id
    JOIN city_travel_time ctt ON (ctt.citya_id = $2 AND ctt.cityb_id = pf.city_id) OR (ctt.cityb_id = $2 AND ctt.citya_id = pf.city_id)
    WHERE date_forecasted = $1 AND is_recommended = TRUE AND ctt.gmap_drive_time_minutes <= $3
    ORDER BY ctt.gmap_drive_time_minutes ASC
    LIMIT $4;
  `, [dateForecasted, targetCityID, radiusDriveHours * 60, limit])

  return await buildProcessedForecasts(dateForecasted, processedFcResults.rows)
}

export async function getAllLatestProcesssedForecasts(): Promise<ProcessedForecast[]> {
  const dateForecasted = await getLatestForecastDate()

  const processedFcResults = await pool.query(`
    SELECT city.id AS city_id, city.name AS city_name, date_forecasted, max_consecutive_good_days, is_recommended, good_days_csl, ndays
    FROM processed_forecast
    RIGHT JOIN city ON city.id = processed_forecast.city_id
    WHERE date_forecasted = $1;
  `, [dateForecasted])

  return await buildProcessedForecasts(dateForecasted, processedFcResults.rows)
}
