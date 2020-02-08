import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import Link from 'next/link'
import { parseCookies, setCookie } from 'nookies'
import { FunctionComponent, SyntheticEvent, useState, Fragment } from 'react'
import { Alert } from '../src/components/Alert'
import { Layout } from '../src/components/Layout'
import { MAX_DRIVE_MINUTES } from '../src/constants'
import { PostUserAlertResult, ProcessedDailyForecast, ProcessedForecast, WeathResult } from '../src/types'
import { isValidEmail } from '../src/util'

export interface ForecastProps extends WeathResult {
  defaultEmail: string
}

const IMG_SRC = 'imgs'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
function friendlyDay(day: number): string {
  return DAYS[day]
}

function friendlyHoursText(driveTimeMinutes: number): string {
  const driveTimeHours = Math.floor(driveTimeMinutes / 60)
  if (driveTimeHours < 1) {
    return 'Less than an hour'
  } else if (driveTimeHours === 1) {
    return '1 hour'
  }
  return `${driveTimeHours} hours`
}

function getWeatherImg(df: ProcessedDailyForecast): [string, string] {
  if (df.rainpct >= 20) {
    return ['rain_s_cloudy.png', 'Rainy']
  } else if (df.cloudcover > 75) {
    return ['cloudy.png', 'Cloudy']
  } else if (df.cloudcover > 25) {
    return ['partly_cloudy.png', 'Partly cloudy']
  }
  return ['sunny.png', 'Sunny']
}

function renderTemp(temp: number) {
  return `${Math.round(temp)}\u00B0F`
}

function normalizeWeathResults(its: ProcessedForecast[]) {
  its.forEach(f => {
    f.results.forEach(df => { df.date = new Date(df.date) })
  })
}

function renderForecastDay(df: ProcessedDailyForecast): JSX.Element {
  const [img, alt] = getWeatherImg(df)
  return (
    <div className='daily-forecast-container'>
      <h4 className={"daily-forecast" + (df.isGoodDay ? " good-day" : "")}>{friendlyDay((df.date as Date).getDay())}</h4>
      <img className='weather-icon' src={`${IMG_SRC}/${img}`} alt={alt} /> {renderTemp(df.maxtemp)}
      <style jsx>{`
        h4 {
          padding-top: 0px;
          margin-top: 0px;
        }
        .daily-forecast-container {
          border: gray 1px solid;
          border-radius: 10px;
          padding: 10px;
        }
        .weather-icon {
          width: 64px;
          height: 64px;
        }
        .daily-forecast {
          text-align: center;
        }
        .daily-forecast.good-day {
          background-color: #98FB98;
        }
      `}</style>
    </div>
  )
}

const renderForecasts = (fcs: ProcessedForecast[]): JSX.Element => (
  <div>
    {fcs.map((f: ProcessedForecast) => (
      <div key={f.city} className={"city-forecast" + (f.recommended ? " recommended" : "")}>
        <h3>{f.city} ({friendlyHoursText(f.driveTimeMinutes)})</h3>
        <ol className='daily-forecast-list'>
          {f.results.map(df => {
            return (
              <li key={(df.date as Date).getDate()}>
                {renderForecastDay(df)}
              </li>
            )
          })}
        </ol>
      </div>
    ))}
    <style jsx>{`
      .daily-forecast-list {
        padding-inline-start: 0;
      }

      .daily-forecast-list li {
        display: inline-block;
        margin-right: 20px;
        margin-bottom: 20px;
      }
    `}</style>
  </div>
)

const OutsideOfRadiusForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, forecastsOutsideRadius }) => {
  return (
    <div>
      <Alert status='info'>
        No VitaminD was found within a {driveHoursRequested} hour of {city.name}.
        Showing results for {MAX_DRIVE_MINUTES / 60} hours.
      </Alert>
      <h2>VitaminD within a {MAX_DRIVE_MINUTES / 60} hour drive of {city.name}</h2>
      {renderForecasts(forecastsOutsideRadius)}
    </div>
  )
}

const ForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, weathType, forecasts, }) => {
  return (
    <div>
      <h2><u>{weathType === 'sunny' ? 'Sunny weather' : 'Warm weather'}</u> within a <u>{driveHoursRequested}</u> hour drive of <u>{city.name}</u></h2>
      {renderForecasts(forecasts)}
    </div>
  )
}

const renderSadFace = () => (
  <div className='sad-face-wrapper'>
    <span className='sad-face'>:(</span>
    <style jsx>{`
    .sad-face-wrapper {
      position: fixed;
      text-align: center;
      top: 50%;
      left: 50%;
      font-size: 2em;
      transform: translate(-50%, -50%);
    }
    .sad-face {
      display: block;
      font-size: 3em;
      padding: 20px;
    }
  `}</style>
  </div>
)

const renderBody = (props: ForecastProps) => (
  <div>
    {props.forecasts.length ? <ForecastsView {...props} /> : (
      <Fragment>
        <Alert status='info'>
          No VitaminD was found within a {props.driveHoursRequested} hour of {props.city.name}.
          Showing results for {MAX_DRIVE_MINUTES / 60} hours.
        </Alert>
        {!props.forecastsOutsideRadius.length ? renderSadFace() : (
          <ForecastsView {...props} forecasts={props.forecastsOutsideRadius} driveHoursRequested={MAX_DRIVE_MINUTES / 60} />
        )}
      </Fragment>
    )}
  </div>
)

const Forecast: NextPage<ForecastProps> = (props: ForecastProps) => {
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<null | 'error' | 'success' | 'verifying'>(null)
  const [alertEmail, setAlertEmail] = useState(props.defaultEmail)

  normalizeWeathResults(props.forecasts)
  normalizeWeathResults(props.forecastsOutsideRadius)

  async function onSetAlert(ev: SyntheticEvent) {
    ev.preventDefault()

    setIsSubmitting(true)
    setCookie(null, 'email', alertEmail, {})

    const data = {
      cityID: props.city.id,
      driveHours: props.driveHoursRequested,
      email: alertEmail,
    }
    try {
      const res = await fetch(process.env.BASE_URL + `/api/user_alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        setSubmitResult('error')
        return
      }
      const result: PostUserAlertResult = await res.json()
      setSubmitResult(result.user.email_confirmed ? 'success' : 'verifying')
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(e)
      }
      setSubmitResult('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderAlertForm() {
    return (
      <form className='alert-form'>
        <label htmlFor='email'>Enter your email:{' '}
          <input type='email' name='email' id='email' value={alertEmail} onChange={e => setAlertEmail(e.target.value)} disabled={isSubmitting} />
        </label>
        {' '}<button
          type='submit'
          onClick={onSetAlert}
          disabled={isSubmitting || !isValidEmail(alertEmail)}
        >Set alert</button>
        <style jsx>{`
        .alert-form label {
          display: inline-block
        }
        .alert-form button {
          display: inline-block
        }
        `}</style>
      </form>
    )
  }

  function renderAlertSubmitResult() {
    if (!submitResult) return null
    let text: string
    switch (submitResult) {
      case 'error':
        text = 'Something went wrong. Try again.'
        break
      case 'success':
        text = 'Alert saved!'
        break
      case 'verifying':
        text = 'Alert saved! Just need to check your email so we can verify it\'s you.'
        break
    }
    return (
      <Alert status={submitResult === 'error' ? 'error' : 'success'}>
        {text}
      </Alert>
    )
  }

  return (
    <Layout>
      {renderAlertSubmitResult()}
      <section>
        <Link href="/"><a>Change your search</a></Link>
        <br /><br />
        <div>
          {isCreatingAlert ? renderAlertForm() : (
            <a href="" onClick={(ev) => { ev.preventDefault(); setIsCreatingAlert(true); }}>Create alert for this</a>
          )}
        </div>
      </section>
      <section>
        {renderBody(props)}
      </section>
      <style jsx>{`
        section {
          margin-bottom: 40px;
        }
      `}</style>
    </Layout>
  )
}

Forecast.getInitialProps = async (ctx): Promise<ForecastProps> => {
  const cookies = parseCookies(ctx)
  const defaultEmail = isValidEmail(cookies.email) ? cookies.email as string : ""

  const { cityID, driveHours, weathType } = ctx.query
  const res = await fetch(process.env.BASE_URL + `/api/weath?driveHours=${driveHours}&cityID=${cityID}&weathType=${weathType}`)
  if (!res.ok) {
    throw new Error((await res.json()).error)
  }

  const result: WeathResult = await res.json()
  return { ...result, defaultEmail }
}

export default Forecast
