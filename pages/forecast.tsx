import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import Link from 'next/link'
import { parseCookies, setCookie } from 'nookies'
import { Fragment, FunctionComponent, SyntheticEvent, useState } from 'react'
import { createOrUpdateUserAlert } from '../src/clientAPI'
import { Alert } from '../src/components/Alert'
import { Layout } from '../src/components/Layout'
import { CSS_MEDIA_PHONE, DEFAULT_COOKIE_OPTIONS, MAX_DRIVE_MINUTES } from '../src/constants'
import { City, ProcessedDailyForecast, ProcessedForecast, WeathResult, WeathType } from '../src/types'
import { aOrAn, capitalizeFirst, friendlyDay, friendlyHoursText, friendlyTemp, getWeatherImgs, isValidEmail, isWeekend } from '../src/util'
import { Colors } from '../src/components/colors'

export interface SearchCriteriaProps {
  capitalize?: boolean
  city: Omit<City, 'selectable'>
  maxDriveMinutes: number
  weathType: WeathType
  wkndsOnly: boolean
}
export const SearchCriteria: FunctionComponent<SearchCriteriaProps> = ({ capitalize, city, maxDriveMinutes, weathType, wkndsOnly }) => {
  const driveHours = maxDriveMinutes / 60
  if (!wkndsOnly) {
    return <><b>{capitalize ? capitalizeFirst(weathType) : weathType} weather</b> within {aOrAn(driveHours)} <b>{driveHours} hour</b> drive of <b>{city.name}</b></>
  }
  return <><b>{capitalize ? capitalizeFirst(weathType) : weathType} weather</b> <b>this weekend</b> within {aOrAn(driveHours)} <b>{driveHours} hour</b> drive of <b>{city.name}</b></>
}

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

export interface DailyForecastContainerProps {
  grayedOut?: Boolean
}
export const DailyForecastContainer: FunctionComponent<DailyForecastContainerProps> = ({ children, grayedOut }) => {
  return (
    <div className='container' style={{
      padding: '10px',
      borderRadius: '10px',
      textAlign: 'center',

      color: grayedOut ? '#9e9e9e' : undefined,
      backgroundColor: grayedOut ? '#eeeeee' : undefined,
    }}>
      {children}
      <style jsx>{`
      .container {
        background-color: white;
        box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12);
      }
      @media ${CSS_MEDIA_PHONE} {
        .container {
          padding-left: 5px !important;
          padding-right: 5px !important;
        }
      }`}
      </style>
    </div>
  )
}

export interface DailyForecastHeaderProps {
  df: ProcessedDailyForecast
  recommended?: boolean
}
export const DailyForecastHeader: FunctionComponent<DailyForecastHeaderProps> = ({ df, recommended }) => {
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
      backgroundColor: recommended ? '#98FB98' : undefined,
      borderRadius: recommended ? '5px' : undefined,
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
  <ol className='daily-forecast-list' style={{ paddingInlineStart: 0 }}>
    {children}
    <style jsx>{`
      @media ${CSS_MEDIA_PHONE} {
        .daily-forecast-list {
          display: flex;
          justify-content: space-between;
        }
        .daily-forecast-list::before {
          content: "";
        }
        .daily-forecast-list::after {
          content: "";
        }
      }
    `}</style>
  </ol>
)

export interface DailyForecastListProps {
  isLast?: boolean
}
export const DailyForecastListItem: FunctionComponent<DailyForecastListProps> = ({ children, isLast }) => (
  <li className='daily-forecast-li' style={{ display: 'inline-block', paddingRight: !isLast ? '15px' : 0 }}>
    {children}
    <style jsx>{`
      @media ${CSS_MEDIA_PHONE} {
        .daily-forecast-li {
          padding-right: 0 !important;
        }
      }
    `}</style>
  </li>
)

export interface DailyForecastBlockProps {
  df: ProcessedDailyForecast
  weathType: WeathType
  wkndsOnly: boolean
  isLast?: boolean
}
export const DailyForecastBlock: FunctionComponent<DailyForecastBlockProps> = ({ df, weathType, wkndsOnly, isLast }) => {
  const isRecommended = weathType === 'sunny' ? df.isGoodDay : df.isWarmDay
  return (
    <DailyForecastListItem key={(df.date as Date).getDate()} isLast={isLast}>
      <DailyForecastContainer grayedOut={wkndsOnly && !isWeekend(df.date as Date)}>
        <DailyForecastHeader df={df} recommended={isRecommended} />
        <WeatherIcon df={df} /> <br />
        {friendlyTemp(df.maxtemp)}
      </DailyForecastContainer>
    </DailyForecastListItem>
  )
}

interface ForecastProps extends WeathResult {
  defaultEmail: string
}

function normalizeDailyForecast(df: ProcessedDailyForecast) {
  df.date = new Date(df.date)
}

function normalizeWeathResults(its: ProcessedForecast[]) {
  its.forEach(f => {
    f.results.forEach(normalizeDailyForecast)
  })
}

const ForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, weathType, wkndsOnly, sourceCityForecasts, forecasts }) => {
  return (
    <Fragment>
      <section>
        <h2 className='section-header'>
          <b>{forecasts.length} {forecasts.length === 1 ? 'destination' : 'destinations'}</b>{' '}
          with <SearchCriteria city={city} weathType={weathType} maxDriveMinutes={driveHoursRequested * 60} wkndsOnly={wkndsOnly} />
        </h2>
        {forecasts.map((f: ProcessedForecast) => (
          <div key={f.city.id} className="city-forecast recommended">
            <h3>{f.city.name} ({friendlyHoursText(f.driveTimeMinutes)})</h3>
            <DailyForecastList>
              {f.results.map((df, i) => <DailyForecastBlock
                key={(df.date as Date).getDate()}
                df={df}
                weathType={weathType}
                wkndsOnly={wkndsOnly}
                isLast={i === f.results.length - 1}
              />)}
            </DailyForecastList>
          </div>
        ))}
      </section>
      <section>
        <h2 className='section-header'>
          Or, stay in <b>{city.name}</b>
        </h2>
        <DailyForecastList>
          {sourceCityForecasts.map(df => <DailyForecastBlock
            key={(df.date as Date).getDate()}
            df={df}
            weathType={weathType}
            wkndsOnly={wkndsOnly}
          />)}
        </DailyForecastList>
      </section>
      <style jsx>{`
        .section-header {
          font-weight: normal;
        }
      `}</style>
    </Fragment>
  )
}

const Forecast: NextPage<ForecastProps> = (props: ForecastProps) => {
  const [isCreatingAlertTop, setIsCreatingAlertTop] = useState(false)
  const [isCreatingAlertSadFace, setIsCreatingAlertSadFace] = useState(false)
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

    try {
      const result = await createOrUpdateUserAlert(
        props.city.id,
        props.driveHoursRequested,
        props.weathType,
        props.wkndsOnly,
        alertEmail
      )
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
          <input autoFocus type='email' name='email' id='email' value={alertEmail} onChange={e => setAlertEmail(e.target.value)} disabled={isSubmitting} />
        </label>
        {' '}<button
          type='submit'
          onClick={onSetAlert}
          disabled={isSubmitting || !isValidEmail(alertEmail)}
        >Create alert</button>
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

  const renderSadFace = () => (
    <div className='sad-face-wrapper'>
      {isCreatingAlertSadFace ? renderAlertForm() : (
        <p>No results. Try <Link href="/"><a>changing your search</a></Link>, or <a href='#' onClick={ev => { ev.preventDefault(); setIsCreatingAlertSadFace(true); }}> get alerted when things change</a>.</p>
      )}
      <p className='sad-face'>:(</p>
      <style jsx>{`
        .sad-face-wrapper {
          text-align: center;
          margin-top: 100px;
          margin-bottom: 100px;
        }
        .sad-face {
          font-size: 15em;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  )

  return (
    <Layout includeAnalytics>
      {renderAlertSubmitResult()}
      <section>
        <Link href="/"><a>Change your search</a></Link>
        <br /><br />
        <div>
          {isCreatingAlertTop ? renderAlertForm() : (
            <a href="#" onClick={(ev) => { ev.preventDefault(); setIsCreatingAlertTop(true); }}>Create alert for this</a>
          )}
        </div>
      </section>
      {props.forecasts.length ? <ForecastsView {...props} /> : (
        <Fragment>
          <Alert status='info'>
            No results found for <SearchCriteria city={props.city} maxDriveMinutes={props.driveHoursRequested * 60} weathType={props.weathType} wkndsOnly={props.wkndsOnly} />.<br />
            <b>Showing results for {MAX_DRIVE_MINUTES / 60} hours.</b>
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

  const { cityID, driveHours, weathType, wkndsOnly } = ctx.query
  const res = await fetch(`${process.env.BASE_URL}/api/weath?driveHours=${driveHours}&cityID=${cityID}&weathType=${weathType}&wkndsOnly=${wkndsOnly}`)
  if (!res.ok) {
    throw new Error((await res.json()).error)
  }

  const result: WeathResult = await res.json()
  return { ...result, defaultEmail }
}

export default Forecast
