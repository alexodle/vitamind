import { NextApiRequest, NextApiResponse } from "next";
import { promises as fsPromises } from 'fs';
import path from 'path';
import { Forecast, EvaluatedForecast, DailyForecast } from "../../scripts/src/types";
import { sortBy } from 'lodash';

const DIR = './scripts/out/parsed'

function isGoodDay(df: DailyForecast): boolean {
  return df.rainpct < 5.0 && df.cloudcover < 100.0 && df.max >= 65.0
}

function maxConsecutiveGoodDays(fc: Forecast): number {
  let max = 0
  let curr = 0
  fc.results.forEach(([_date, df]) => {
    if (isGoodDay(df)) {
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
    const maxConsecutive = maxConsecutiveGoodDays(fc)
    return {
      ...fc,
      results: fc.results.map(([date, df]) => [date, { ...df, isGoodDay: isGoodDay(df) }]),
      maxConsecutiveGoodDays: maxConsecutive,
      recommended: maxConsecutive > 1,
    }
  })
  const sorted = sortBy(evaled, fc => -fc.maxConsecutiveGoodDays)
  return sorted
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = await fsPromises.readdir(DIR)
    const strContents = await Promise.all(files.map(f => fsPromises.readFile(path.join(DIR, f))))
    const contents = strContents.map(s => JSON.parse(s as any as string))
    const evaluated = evaluateForecasts(contents)
    res.status(200).send({ forecasts: evaluated })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
