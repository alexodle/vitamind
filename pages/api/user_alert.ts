import { NextApiRequest, NextApiResponse } from "next";
import { createOrUpdateUserAlert } from "../../src/access";
import { createRequestHandler } from "../../src/requestHandler";
import { PostUserAlertResult, WeathType } from "../../src/types";

async function post(req: NextApiRequest, res: NextApiResponse) {
  const cityID = parseInt(req.body.cityID as string, 10)
  const driveHours = parseInt(req.body.driveHours as string, 10)
  const weathType = req.body.weathType as WeathType
  const email = req.body.email as string

  const [user, userAlert] = await createOrUpdateUserAlert(email, cityID, driveHours, weathType)

  const result: PostUserAlertResult = { user, userAlert }
  res.status(201).send(result)
}

export default createRequestHandler({ post })
