import { sortBy } from 'lodash';
import { NextApiRequest, NextApiResponse } from "next";
import { FunctionComponent } from "react";
import ReactDOMServer from 'react-dom/server';
import { getRecommendationsForCity } from "../../../src/access";
import { DEFAULT_FORECAST_LIMIT } from '../../../src/constants';
import { InvalidRequestError, NotFoundError } from "../../../src/errors";
import { createRequestHandler } from "../../../src/requestHandler";
import { ProcessedForecast, UserAlertWithStatus, ProcessedDailyForecast, WeathType } from "../../../src/types";
import { friendlyDay, friendlyHoursText, friendlyTemp, getWeatherImg } from "../../../src/util";

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

const DailyForecastContainer: FunctionComponent<{}> = ({ children }) => (
  <div style={{
    border: 'gray 1px solid',
    borderRadius: '10px',
    padding: '10px',
    width: '120px',
    height: '123px',
    overflow: 'hidden',
  }}>{children}</div >
)

const DailyForecastHeader: FunctionComponent<{ df: ProcessedDailyForecast, weathType: WeathType }> = ({ df, weathType }) => {
  const isGoodDay = weathType === 'sunny' ? df.isGoodDay : df.isWarmDay
  return (
    <h4 style={{
      paddingTop: '0px',
      marginTop: '0px',
      textAlign: 'center',
      backgroundColor: isGoodDay ? '#98FB98' : undefined,
    }}
    >{friendlyDay((df.date as Date).getDay())}</h4>
  )
}

const WeatherIcon: FunctionComponent<{ df: ProcessedDailyForecast, fullURL?: boolean }> = ({ df, fullURL }) => {
  const [img, alt] = getWeatherImg(df)
  return <img style={{ width: '64px', height: '64px', display: 'inline-block' }} src={`${fullURL ? process.env.BASE_URL : ''}/imgs/${img}`} alt={alt} />
}

const EmailAlertHTML: FunctionComponent<EmailAlertProps> = ({ userAlert, recommendations }) => {
  const { user, cities_gained, cities_lost, weath_type, max_drive_minutes, city } = userAlert
  const vitamindDURL = `${process.env.BASE_URL}/forecast?cityID=${city.id}&driveHours=${max_drive_minutes / 60}&weath_type=${weath_type}&emailAlert=true`

  const renderNoDestinations = () => (
    <>
      <h2>Big picture</h2>
      <p>:( currently there are no cities that match your criteria . Rest assured we'll let you know as soon as that changes.</p>
    </>
  )

  return (
    <html>
      <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div style={{ width: '100%' }}>
          <Section>
            <p>
              {user.email},<br /><br />
              We detected changes to your alert: <b>{weath_type} weather</b> within a <b>{max_drive_minutes / 60} hour</b> drive of <b>{city.name}</b>. Check them out below or{' '}
              <a target='_blank' href={vitamindDURL}>get the most up to date forecasts at VitaminD</a>.
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
                  <div key={f.city.id} className="city-forecast recommended">
                    <h3>{f.city.name} ({friendlyHoursText(f.driveTimeMinutes)})</h3>
                    <ol style={{ paddingInlineStart: 0 }}>
                      {f.results.map(df => (
                        <li
                          key={(df.date as Date).getDate()}
                          style={{
                            display: 'inline-block',
                            marginRight: '20px',
                            marginBottom: '20px',
                          }}
                        >
                          <DailyForecastContainer>
                            <DailyForecastHeader df={df} weathType={weath_type} />
                            <WeatherIcon df={df} fullURL /> {friendlyTemp(df.maxtemp)}
                          </DailyForecastContainer>
                        </li>
                      ))}
                    </ol>
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
      </body>
    </html>
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

  const recommendations = (await getRecommendationsForCity(userAlert.city.id, userAlert.weath_type, DEFAULT_FORECAST_LIMIT)).filter(r => r.driveTimeMinutes <= userAlert.max_drive_minutes)

  const html = ReactDOMServer.renderToString(<EmailAlertHTML userAlert={userAlert} recommendations={recommendations} />)
  res.status(200).send(html)
}

export default createRequestHandler({ post: generateHTMLEmailAlert })
