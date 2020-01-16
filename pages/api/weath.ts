import { NextApiRequest, NextApiResponse } from "next";
import { promises as fsPromises } from 'fs';
import path from 'path';

const DIR = './scripts/out/parsed'

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = await fsPromises.readdir(DIR)
    const strContents = await Promise.all(files.map(f => fsPromises.readFile(path.join(DIR, f))))
    const contents = strContents.map(s => JSON.parse(s as any as string))
    console.log('hihi.apisending:')
    console.log({ forecasts: contents })
    res.status(200).send({ forecasts: contents })
  } catch (e) {
    console.error(e.stack)
    res.status(500).send({ error: e })
  }
}
