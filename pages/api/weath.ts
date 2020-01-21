import { promises as fsPromises } from 'fs';
import { sortBy } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import path from 'path';
import { EvaluatedForecast } from "../../src/types";

const TMPTMP_DATA_DIR = './data/forecasts/evaluated'

export default async function (_req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = await fsPromises.readdir(TMPTMP_DATA_DIR)
    const strContents = await Promise.all(files.map(f => fsPromises.readFile(path.join(TMPTMP_DATA_DIR, f))))
    const unsortedForecasts: EvaluatedForecast[] = strContents.map(s => JSON.parse(s as any as string))
    const forecasts = sortBy(unsortedForecasts, fc => -fc.maxConsecutiveGoodDays)
    res.status(200).send({ forecasts })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
