import { NextApiRequest, NextApiResponse } from "next";
import { confirmUserEmail, resendConfirmationEmail } from "../../../../src/email_conf_access";
import { createRequestHandler } from "../../../../src/RequestHandler";

async function confirmEmail(req: NextApiRequest, res: NextApiResponse) {
  const confirmationID = req.query.confirmationID as string
  await confirmUserEmail(confirmationID)
  res.status(201).send({})
}

async function resend(req: NextApiRequest, res: NextApiResponse) {
  const confirmationID = req.query.confirmationID as string
  await resendConfirmationEmail(confirmationID)
  res.status(201).send({})
}

export default createRequestHandler({
  put: confirmEmail,
  delete: resend,
})
