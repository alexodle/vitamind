import fetch from 'isomorphic-unfetch'
import { NextPage } from 'next'
import { Fragment } from 'react'
import { EvaluatedDailyForecast, EvaluatedForecast } from '../src/types'

const IMG_SRC = 'imgs'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
function friendlyDay(day: number): string {
  return DAYS[day]
}

function getWeatherImg(df: EvaluatedDailyForecast): [string, string] {
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

function normalizeWeathResults(its: EvaluatedForecast[]): EvaluatedForecast[] {
  its.forEach(f => {
    f.results.forEach(df => { df.date = new Date(df.date) })
  })
  return its
}

function partitionRecommendations(fcs: EvaluatedForecast[]): [EvaluatedForecast[], EvaluatedForecast[]] {
  const recommended: EvaluatedForecast[] = []
  const notRecommended: EvaluatedForecast[] = []
  fcs.forEach(fc => {
    if (fc.recommended) recommended.push(fc)
    else notRecommended.push(fc)
  })
  return [recommended, notRecommended]
}

function renderForecastDay(df: EvaluatedDailyForecast): JSX.Element {
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

const renderForecasts = (fcs: EvaluatedForecast[]): JSX.Element => (
  <div>
    {fcs.map((f: EvaluatedForecast) => (
      <div key={f.city} className={"city-forecast" + (f.recommended ? " recommended" : "")}>
        <h3>{f.city}</h3>
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


interface IndexProps {
  forecasts: EvaluatedForecast[]
}

const Index: NextPage<IndexProps> = ({ forecasts }) => {
  forecasts = normalizeWeathResults(forecasts)

  const [recommended, notRecommended] = partitionRecommendations(forecasts)
  return (
    <div>
      <h2>Recommended</h2>
      {!recommended.length ? <p>:(</p> : renderForecasts(recommended)}
      {!notRecommended.length ? null : (
        <Fragment>
          <br />
          <h2>Not recommended</h2>
          {renderForecasts(notRecommended)}
        </Fragment>
      )}
    </div>
  )
}

Index.getInitialProps = async (): Promise<IndexProps> => {
  const res = await fetch('http://localhost:3000/api/weath')
  const json = await res.json()
  return { forecasts: json.forecasts }
}

export default Index
