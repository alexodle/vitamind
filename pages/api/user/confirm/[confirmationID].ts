import { NextApiRequest, NextApiResponse } from "next";
import { confirmUser } from "../../../../src/access";
import { createRequestHandler } from "../../../../src/RequestHandler";

async function confirmEmail(req: NextApiRequest, res: NextApiResponse) {
  const confirmationID = req.query.confirmationID as string
  await confirmUser(confirmationID)
  res.status(201).send({})
}

export default createRequestHandler({ put: confirmEmail })
