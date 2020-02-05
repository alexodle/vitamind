import { NextApiRequest, NextApiResponse } from "next";
import { deactivateUserAlertByUniqueID } from "../../../src/access";
import { InvalidRequestError } from "../../../src/errors";
import { createRequestHandler } from "../../../src/RequestHandler";

function isUniqueID(maybeUuid: string) {
  return maybeUuid.indexOf('-') !== -1
}

async function del(req: NextApiRequest, res: NextApiResponse) {
  const uniqueID = req.query.id as string
  if (!isUniqueID(uniqueID)) {
    throw new InvalidRequestError()
  }

  await deactivateUserAlertByUniqueID(uniqueID)

  res.status(204).send({})
}

export default createRequestHandler({ delete: del })
