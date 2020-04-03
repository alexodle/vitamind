import { NextApiRequest, NextApiResponse } from "next";
import { isString } from "util";
import { createCityRequest } from "../../src/access";
import { InvalidRequestError } from "../../src/errors";
import { createRequestHandler } from "../../src/requestHandler";
import { PostCityRequest } from "../../src/types";
import { isValidEmail } from "../../src/util";

async function post(req: NextApiRequest, res: NextApiResponse) {
  const { city, email } = req.body as PostCityRequest
  if (!isString(city) || !city.length || !isValidEmail(email)) {
    throw new InvalidRequestError('invalid request params')
  }
  await createCityRequest(city, email)
  res.status(201).json({ 'success': true })
}

export default createRequestHandler({ post })
