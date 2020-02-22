import { partition } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import { getCity, getDailyForecastsForCities, getRecommendationsForCity } from '../../src/access';
import { DEFAULT_DRIVE_HOURS, DEFAULT_FORECAST_LIMIT, VALID_DRIVE_HOURS } from "../../src/constants";
import { InvalidRequestError, NotFoundError } from '../../src/errors';
import { createRequestHandler } from '../../src/requestHandler';
import { ProcessedDailyForecast, WeathResult, WeathType } from "../../src/types";
import { isValidWeathType, parseBool } from '../../src/util';

function safeGetDriveHours(req: NextApiRequest): number {
  let driveHours = DEFAULT_DRIVE_HOURS

  if (req.query.driveHours) {
    const driveHoursParam = parseInt(req.query.driveHours as string, 10)
    if (VALID_DRIVE_HOURS.indexOf(driveHoursParam) !== -1) {
      driveHours = driveHoursParam
    }
  }

  return driveHours
}

function safeGetWeathType(req: NextApiRequest): WeathType {
  const weathType = req.query.weathType as WeathType
  return isValidWeathType(weathType) ? weathType : 'sunny'
}

function safeGetWkndsOnly(req: NextApiRequest): boolean {
  return parseBool(req.query.wkndsOnly as string)
}

async function get(req: NextApiRequest, res: NextApiResponse) {
  const limit = DEFAULT_FORECAST_LIMIT

  const cityIDStr = req.query.cityID as string
  if (!cityIDStr) {
    throw new InvalidRequestError()
  }

  const cityID = parseInt(cityIDStr, 10)
  const city = await getCity(cityID)
  if (!city) {
    throw new NotFoundError()
  }
  if (!city.selectable) {
    throw new InvalidRequestError()
  }

  const weathType = safeGetWeathType(req)
  const driveHours = safeGetDriveHours(req)
  const wkndsOnly = safeGetWkndsOnly(req)

  const allForecasts = await getRecommendationsForCity(city.id, weathType, wkndsOnly, limit)

  // forecasts may include recommendations outside of our target radius
  const driveTimeMinutes = driveHours * 60
  const [forecasts, forecastsOutsideRadius] = partition(allForecasts, f => f.driveTimeMinutes <= driveTimeMinutes)
  const minimumDriveHours = allForecasts.length ? allForecasts[0].driveTimeMinutes * 60 : -1

  // include forecasts for source city
  let sourceCityForecasts: ProcessedDailyForecast[] = []
  if (allForecasts.length) {
    const dateForecasted = allForecasts[0].dateForecasted
    const results = await getDailyForecastsForCities([cityID], dateForecasted)
    sourceCityForecasts = results[cityID]
  }

  const result: WeathResult = {
    sourceCityForecasts,
    forecasts,

    limit,
    weathType,
    city,
    driveHoursRequested: driveHours,
    wkndsOnly,

    minimumDriveHours,

    // Only include forecastsOutsideRadius if there are no forecasts within radius
    forecastsOutsideRadius: forecasts.length === 0 ? forecastsOutsideRadius : [],
  }
  res.status(200).send(result)
}

export default createRequestHandler({
  get,
})
