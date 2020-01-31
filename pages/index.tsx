import { NextPage } from 'next'
import Head from 'next/head'
import Router from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import { SyntheticEvent, useState } from 'react'
import { DEFAULT_DRIVE_HOURS, VALID_DRIVE_HOURS } from '../src/constants'

// TODO: generate from script
const HARDCODED_DARK_CITIES = [
  ['Bend', '10'],
  ['Boise', '11'],
  ['Portland', '28'],
  ['Seattle', '5'],
  ['Spokane', '29'],
  ['Walla Walla', '9'],
  ['Yakima', '34'],
]
const DEFAULT_CITY = '5' // Seattle

export interface IndexProps {
  defaultCityID?: number
  defaultDriveHours?: number
}

const Index: NextPage<IndexProps> = ({ defaultCityID, defaultDriveHours }) => {
  const [cityID, setCityID] = useState(defaultCityID ? defaultCityID.toString() : DEFAULT_CITY)
  const [driveHours, setDriveHours] = useState(defaultDriveHours ? defaultDriveHours.toString() : DEFAULT_DRIVE_HOURS.toString())
  const [isQuerying, setIsQuerying] = useState(false)

  const onSubmit = (ev: SyntheticEvent) => {
    ev.preventDefault()

    setIsQuerying(true)

    // Save last search
    setCookie(null, 'defaultCityID', cityID, {})
    setCookie(null, 'defaultDriveHours', driveHours, {})

    Router.push(`/forecast?cityID=${cityID}&driveHours=${driveHours}`)
  }

  return (
    <div>
      <Head>
        <title>VitaminD - let's get some</title>
      </Head>
      <h1> VitaminD <em>let's get some</em></h1 >
      <form>
        <label htmlFor='cityID'>Where do you live? (more cities coming soon!)
          <select id='cityID' name='cityID' value={cityID} onChange={ev => setCityID(ev.target.value)} disabled={isQuerying}>
            {HARDCODED_DARK_CITIES.map(([name, cid]) =>
              <option key={cid} value={cid}>{name}</option>
            )}
          </select>
        </label>
        <label htmlFor='driveHours'>How far will you drive?
          <select id='driveHours' name='driveHours' value={driveHours} onChange={ev => setDriveHours(ev.target.value)} disabled={isQuerying}>
            {VALID_DRIVE_HOURS.map(h =>
              <option key={h} value={h.toString()}>{h} hours</option>
            )}
          </select>
        </label>
        <button type='submit' onClick={onSubmit} disabled={isQuerying}>VitaminD please</button>
      </form>
      <style jsx>{`
      label {
        display: block;
        margin-bottom: 15px;
      }
      select {
        display: block;
      }
      `}</style>
    </div >
  )
}

Index.getInitialProps = (ctx): IndexProps => {
  const cookies = parseCookies(ctx)
  if (!cookies.defaultCityID || !cookies.defaultDriveHours) {
    return {}
  }

  const result = {
    defaultCityID: parseInt(cookies.defaultCityID, 10),
    defaultDriveHours: parseInt(cookies.defaultDriveHours, 10),
  }
  if (isNaN(result.defaultCityID) || isNaN(result.defaultDriveHours)) {
    return {}
  }

  return result
}

export default Index
