import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import { Fragment } from 'react'
import { ProcessedDailyForecast, ProcessedForecast, WeathResult, City } from '../src/types'
import { DEFAULT_DRIVE_TIME } from '../src/constants'

const IMG_SRC = 'imgs'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
function friendlyDay(day: number): string {
  return DAYS[day]
}

function getWeatherImg(df: ProcessedDailyForecast): [string, string] {
  if (df.rainpct > 25) {
    return [`rain_s_cloudy.png`, 'Rainy']
  } else if (df.cloudcover > 25) {
    return [`partly_cloudy.png`, 'Partly cloudy']
  }
  return [`sunny.png`, 'Sunny']
}

function renderTemp(temp: number) {
  return `${Math.round(temp)}\u00B0F`
}

function normalizeWeathResults(its: ProcessedForecast[]): ProcessedForecast[] {
  its.forEach(f => {
    f.results.forEach(df => { df.date = new Date(df.date) })
  })
  return its
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
        <h3>{f.city} ({Math.floor(f.driveTimeMinutes / 60)} hours)</h3>
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


interface ForecastProps {
  city: City
  forecasts: ProcessedForecast[]
  driveHours: number
}

const Forecast: NextPage<ForecastProps> = ({ forecasts, driveHours, city }) => {
  forecasts = normalizeWeathResults(forecasts)
  return (
    <div>
      {!forecasts.length ? (
        <div className='sad-face-wrapper'>
          <span className='sad-face'>:(</span>
          No VitaminD within a {driveHours} hour drive of {city.name}
        </div>
      ) : (
          <Fragment>
            <h2>Roadtrips (within {driveHours} hours drive)</h2>
            {renderForecasts(forecasts)}
          </Fragment>
        )}
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
