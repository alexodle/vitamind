import { NextApiRequest, NextApiResponse } from "next";
import { createOrUpdateUserAlert, getUserByUUID, toggleUserAlert } from "../../../src/access";
import { InvalidRequestError } from "../../../src/errors";
import { createRequestHandler } from "../../../src/requestHandler";
import { UserAlert, WeathType } from "../../../src/types";

async function updateAlert(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string, 10)
  const userUUID = req.query.userUUID as string
  if (isNaN(id) || !userUUID) {
    throw new InvalidRequestError()
  }

  const update: Partial<UserAlert> = req.body

  // Treat an empty request as a "touch" that reactivates the user alert
  if (Object.keys(update).length === 0) {
    await toggleUserAlert(id, userUUID, true)
  } else {
    const user = await getUserByUUID(userUUID)
    const cityID = update.city!.id as number
    const maxDriveMins = update.max_drive_minutes as number
    const weathType = update.weath_type as WeathType
    await createOrUpdateUserAlert(user.email, cityID, maxDriveMins / 60, weathType)
  }

  res.status(204).send({})
}

async function deactivateAlert(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string, 10)
  const userUUID = req.query.userUUID as string
  if (isNaN(id) || !userUUID) {
    throw new InvalidRequestError()
  }

  await toggleUserAlert(id, userUUID, false)

  res.status(204).send({})
}

export default createRequestHandler({
  put: updateAlert,
  delete: deactivateAlert
})
