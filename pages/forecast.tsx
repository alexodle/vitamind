import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import Link from 'next/link'
import { parseCookies, setCookie } from 'nookies'
import { Fragment, FunctionComponent, SyntheticEvent, useState } from 'react'
import { Alert } from '../src/components/Alert'
import { Layout } from '../src/components/Layout'
import { DEFAULT_COOKIE_OPTIONS, MAX_DRIVE_MINUTES } from '../src/constants'
import { PostUserAlertResult, ProcessedDailyForecast, ProcessedForecast, WeathResult, WeathType } from '../src/types'
import { friendlyDay, friendlyHoursText, friendlyTemp, getWeatherImg, isValidEmail } from '../src/util'

export interface ForecastProps extends WeathResult {
  defaultEmail: string
}

const friendlyWeathType = (weathType: WeathType) => weathType === 'sunny' ? 'sunny weather' : 'warm weather'

function normalizeDailyForecast(df: ProcessedDailyForecast) {
  df.date = new Date(df.date)
}

function normalizeWeathResults(its: ProcessedForecast[]) {
  its.forEach(f => {
    f.results.forEach(normalizeDailyForecast)
  })
}

function renderForecastDay(df: ProcessedDailyForecast, weathType: WeathType): JSX.Element {
  const [img, alt] = getWeatherImg(df)
  const isGoodDay = weathType === 'sunny' ? df.isGoodDay : df.isWarmDay
  return (
    <div className='daily-forecast-container'>
      <h4 className={"daily-forecast" + (isGoodDay ? " good-day" : "")}>{friendlyDay((df.date as Date).getDay())}</h4>
      <img className='weather-icon' src={`imgs/${img}`} alt={alt} /> {friendlyTemp(df.maxtemp)}
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

const ForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, weathType, sourceCityForecasts, forecasts }) => {
  return (
    <Fragment>
      <section>
        <h2>Stay home? ({city.name})</h2>
        <ol className='daily-forecast-list'>
          {sourceCityForecasts.map(df => {
            return (
              <li key={(df.date as Date).getDate()}>
                {renderForecastDay(df, weathType)}
              </li>
            )
          })}
        </ol>
      </section>
      <section>
        <h2>Or get out?</h2>
        <p className='sub-header'>
          We found <b>{forecasts.length} {forecasts.length === 1 ? 'destination' : 'destinations'}</b>{' '}
          with <b>{friendlyWeathType(weathType)}</b>{' '}
          within a <b>{driveHoursRequested} hour</b>{' '}
          drive of <b>{city.name}</b>
        </p>
        {forecasts.map((f: ProcessedForecast) => (
          <div key={f.city.id} className="city-forecast recommended">
            <h3>{f.city.name} ({friendlyHoursText(f.driveTimeMinutes)})</h3>
            <ol className='daily-forecast-list'>
              {f.results.map(df => {
                return (
                  <li key={(df.date as Date).getDate()}>
                    {renderForecastDay(df, weathType)}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </section>
      <style jsx>{`
        .sub-header {
          transform: translateY(-10px);
          margin-bottom: 20px;
        }
        .daily-forecast-list {
          padding-inline-start: 0;
        }
        .daily-forecast-list li {
          display: inline-block;
          margin-right: 20px;
          margin-bottom: 20px;
        }
        `}</style>
    </Fragment >
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

const Forecast: NextPage<ForecastProps> = (props: ForecastProps) => {
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<null | 'error' | 'success' | 'verifying'>(null)
  const [alertEmail, setAlertEmail] = useState(props.defaultEmail)

  normalizeWeathResults(props.forecasts)
  normalizeWeathResults(props.forecastsOutsideRadius)
  props.sourceCityForecasts.forEach(normalizeDailyForecast)

  async function onSetAlert(ev: SyntheticEvent) {
    ev.preventDefault()

    setIsSubmitting(true)
    setCookie(null, 'email', alertEmail, DEFAULT_COOKIE_OPTIONS)

    const data = {
      cityID: props.city.id,
      driveHours: props.driveHoursRequested,
      weathType: props.weathType,
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
            <a href="#" onClick={(ev) => { ev.preventDefault(); setIsCreatingAlert(true); }}>Create alert for this</a>
          )}
        </div>
      </section>
      {props.forecasts.length ? <ForecastsView {...props} /> : (
        <Fragment>
          <Alert status='info'>
            No {friendlyWeathType(props.weathType)} was found within a {props.driveHoursRequested} hour drive of {props.city.name}.
            Showing results for {MAX_DRIVE_MINUTES / 60} hours.
          </Alert>
          {!props.forecastsOutsideRadius.length ? renderSadFace() : (
            <ForecastsView {...props} forecasts={props.forecastsOutsideRadius} driveHoursRequested={MAX_DRIVE_MINUTES / 60} />
          )}
        </Fragment>
      )}
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
