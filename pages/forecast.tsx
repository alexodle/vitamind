import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import Link from 'next/link'
import { FunctionComponent } from 'react'
import { Alert } from '../src/components/alert'
import { MAX_DRIVE_MINUTES } from '../src/constants'
import { ProcessedDailyForecast, ProcessedForecast, WeathResult } from '../src/types'

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
      .city-forecast {
        margin-bottom: 20px;
      }

      .daily-forecast-list li {
        display: inline-block;
        margin-right: 20px;
      }
    `}</style>
  </div>
)

const OutsideOfRadiusForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, city, forecastsOutsideRadius }) => {
  return (
    <div>
      <Alert status='info'>
        No VitaminD was found within {driveHoursRequested} hours of {city.name}.
        Showing results for {MAX_DRIVE_MINUTES / 60} hours.
      </Alert>
      <h2>VitaminD within a {MAX_DRIVE_MINUTES / 60} hour drive of {city.name}</h2>
      {renderForecasts(forecastsOutsideRadius)}
    </div>
  )
}

const ForecastsView: FunctionComponent<ForecastProps> = ({ driveHoursRequested, forecasts }) => {
  return (
    <div>
      <h2>VitaminD (within {driveHoursRequested} hours drive)</h2>
      {renderForecasts(forecasts)}
    </div>
  )
}

interface ForecastProps extends WeathResult {
}

const Forecast: NextPage<ForecastProps> = (props: ForecastProps) => {
  normalizeWeathResults(props.forecasts)
  normalizeWeathResults(props.forecastsOutsideRadius)

  function renderBody() {
    if (props.forecasts.length) {
      return <ForecastsView {...props} />
    } else if (props.forecastsOutsideRadius.length) {
      return <OutsideOfRadiusForecastsView {...props} />
    }

    return (
      <div className='sad-face-wrapper'>
        <span className='sad-face'>:(</span>
        No VitaminD within a {MAX_DRIVE_MINUTES / 60} hour drive of {props.city.name}
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
  }

  return (
    <div>
      <Link href="/"><a>Change search</a></Link>
      {renderBody()}
    </div>
  )
}

Forecast.getInitialProps = async (ctx): Promise<ForecastProps> => {
  const cityID = ctx.query.cityID as string
  const driveHours = ctx.query.driveHours as string
  const res = await fetch(`http://localhost:3000/api/weath?driveHours=${driveHours}&cityID=${cityID}`)
  if (!res.ok) {
    throw new Error((await res.json()).error)
  }
  const result: WeathResult = await res.json()
  return result
}

export default Forecast
