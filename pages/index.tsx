import { NextPage } from 'next'
import fetch from 'isomorphic-unfetch'

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

interface DailyForecast {
  min: number
  max: number
  maxfeel: number
  minfeel: number
  cloudcover: number
  rainpct: number
}

interface Forecast {
  city: string
  results: [Date, DailyForecast][]
}

interface IndexProps {
  forecasts: Forecast[]
}

function normalizeWeathResults(its: Forecast[]): Forecast[] {
  its.forEach(f => {
    f.results = f.results.map(([d, df]) => [new Date(d as any as string), df])
  })
  return its
}

const Index: NextPage<IndexProps> = ({ forecasts }) => {
  forecasts = normalizeWeathResults(forecasts)
  return (
    <div>
      {forecasts.map((f: Forecast) => (
        <div key={f.city}>
          <h2>{f.city}</h2>
          {f.results.map(([date, df]) => {
            return (
              <p key={date.getDate()}>
                <b>{friendlyDay(date.getDay())}</b>:{"  "}{friendlyRaininess(df.rainpct) || friendlyCloudCover(df.cloudcover)} with a high of {renderTemp(df.max)}
              </p>
            )
          })}
          <br />
          <br />
        </div>
      ))}
    </div>
  )
}

Index.getInitialProps = async (): Promise<IndexProps> => {
  const res = await fetch('http://localhost:3000/api/weath')
  const json = await res.json()
  return { forecasts: json.forecasts }
}

export default Index
