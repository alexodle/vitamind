import { NextApiRequest, NextApiResponse } from "next";
import { ProcessedForecast, WeathResult } from "../../src/types";
import { getRecommendationsForCity, getCity } from '../../src/access';
import { DEFAULT_DRIVE_TIME, VALID_DRIVE_HOURS } from "../../src/constants";

function safeGetDriveHours(req: NextApiRequest): number {
  let driveHours = DEFAULT_DRIVE_TIME

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
    const forecasts: ProcessedForecast[] = await getRecommendationsForCity(city.id, driveHours, 5)

    const result: WeathResult = { forecasts, city, driveHours }
    res.status(200).send(result)
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e.message })
  }
}
