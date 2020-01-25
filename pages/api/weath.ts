import { partition } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import { getCity, getRecommendationsForCity } from '../../src/access';
import { DEFAULT_DRIVE_HOURS, VALID_DRIVE_HOURS } from "../../src/constants";
import { ProcessedForecast, WeathResult } from "../../src/types";

const DEFAULT_LIMIT = 5

function safeGetDriveHours(req: NextApiRequest): number {
  let driveHours = DEFAULT_DRIVE_HOURS

  try {
    if (req.query.driveHours) {
      const driveHoursParam = parseInt(req.query.driveHours as string, 10)
      if (VALID_DRIVE_HOURS.indexOf(driveHoursParam) !== -1) {
        driveHours = driveHoursParam
      }
    }
  } catch { }

  return driveHours
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const limit = DEFAULT_LIMIT

  try {
    const cityIDStr = req.query.cityID as string
    if (!cityIDStr) {
      res.status(501).send({ error: 'City ID required' })
      return
    }
    const cityID = parseInt(cityIDStr, 10)
    const city = await getCity(cityID)
    if (!city) {
      res.status(404).send({ error: `city not found: ${cityID}` })
      return
    }

    const driveHours = safeGetDriveHours(req)
    const allForecasts: ProcessedForecast[] = await getRecommendationsForCity(city.id, limit)

    // forecasts may include recommendations outside of our target radius
    const driveTimeMinutes = driveHours * 60
    const [forecasts, forecastsOutsideRadius] = partition(allForecasts, f => f.driveTimeMinutes <= driveTimeMinutes)

    const minimumDriveHours = allForecasts.length ? allForecasts[0].driveTimeMinutes * 60 : -1
    const result: WeathResult = {
      limit,

      forecasts,
      city,
      driveHoursRequested: driveHours,
      minimumDriveHours,

      // Only include forecastsOutsideRadius if there are no forecasts within radius
      forecastsOutsideRadius: forecasts.length === 0 ? forecastsOutsideRadius : [],
    }

    res.status(200).send(result)
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e.message })
  }
}
