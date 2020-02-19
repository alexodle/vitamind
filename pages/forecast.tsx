import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import Link from 'next/link'
import { parseCookies, setCookie } from 'nookies'
import { Fragment, FunctionComponent, SyntheticEvent, useState } from 'react'
import { Alert } from '../src/components/Alert'
import { Layout } from '../src/components/Layout'
import { CSS_MEDIA_PHONE, DEFAULT_COOKIE_OPTIONS, MAX_DRIVE_MINUTES } from '../src/constants'
import { PostUserAlertResult, ProcessedDailyForecast, ProcessedForecast, WeathResult, WeathType } from '../src/types'
import { friendlyDay, friendlyHoursText, friendlyTemp, getWeatherImgs, isValidEmail } from '../src/util'

export interface WeatherIconProps {
  df: ProcessedDailyForecast
}
export const WeatherIcon: FunctionComponent<WeatherIconProps> = ({ df }) => {
  const [img, imgSmall, alt] = getWeatherImgs(df)
  return (<>
    <img alt={alt} src={img} className='icon reg'
      style={{
        display: 'inline-block',
        width: '64px',
        height: '64px',
      }}
    />
    <img alt={alt} src={imgSmall} className='icon small' style={{ display: 'none' }} />
    <style jsx>{`
      @media ${CSS_MEDIA_PHONE} {
        .reg {
          display: none !important;
        }
        .small {
          display: inline-block !important;
          width: 30px;
          height: 30px;
        }
      }`}
    </style>
  </>)
}

export interface DailyForecastContainerProps { }
export const DailyForecastContainer: FunctionComponent<DailyForecastContainerProps> = ({ children }) => (
  <div className='container' style={{
    padding: '10px',
    border: 'gray 1px solid',
    borderRadius: '10px',
    textAlign: 'center',
  }}>
    {children}
  </div >
)

export interface DailyForecastHeaderProps {
  df: ProcessedDailyForecast
  weathType: WeathType
}
export const DailyForecastHeader: FunctionComponent<DailyForecastHeaderProps> = ({ df, weathType }) => {
  const isGoodDay = weathType === 'sunny' ? df.isGoodDay : df.isWarmDay
  const dayNum = (df.date as Date).getDay()
  const [day, dayShort] = friendlyDay(dayNum)
  return (
    <h4 style={{
      display: 'block',
      paddingTop: 0,
      marginTop: 0,
      marginBottom: '10px',
      textAlign: 'center',
      width: '6em',
      backgroundColor: isGoodDay ? '#98FB98' : undefined,
    }}>
      <span className='full'>{day}</span>
      <span className='short' style={{ display: 'none' }}>{dayShort}</span>
      <style jsx>{`
        @media ${CSS_MEDIA_PHONE} {
          .full {
            display: none !important;
          }
          .short {
            display: inline-block !important;
          }
          h4 {
            width: 3em !important;
          }
        }`}
      </style>
    </h4>
  )
}

export interface DailyForecastListProps { }
export const DailyForecastList: FunctionComponent<DailyForecastListProps> = ({ children }) => (
  <ol style={{ paddingInlineStart: 0 }}>
    {children}
    <style jsx>{`
      @media ${CSS_MEDIA_PHONE} {
        ol {
          display: flex;
          justify-content: space-between;
        }
        ol::before {
          content: "";
        }
        ol::after {
          content: "";
        }
      }
    `}</style>
  </ol>
)

export interface DailyForecastListProps { }
export const DailyForecastListItem: FunctionComponent<DailyForecastListProps> = ({ children }) => (
  <li style={{ display: 'inline-block', paddingRight: '20px' }}>
    {children}
    <style jsx>{`
      @media ${CSS_MEDIA_PHONE} {
        li {
          padding-right: 0 !important;
        }
      }
    `}</style>
  </li>
)

export interface DailyForecastBlockProps {
  df: ProcessedDailyForecast
  weathType: WeathType
}
export const DailyForecastBlock: FunctionComponent<DailyForecastBlockProps> = ({ df, weathType }) => (
  <DailyForecastListItem key={(df.date as Date).getDate()}>
    <DailyForecastContainer>
      <DailyForecastHeader df={df} weathType={weathType} />
      <WeatherIcon df={df} /><br />
      {friendlyTemp(df.maxtemp)}
    </DailyForecastContainer>
  </DailyForecastListItem>
)

interface ForecastProps extends WeathResult {
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

const ForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, weathType, sourceCityForecasts, forecasts }) => {
  return (
    <Fragment>
      <section>
        <h2>Stay home? ({city.name})</h2>
        <DailyForecastList>
          {sourceCityForecasts.map(df => <DailyForecastBlock
            key={(df.date as Date).getDate()}
            df={df}
            weathType={weathType}
          />)}
        </DailyForecastList>
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
            <DailyForecastList>
              {f.results.map(df => <DailyForecastBlock
                key={(df.date as Date).getDate()}
                df={df}
                weathType={weathType}
              />)}
            </DailyForecastList>
          </div>
        ))}
      </section>
      <style jsx>{`
        .sub-header {
          transform: translateY(-10px);
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
