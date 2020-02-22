import { NextApiRequest, NextApiResponse } from "next";
import { createOrUpdateUserAlert } from "../../src/access";
import { createRequestHandler } from "../../src/requestHandler";
import { PostUserAlertRequest, PostUserAlertResult } from "../../src/types";

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { cityID, driveHours, weathType, wkndsOnly, email } = req.body as PostUserAlertRequest

  const [user, userAlert] = await createOrUpdateUserAlert(email, cityID, driveHours, weathType, wkndsOnly)

  const result: PostUserAlertResult = { user, userAlert }
  res.status(201).send(result)
}

export default createRequestHandler({ post })
