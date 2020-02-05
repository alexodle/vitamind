import { NextApiRequest, NextApiResponse } from "next";
import { createOrUpdateUserAlert } from "../../src/access";
import { InvalidRequestError } from "../../src/errors";
import { createRequestHandler } from "../../src/RequestHandler";
import { PostUserAlertResult } from "../../src/types";

async function post(req: NextApiRequest, res: NextApiResponse) {
  // TODO validate email

  const cityID = parseInt(req.body.cityID as string, 10)
  const driveHours = parseInt(req.body.driveHours as string, 10)
  const email = req.body.email as string
  if (isNaN(cityID) || isNaN(driveHours), !email) {
    throw new InvalidRequestError()
  }

  const [user, userAlert] = await createOrUpdateUserAlert(email, cityID, driveHours)

  const result: PostUserAlertResult = { user, userAlert }
  res.status(201).send(result)
}

export default createRequestHandler({ post })
