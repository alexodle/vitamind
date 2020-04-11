import nodemailer from 'nodemailer';
import { pool, getUser } from './access';
import { InvalidRequestError, NotFoundError } from './errors';
import { requireEnv } from './nodeUtils';
import { User, UserConf } from './types';
import { BRAND } from './constants';

// Users have GRACE_TIME_MINS to confirm email
const GRACE_TIME_MINS = 10

const EMAIL_SUBJECT = `${BRAND} - confirm your email`
const EMAIL_DISPLAY_NAME = BRAND
const EMAIL_FROM = requireEnv('EMAIL_FROM')

const mailer = nodemailer.createTransport({
  host: requireEnv('EMAIL_HOST'),
  port: 465,
  secure: true,
  auth: {
    user: requireEnv('EMAIL_USER'),
    pass: requireEnv('EMAIL_PW'),
  }
})

const buildHTMLEmail = (user: User, userConf: UserConf) => `<html>
<body>
<p>${user.email},<br /><br />
You signed up to get alerts from ${BRAND}.
<br /><br />
<a href="${process.env.BASE_URL}/user/confirm/${userConf.conf_id}">Click here to confirm your email and start receiving those alerts.</a></p>
<br/>
- Your friends at ${BRAND}
</body>
</html>`

const buildTextEmail = (user: User, userConf: UserConf) => `${user.email},
You signed up to get alerts from ${BRAND}.
Navigate to the following URL to confirm your email: ${process.env.BASE_URL}/user/confirm/${userConf.conf_id}

- Your friends at ${BRAND}
`

async function getUserIDByConfirmationUUID(confirmationUUID: string): Promise<number> {
  const result = await pool.query(`
    SELECT user_id
    FROM user_conf
    WHERE conf_id = $1;`, [confirmationUUID])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }
  return result.rows[0].user_id
}

export async function resendConfirmationEmail(oldConfirmationUUID: string) {
  const userID = await getUserIDByConfirmationUUID(oldConfirmationUUID)
  await sendConfirmationEmail(userID)
}

export async function sendConfirmationEmail(userID: number) {
  const user: User = await getUser(userID)
  const userConfResults = await pool.query(`
    INSERT INTO user_conf(user_id)
    VALUES($1)
    RETURNING conf_id;
  `, [userID])
  if (userConfResults.rows.length < 1) {
    throw new NotFoundError()
  }

  const userConf: UserConf = userConfResults.rows[0]
  await mailer.sendMail({
    from: `"${EMAIL_DISPLAY_NAME}" <${EMAIL_FROM}>`,
    to: user.email,
    subject: EMAIL_SUBJECT,
    text: buildTextEmail(user, userConf),
    html: buildHTMLEmail(user, userConf),
  })
}

export async function confirmUserEmail(confirmationUUID: string) {
  const userConfResults = await pool.query(`
    SELECT uc.conf_id conf_id, u.id user_id, u.email_confirmed email_confirmed
    FROM user_conf uc
    JOIN users u ON u.id = uc.user_id
    WHERE conf_id = $1;`, [confirmationUUID])
  if (userConfResults.rows.length < 1) {
    throw new NotFoundError()
  }

  const userConfResult: { conf_id: string, user_id: number, email_confirmed: boolean } = userConfResults.rows[0]
  if (userConfResult.email_confirmed) {
    // Already done
    return
  }

  // Update based on grace period
  const result = await pool.query(`
    UPDATE users
    SET email_confirmed = TRUE
    FROM user_conf
    WHERE
      user_conf.user_id = users.id AND
      conf_id = $1 AND
      conf_timestampz >= NOW() - interval '${GRACE_TIME_MINS}' minute;
  `, [confirmationUUID])
  if (result.rowCount < 1) {
    // Else, InvalidRequestError indicates the user exists, but the request is past the grace period
    throw new InvalidRequestError()
  }
}
