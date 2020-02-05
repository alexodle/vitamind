import { groupBy } from 'lodash'
import moment from 'moment'
import { Pool } from 'pg'
import { MAX_DRIVE_MINUTES } from '../src/constants'
import { sendConfirmationEmail } from './email_conf_access'
import { NotFoundError } from './errors'
import { City, ProcessedForecast, User, UserAlert } from './types'

const NDAYS = 6

export const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STR_NODE
})

// pg-postgres uses the local timezone when converting dates from the DB. We want to normalize to always using the PST timezone.
const WEST_COAST_OFFSET = 480
function hackNormalizePgDate(d: Date): Date {
  return moment(isoDate(d)).utcOffset(WEST_COAST_OFFSET, true).toDate()
}

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

async function buildProcessedForecasts(dateForecasted: Date, processedFcResults: any[]): Promise<ProcessedForecast[]> {
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
      date: hackNormalizePgDate(r.fc_date),
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

export async function getUser(id: number): Promise<User> {
  const result = await pool.query(`SELECT id, email, email_confirmed FROM users WHERE id = $1;`, [id])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }
  return result.rows[0]
}

export async function getCity(id: number): Promise<City> {
  const result = await pool.query(`SELECT id, name, selectable FROM city WHERE id = $1`, [id])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }
  return result.rows[0]
}

export async function getRecommendationsForCity(targetCityID: number, limit: number): Promise<ProcessedForecast[]> {
  const dateForecasted = await getLatestForecastDate()

  if (process.env.NODE_ENV !== 'production') {
    console.log('Query params:' + [dateForecasted, targetCityID, limit])
  }

  const processedFcResults = await pool.query(`
    SELECT
      city.id AS city_id, city.name AS city_name, date_forecasted, max_consecutive_good_days, is_recommended, good_days_csl, ndays,
      ctt.gmap_drive_time_minutes AS gmap_drive_time_minutes
    FROM processed_forecast pf
    JOIN city ON city.id = pf.city_id
    JOIN city_travel_time_all ctt ON ctt.city_from_id = $2 AND ctt.city_to_id = pf.city_id
    WHERE date_forecasted = $1 AND is_recommended = TRUE AND ctt.gmap_drive_time_minutes <= $3
    ORDER BY ctt.gmap_drive_time_minutes ASC
    LIMIT $4;
  `, [dateForecasted, targetCityID, MAX_DRIVE_MINUTES, limit])

  return await buildProcessedForecasts(dateForecasted, processedFcResults.rows)
}

export async function createOrUpdateUserAlert(email: string, cityID: number, driveHours: number): Promise<[User, UserAlert]> {
  await pool.query(`INSERT INTO users(email) VALUES($1) ON CONFLICT (email) DO NOTHING;`, [email])
  const user: User = (await pool.query(`SELECT id, email, email_confirmed FROM users WHERE email = $1;`, [email])).rows[0]

  await pool.query(`
    INSERT INTO user_alert(user_id, city_id, max_drive_minutes)
    VALUES($1, $2, $3)
    ON CONFLICT(user_id, city_id) DO UPDATE SET
      active = TRUE,
      max_drive_minutes = $3;`, [user.id, cityID, driveHours * 60])
  const userAlert: UserAlert = (await pool.query(`
    SELECT user_id, city_id, max_drive_minutes
    FROM user_alert
    WHERE  user_id = $1`, [user.id])).rows[0]

  if (!user.email_confirmed) {
    // Fire and forget
    sendConfirmationEmail(user.id)
  }

  return [user, userAlert]
}

export async function deactivateUserAlertByUniqueID(uniqueID: string) {
  await pool.query(`UPDATE user_alert SET active = FALSE WHERE unique_id = $1`, [uniqueID])
}
