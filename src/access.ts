import { groupBy } from 'lodash'
import moment from 'moment'
import { Pool } from 'pg'
import { MAX_DRIVE_MINUTES, VALID_DRIVE_HOURS } from '../src/constants'
import { sendConfirmationEmail } from './emailConfAccess'
import { InvalidRequestError, NotFoundError } from './errors'
import { requireEnv } from './nodeUtils'
import { City, ProcessedDailyForecast, ProcessedForecast, User, UserAlert, WeathType, UserAlertWithStatus } from './types'
import { isValidWeathType, getToday, isValidEmail, isValidDriveHours, isWeekend } from './util'
import { isBoolean, isString } from 'util'

const NDAYS = 6

export const pool = new Pool({
  connectionString: requireEnv('POSTGRES_CONNECTION_STR_NODE')
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
  const cityIDs: number[] = processedFcResults.map(pfcr => pfcr.city_id)
  const dailiesByCityID = await getDailyForecastsForCities(cityIDs, dateForecasted)

  const pfcs: ProcessedForecast[] = processedFcResults.map(pfcr => ({
    city: { id: pfcr.city_id, name: pfcr.city_name },
    dateForecasted,
    recommended: pfcr.is_recommended,
    maxConsecutiveGoodDays: pfcr.max_consecutive_good_days,
    maxConsecutiveWarmDays: pfcr.max_consecutive_warm_days,
    driveTimeMinutes: pfcr.gmap_drive_time_minutes,
    results: dailiesByCityID[pfcr.city_id],
  }))

  return pfcs
}

export async function createCityRequest(city: string, email: string) {
  if (!isString(city) || !city.length || !isValidEmail(email)) {
    throw new InvalidRequestError('Invalid city or email')
  }
  const result = await pool.query(`
    INSERT INTO city_request(city, email) VALUES($1, $2);
    `, [city, email])
  if (result.rowCount < 1) {
    console.error(`Failed to add new city request: city:${city}, email:${email}`)
    throw new Error('failed to add city')
  }
}

export async function getUser(id: number): Promise<User> {
  const result = await pool.query(`SELECT id, email, email_confirmed FROM users WHERE id = $1;`, [id])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }
  return result.rows[0]
}

export async function getUserByUUID(uuid: string): Promise<User> {
  const result = await pool.query(`SELECT id, email, email_confirmed FROM users WHERE user_uuid = $1;`, [uuid])
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

export async function getDailyForecastsForCities(cityIDs: number[], dateForecasted: Date): Promise<{ [cityID: string]: ProcessedDailyForecast[] }> {
  const today = getToday()
  const [fc_date_start, fc_date_end] = [today, addDays(dateForecasted, NDAYS)]

  const result = await pool.query(`
    SELECT city_id, fc_date, mintemp, maxtemp, minfeel, maxfeel, cloudcover, rainpct, date_forecasted, is_sunny, is_warm
    FROM forecast
    WHERE date_forecasted = $1 AND fc_date >= $2 AND fc_date < $3 AND city_id = ANY($4::int[])
    ORDER BY city_id, fc_date;
  `, [dateForecasted, fc_date_start, fc_date_end, cityIDs]
  )

  const dailies: ProcessedDailyForecast[] = result.rows.map(r => ({
    date: hackNormalizePgDate(r.fc_date),
    city_id: r.city_id,
    mintemp: r.mintemp,
    maxtemp: r.maxtemp,
    maxfeel: r.maxfeel,
    minfeel: r.minfeel,
    cloudcover: r.cloudcover,
    rainpct: r.rainpct,
    isGoodDay: r.is_sunny,
    isWarmDay: r.is_warm,
  }))

  return groupBy(dailies, d => d.city_id.toString())
}

type IsRecommendedProp = 'is_recommended' | 'is_recommended_wknd' | 'is_recommended_warm' | 'is_recommended_warm_wknd'
const getIsRecommendedProp = (weathType: WeathType, wkndsOnly: boolean): IsRecommendedProp => {
  if (weathType === 'sunny') {
    return !wkndsOnly ? 'is_recommended' : 'is_recommended_wknd'
  }
  return !wkndsOnly ? 'is_recommended_warm' : 'is_recommended_warm_wknd'
}

export async function getRecommendationsForCity(targetCityID: number, weathType: WeathType, wkndsOnly: boolean, limit: number): Promise<ProcessedForecast[]> {
  const dateForecasted = await getLatestForecastDate()

  if (process.env.NODE_ENV !== 'production') {
    console.log('Query params:' + [dateForecasted, targetCityID, weathType, limit])
  }

  const isRecommendedProp = getIsRecommendedProp(weathType, wkndsOnly)
  const processedFcResults = await pool.query(`
    SELECT
      city.id AS city_id, city.name AS city_name, date_forecasted, ndays,
      max_consecutive_good_days, is_recommended,
      max_consecutive_warm_days, is_recommended_warm,
      ctt.gmap_drive_time_minutes AS gmap_drive_time_minutes
    FROM processed_forecast pf
    JOIN city ON city.id = pf.city_id
    JOIN city_travel_time_all ctt ON ctt.city_from_id = $2 AND ctt.city_to_id = pf.city_id
    WHERE ${isRecommendedProp} = TRUE AND date_forecasted = $1 AND ctt.gmap_drive_time_minutes <= $3
    ORDER BY ctt.gmap_drive_time_minutes ASC
    LIMIT $4;
  `, [dateForecasted, targetCityID, MAX_DRIVE_MINUTES, limit])

  const results = await buildProcessedForecasts(dateForecasted, processedFcResults.rows)

  // Adjust daily recommendations for wkndsOnly requests
  if (wkndsOnly) {
    results.forEach(r => r.results.forEach(df => {
      if (!isWeekend(df.date as Date)) {
        df.isGoodDay = false
        df.isWarmDay = false
      }
    }))
  }

  return results
}

export async function createOrUpdateUserAlert(email: string, cityID: number, driveHours: number, weathType: WeathType, wkndsOnly: boolean): Promise<[User, UserAlert]> {
  if (isNaN(cityID) || !isValidEmail(email) || !isValidDriveHours(driveHours) || !isValidWeathType(weathType) || !isBoolean(wkndsOnly)) {
    throw new InvalidRequestError(`invalid param value`)
  }

  await pool.query(`INSERT INTO users(email) VALUES($1) ON CONFLICT (email) DO NOTHING;`, [email])
  const user: User = (await pool.query(`SELECT id, email, email_confirmed FROM users WHERE email = $1;`, [email])).rows[0]

  await pool.query(`
    INSERT INTO user_alert(user_id, city_id, max_drive_minutes, weath_type, wknds_only)
    VALUES($1, $2, $3, $4, $5)
    ON CONFLICT(user_id, city_id) DO UPDATE SET
      active = TRUE,
      max_drive_minutes = $3,
      weath_type = $4,
      wknds_only = $5;
    `, [user.id, cityID, driveHours * 60, weathType, wkndsOnly])

  const userAlert: UserAlert = (await pool.query(`
    SELECT user_id, city_id, max_drive_minutes, weath_type, wknds_only
    FROM user_alert
    WHERE user_id = $1;
    `, [user.id])).rows[0]

  if (!user.email_confirmed) {
    // Fire and forget
    (async () => {
      try {
        await sendConfirmationEmail(user.id)
        console.log(`Sent confirmation email to: ${email}`)
      } catch (e) {
        console.error(`Failed to send confirmation email to: ${email}`)
        console.error(e)
      }
    })()
  }

  return [user, userAlert]
}

export async function toggleUserAlert(userAlertID: number, userUUID: string, active: boolean) {
  const result = await pool.query(`
    UPDATE user_alert
    SET active = $3
    FROM users
    WHERE
      user_alert.user_id = users.id AND
      user_alert.id = $1 AND
      users.user_uuid = $2;`, [userAlertID, userUUID, active])
  if (result.rowCount < 1) {
    throw new NotFoundError()
  }
}

export async function getAlertsForUser(userUUID: string): Promise<UserAlert[]> {
  const result = await pool.query(`
    SELECT
      a.id id,
      a.user_id user_id,
      u.email user_email,
      a.city_id city_id,
      c.name city_name,
      a.max_drive_minutes max_drive_minutes,
      a.weath_type weath_type,
      a.wknds_only wknds_only,
      a.active active
    FROM user_alert a
    JOIN users u ON u.id = a.user_id
    JOIN city c ON c.id = a.city_id
    WHERE u.user_uuid = $1;
    `, [userUUID])
  const results: UserAlert[] = result.rows.map(r => ({
    id: r.id,
    city: { id: r.city_id, name: r.city_name },
    user: { id: r.user_id, email: r.user_email },
    max_drive_minutes: r.max_drive_minutes,
    weath_type: r.weath_type,
    wknds_only: r.wknds_only,
    active: r.active,
  }))
  return results
}
