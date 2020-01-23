import { sortBy } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import { ProcessedForecast } from "../../src/types";
import { getAllLatestProcesssedForecasts } from '../../src/access';

export default async function (_req: NextApiRequest, res: NextApiResponse) {
  try {
    const unsortedForecasts: ProcessedForecast[] = await getAllLatestProcesssedForecasts()
    console.log(unsortedForecasts)
    const forecasts = sortBy(unsortedForecasts, fc => -fc.maxConsecutiveGoodDays)
    res.status(200).send({ forecasts })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
