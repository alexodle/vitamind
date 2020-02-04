import { NextApiRequest, NextApiResponse } from "next";
import { createUserAlert } from "../../src/access";
import { InvalidRequestError } from "../../src/errors";
import { createRequestHandler } from "../../src/RequestHandler";

async function post(req: NextApiRequest, res: NextApiResponse) {
  // TODO validate email

  const cityID = parseInt(req.body.cityID as string, 10)
  const driveHours = parseInt(req.body.driveHours as string, 10)
  const email = req.body.email as string
  if (isNaN(cityID) || isNaN(driveHours), !email) {
    throw new InvalidRequestError()
  }

  await createUserAlert(cityID, driveHours, email)

  res.status(201).send({})
}

export default createRequestHandler({ post })
