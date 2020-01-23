import { NextApiRequest, NextApiResponse } from "next";
import { ProcessedForecast } from "../../src/types";
import { getAllLatestProcesssedForecasts, getRecommendationsForCity, getCityByName } from '../../src/access';

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const driveHoursRadius = req.query.driveHours ? parseInt(req.query.driveHours as string, 10) : 8
    const city = (await getCityByName('Seattle'))
    if (!city) {
      res.status(404).send({ error: 'City not found' })
      return
    }
    const forecasts: ProcessedForecast[] = await getRecommendationsForCity(city.id, driveHoursRadius, 5)
    res.status(200).send({ forecasts })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
