import { NextPage, NextPageContext } from 'next'
import Router from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import { SyntheticEvent, useState } from 'react'
import { DEFAULT_CITY, HARDCODED_DARK_CITIES } from '../gen/ts/db_constants'
import { Layout } from '../src/components/Layout'
import { DEFAULT_DRIVE_HOURS, VALID_DRIVE_HOURS } from '../src/constants'

export interface IndexProps {
  defaultCityID?: number
  defaultDriveHours?: number
}

const Index: NextPage<IndexProps> = ({ defaultCityID, defaultDriveHours }) => {
  const [cityID, setCityID] = useState((defaultCityID || DEFAULT_CITY).toString())
  const [driveHours, setDriveHours] = useState((defaultDriveHours || DEFAULT_DRIVE_HOURS).toString())
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
    <Layout>
      <form className='index-form'>
        <label htmlFor='cityID'>Where do you live? (more cities coming soon!)
          <select id='cityID' name='cityID' value={cityID} onChange={ev => setCityID(ev.target.value)} disabled={isQuerying}>
            {HARDCODED_DARK_CITIES.map(([name, cid]) =>
              <option key={cid} value={cid.toString()}>{name}</option>
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
        <button className='submit' type='submit' onClick={onSubmit} disabled={isQuerying}>VitaminD please</button>
      </form>
      <style jsx>{`
      .index-form {
      }
      label {
        display: block;
        margin-bottom: 20px;
      }
      select {
        display: block;
        font-size: large;
        margin-top: 10px;
        width: 10em;
      }
      button.submit {
        font-size: large;
        background-color: none;
        border: gray 1px solid;
        border-radius: 10px;
        padding: 10px;
        cursor: pointer;
      }
      `}</style>
    </Layout>
  )
}

Index.getInitialProps = (ctx: NextPageContext): IndexProps => {
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
