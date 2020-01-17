import { NextPage } from 'next'
import fetch from 'isomorphic-unfetch'
import { EvaluatedForecast } from '../scripts/src/types'
import { Fragment } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
function friendlyDay(day: number): string {
  return DAYS[day]
}

function friendlyCloudCover(cloudCover: number): string {
  if (cloudCover < 25.0) return 'Sunny'
  if (cloudCover < 75.0) return 'Partly sunny'
  return 'Cloudy'
}

function friendlyRaininess(rainPct: number): string | null {
  if (rainPct < 5.0) return null
  if (rainPct < 25.0) return 'Patchy rain'
  if (rainPct < 50.0) return 'Showers'
  return 'Rain'
}

function renderTemp(temp: number) {
  return `${Math.round(temp)}\u00B0F`
}

interface IndexProps {
  forecasts: EvaluatedForecast[]
}

function normalizeWeathResults(its: EvaluatedForecast[]): EvaluatedForecast[] {
  its.forEach(f => {
    f.results = f.results.map(([d, df]) => [new Date(d as any as string), df])
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

function renderForecasts(fcs: EvaluatedForecast[]) {
  return (
    <div>
      {fcs.map((f: EvaluatedForecast) => (
        <div key={f.city} className={"city-forecast" + (f.recommended ? " recommended" : "")}>
          <h3>{f.city}</h3>
          {f.results.map(([date, df]) => {
            return (
              <p key={date.getDate()} className={"daily-forecast" + (df.isGoodDay ? " good-day" : "")}>
                {friendlyDay(date.getDay())}:{"  "}{friendlyRaininess(df.rainpct) || friendlyCloudCover(df.cloudcover)} with a high of {renderTemp(df.max)}
              </p>
            )
          })}
        </div>
      ))}
      <style jsx>{`
      .city-forecast {
        margin-bottom: 20px;
      }

      .daily-forecast.good-day {
        font-weight: bold;
        background-color: #98FB98;
      }
      `}</style>
    </div>
  )
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
