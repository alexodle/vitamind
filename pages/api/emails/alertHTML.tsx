import { sortBy } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import { FunctionComponent } from "react";
import ReactDOMServer from 'react-dom/server';
import { flushToHTML } from 'styled-jsx/server';
import { getRecommendationsForCity } from "../../../src/access";
import { DEFAULT_FORECAST_LIMIT } from '../../../src/constants';
import { InvalidRequestError, NotFoundError } from "../../../src/errors";
import { createRequestHandler } from "../../../src/requestHandler";
import { ProcessedForecast, UserAlertWithStatus } from "../../../src/types";
import { friendlyHoursText } from "../../../src/util";
import { DailyForecastBlock, DailyForecastList, SearchCriteria } from '../../forecast';

const LOCAL_IPS = [
  '::ffff:127.0.0.1',
  '::1'
]

const MAX_RESULTS_IN_EMAIL = 5

interface EmailAlertProps {
  userAlert: UserAlertWithStatus
  recommendations: ProcessedForecast[]
}

const Section: FunctionComponent<{}> = ({ children }) => <section style={{ marginBottom: '40px' }}>{children}</section >

const EmailAlertHTML: FunctionComponent<EmailAlertProps> = ({ userAlert, recommendations }) => {
  const { user, cities_gained, cities_lost, weath_type, wknds_only, max_drive_minutes, city } = userAlert
  const vitamindDURL = `${process.env.BASE_URL}/forecast?cityID=${city.id}&driveHours=${max_drive_minutes / 60}&weath_type=${weath_type}&emailAlert=true`

  const renderNoDestinations = (): JSX.Element => (
    <>
      <h2>Big picture</h2>
      <p>:( currently there are no cities that match your criteria . Rest assured we'll let you know as soon as that changes.</p>
    </>
  )

  return (
    <div style={{ width: '100%' }}>
      <Section>
        <p>
          {user.email},<br /><br />
          We detected changes to your alert: <SearchCriteria city={city} weathType={weath_type} maxDriveMinutes={max_drive_minutes} wkndsOnly={wknds_only} />.
          {' '}Check them out below or <a target='_blank' href={vitamindDURL}>get the most up to date forecasts at VitaminD</a>.
        </p>
      </Section>
      {!cities_gained.length ? null : (
        <Section>
          <h2>New destinations :D</h2>
          <ul>
            {sortBy(cities_gained, c => c.name).map(c => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </Section>
      )}
      {!cities_lost.length ? null : (
        <Section>
          <h2>Cities lost :(</h2>
          <ul>
            {sortBy(cities_lost, c => c.name).map(c => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </Section>
      )}
      <Section>
        {!recommendations.length ? renderNoDestinations() : (
          <>
            <h2>
              {recommendations.length > MAX_RESULTS_IN_EMAIL ?
                `Your ${MAX_RESULTS_IN_EMAIL} closest destinations` :
                `We found ${recommendations.length} destination${recommendations.length < 2 ? '' : 's'}`}
            </h2>
            {recommendations.slice(0, MAX_RESULTS_IN_EMAIL).map(f => (
              <div key={f.city.id}>
                <h3>{f.city.name} ({friendlyHoursText(f.driveTimeMinutes)})</h3>
                <DailyForecastList>
                  {f.results.map(df =>
                    <DailyForecastBlock key={(df.date as Date).getDate()} df={df} weathType={weath_type} wkndsOnly={wknds_only} />
                  )}
                </DailyForecastList>
              </div>
            ))}
            {recommendations.length <= MAX_RESULTS_IN_EMAIL ? null : (
              <a target='_blank' href={vitamindDURL}>See all {recommendations.length} destinations on VitaminD</a>
            )}
          </>
        )}
      </Section>
      <p>- VitaminD</p>
      <footer style={{ textAlign: 'center' }}>
        <a href={`${process.env.BASE_URL}/user_alert/unsubscribe/${userAlert.id}?userUUID=${user.user_uuid}`}>Unsubscribe from this alert</a>
        {' '}|{' '}
        <a href={`${process.env.BASE_URL}/user_alert/manage?userUUID=${user.user_uuid}`}>Manage my alerts</a>
      </footer>
    </div>
  )
}

interface GenerateEmailRequest {
  userAlert: UserAlertWithStatus
}

async function generateHTMLEmailAlert(req: NextApiRequest, res: NextApiResponse) {
  // localhost connections only
  if (LOCAL_IPS.indexOf(req.connection.remoteAddress as string) === -1) {
    console.error(`ERROR: tried to generate html email from non-local address: ${req.connection.remoteAddress}`)
    throw new NotFoundError(`Remote address not local: ${req.connection.remoteAddress}`)
  }

  const { userAlert }: GenerateEmailRequest = req.body
  if (!userAlert.cities_gained.length && !userAlert.cities_lost.length) {
    throw new InvalidRequestError('no changes to alert on')
  }

  const recommendations = (await getRecommendationsForCity(userAlert.city.id, userAlert.weath_type, userAlert.wknds_only, DEFAULT_FORECAST_LIMIT))
    .filter(r => r.driveTimeMinutes <= userAlert.max_drive_minutes)

  const body = ReactDOMServer.renderToString(<EmailAlertHTML userAlert={userAlert} recommendations={recommendations} />)
  const styles = flushToHTML()
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        ${styles}
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif;">
        <div id="root">${body}</div>
      </body>
    </html>`
  res.status(200).send(html)
}

export default createRequestHandler({ post: generateHTMLEmailAlert })
