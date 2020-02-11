import { NextApiRequest, NextApiResponse } from "next";
import { deactivateUserAlertByUniqueID } from "../../../src/access";
import { InvalidRequestError } from "../../../src/errors";
import { createRequestHandler } from "../../../src/requestHandler";

async function removeAlert(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string, 10)
  const userUUID = req.query.userUUID as string
  if (isNaN(id) || !userUUID) {
    throw new InvalidRequestError()
  }

  await deactivateUserAlertByUniqueID(userUUID, id)

  res.status(204).send({})
}

export default createRequestHandler({ delete: removeAlert })
