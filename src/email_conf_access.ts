import { pool, getUser } from './access';
import { NotFoundError, InvalidRequestError } from './errors';
import { User } from './types';

// Users have GRACE_TIME_MINS to confirm email
const GRACE_TIME_MINS = 10;

const buildHTMLEmail = (user: User) => `<html>
<body>
<p>${user.email},<br />
You signed up to get alerts from VitaminD.
<br />
<a href="${process.env.BASE_URL}/user/confirm/${user.email_conf_uuid}">Click here to confirm your email and start receiving those alerts.</a></p>
<br/>
<br/>
- VitaminD
</body>
</html>`

const buildTextEmail = (user: User) => `${user.email},
You signed up to get alerts from VitaminD.
Navigate to the following URL to confirm your email: ${process.env.BASE_URL}/user/confirm/${user.email_conf_uuid}

- VitaminD
`

const sendEmail = require('gmail-send')({
  user: process.env.CONFIRM_EMAIL,
  pass: process.env.CONFIRM_EMAIL_PW,
  subject: 'VitaminD - confirm your email',
});

async function getUserIDByConfirmationUUID(confirmationUUID: string): Promise<number> {
  const result = await pool.query(`SELECT id FROM users WHERE email_conf_uuid = $1;`, [confirmationUUID])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }
  return result.rows[0].id
}

export async function resendConfirmationEmail(oldConfirmationUUID: string) {
  const userID = await getUserIDByConfirmationUUID(oldConfirmationUUID)
  await sendConfirmationEmail(userID)
}

export async function sendConfirmationEmail(userID: number) {
  const result = await pool.query(`
    UPDATE users
    SET
      email_conf_uuid = uuid_generate_v4(),
      email_conf_uuid_last_updated = NOW()
    WHERE id = $1
    RETURNING id, email, email_conf_uuid;
  `, [userID])
  if (result.rows.length < 1) {
    throw new NotFoundError()
  }

  const user: User = result.rows[0]
  sendEmail({
    to: user.email,
    html: buildHTMLEmail(user),
    text: buildTextEmail(user),
  })
}

export async function confirmUserEmail(confirmationUUID: string) {
  const result = await pool.query(`
    UPDATE users
    SET email_confirmed = TRUE
    WHERE
      email_conf_uuid = $1 AND
      email_conf_uuid_last_updated >= NOW() - interval '${GRACE_TIME_MINS}' minute;
  `, [confirmationUUID])
  if (result.rowCount < 1) {
    // This will throw a NotFoundError if the confirmationUUID does not exist
    await getUserIDByConfirmationUUID(confirmationUUID)

    // Else, InvalidRequestError indicates the user exists, but the request is past the grace period
    throw new InvalidRequestError()
  }
}
