import { promises as fsPromises } from 'fs';
import { sortBy } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import path from 'path';
import { DailyForecast, EvaluatedDailyForecast, EvaluatedForecast, Forecast } from "../../src/types";

const TMPTMP_DATA_DIR = './data/forecasts'

const isGoodDay = (df: DailyForecast) => df.rainpct < 20.0 && df.cloudcover < 100.0 && df.maxtemp >= 67.0

function maxConsecutiveGoodDays(dfs: EvaluatedDailyForecast[]): number {
  let max = 0
  let curr = 0
  dfs.forEach(df => {
    if (df.isGoodDay) {
      curr += 1
      if (curr > max) {
        max = curr
      }
    } else {
      curr = 0
    }
  })
  return max
}

function evaluateForecasts(forecasts: Forecast[]): EvaluatedForecast[] {
  const evaled: EvaluatedForecast[] = forecasts.map(fc => {
    const evaledDfs = fc.results.map(df => ({ ...df, isGoodDay: isGoodDay(df) }))
    const maxConsecutive = maxConsecutiveGoodDays(evaledDfs)
    return {
      ...fc,
      results: evaledDfs,
      maxConsecutiveGoodDays: maxConsecutive,
      recommended: maxConsecutive > 1,
    }
  })
  const sorted = sortBy(evaled, fc => -fc.maxConsecutiveGoodDays)
  return sorted
}

export default async function (_req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = await fsPromises.readdir(TMPTMP_DATA_DIR)
    const strContents = await Promise.all(files.map(f => fsPromises.readFile(path.join(TMPTMP_DATA_DIR, f))))
    const contents: Forecast[] = strContents.map(s => JSON.parse(s as any as string))
    const forecasts = evaluateForecasts(contents)
    res.status(200).send({ forecasts })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
