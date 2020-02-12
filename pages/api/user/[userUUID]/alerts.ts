import { NextApiRequest, NextApiResponse } from "next";
import { getAlertsForUser, getUserByUUID } from "../../../../src/access";
import { InvalidRequestError } from "../../../../src/errors";
import { createRequestHandler } from "../../../../src/requestHandler";
import { GetUserAlertsResult } from "../../../../src/types";

async function getAll(req: NextApiRequest, res: NextApiResponse) {
  const userUUID = req.query.userUUID as string
  if (!userUUID) {
    throw new InvalidRequestError()
  }
  const user = await getUserByUUID(userUUID)
  const userAlerts = await getAlertsForUser(userUUID)
  const result: GetUserAlertsResult = { user, userAlerts }
  res.status(201).send(result)
}

export default createRequestHandler({
  get: getAll,
})
