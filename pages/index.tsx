import { NextPage, NextPageContext } from 'next'
import Router from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import { FunctionComponent, SyntheticEvent, useState } from 'react'
import { DEFAULT_CITY, HARDCODED_DARK_CITIES } from '../gen/ts/db_constants'
import { Layout } from '../src/components/Layout'
import { DEFAULT_COOKIE_OPTIONS, DEFAULT_DRIVE_HOURS, VALID_DRIVE_HOURS } from '../src/constants'
import { WeathType } from '../src/types'
import { isValidWeathType } from '../src/util'

export interface IndexProps {
  defaultCityID?: number
  defaultDriveHours?: number
  defaultWeathType?: WeathType
}

const LongTooltip: FunctionComponent<{}> = ({ children }) => {
  const [show, setShow] = useState(false)
  return (
    <span className='tooltip'>
      <i className='material-icons tooltip-icon' onClick={(e) => { e.preventDefault(); setShow(!show); }}>help_outline</i>
      <div className={`description ${show ? 'show' : ''}`}>{children}</div>
      <style jsx>{`
        .tooltip-icon {
          font-size: small;
          cursor: pointer;
          border-bottom: 1px dotted black;
        }
        .description {
          display: none;
        }
        .description.show {
          display: block;
          font-size: smaller;
          padding: 10px;
          border: 1px solid gray;
          border-radius: 10px;
          margin: 15px 0 15px 0;
          background-color: #F5F5F5;
        }
      `}</style>
    </span>
  )
}

const Index: NextPage<IndexProps> = ({ defaultCityID, defaultDriveHours, defaultWeathType }) => {
  const [cityID, setCityID] = useState((defaultCityID || DEFAULT_CITY).toString())
  const [driveHours, setDriveHours] = useState((defaultDriveHours || DEFAULT_DRIVE_HOURS).toString())
  const [isQuerying, setIsQuerying] = useState(false)
  const [weathType, setWeathType] = useState<WeathType>(defaultWeathType || 'sunny')

  const onSubmit = (ev: SyntheticEvent) => {
    ev.preventDefault()

    setIsQuerying(true)

    // Save last search
    setCookie(null, 'defaultCityID', cityID, DEFAULT_COOKIE_OPTIONS)
    setCookie(null, 'defaultDriveHours', driveHours, DEFAULT_COOKIE_OPTIONS)
    setCookie(null, 'defaultWeathType', weathType, DEFAULT_COOKIE_OPTIONS)

    Router.push(`/forecast?cityID=${cityID}&driveHours=${driveHours}&weathType=${weathType}`)
  }

  return (
    <Layout>
      <section>
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
          <label htmlFor='weathType'>What are you looking for? <LongTooltip>
            <div className='prop-descrip-container'>
              <div className='prop'>Sunny weather</div>
              <div className='descrip'>
                At least two consecutive days with "Warm weather" OR {'<'} 20% chance of rain and {'<'} 75% cloud cover.
              </div>
              <div className='prop'>Warm weather</div>
              <div className='descrip'>
                At least two consecutive days with {'<'} 20% chance of rain, {'<'} 100% cloud cover,{' '}
                max temperature {'>='} 67°F, and a max feels like temparature {'<='} 90°F.
              </div>
            </div>
          </LongTooltip>
            <select id='weathType' name='weathType' value={weathType} onChange={ev => setWeathType(ev.target.value as WeathType)} disabled={isQuerying}>
              <option value={'sunny'}>Sunny weather</option>
              <option value={'warm'}>Warm weather</option>
            </select>
          </label>
          <button className='submit' type='submit' onClick={onSubmit} disabled={isQuerying}>VitaminD please</button>
        </form>
      </section>
      <section>
        <h2>What is VitaminD?</h2>
        <p>
          VitaminD helps you find sun within driving distance. Tell us where you live and how far you're willing to drive{' '}
          and we'll show you fun cities you can visit that are forecasted to get sun in the next 6 days.
        </p>
      </section>
      <section>
        <h2>Your city isn't listed?</h2>
        <p>Check back soon. We're adding more cities every day.</p>
        <figure>
          <iframe className='gmaps-iframe' src="https://www.google.com/maps/d/embed?mid=1QNbxhPjW0O_lLzKbg7J0YZZYR5X8Qp05&hl=en" />
          <figcaption>Coverage as of <b>02-07-2020</b></figcaption>
        </figure>
      </section>
      <style jsx>{`
        label {
          display: block;
          margin-bottom: 20px;
        }
        select, button.submit {
          margin-top: 10px;
          width: 20em;
        }
        select {
          display: block;
          font-size: large;
        }
        button.submit {
          font-size: large;
          background-color: #e0e0e0;
          border: gray 1px solid;
          border-radius: 10px;
          padding: 10px;
          cursor: pointer;
        }
        figure {
          margin: 0;
        }
        .gmaps-iframe {
          border: 0;
          width: 100%;
          height: 480px;
        }
        .city-map {
          width: 657px;
          height: 343px;
          padding: 2px;
          border: gray 1px solid;
          border-radius: 10px;
        }
        .prop-descrip-container {
          display: grid;
          grid-template-columns: auto auto;
          grid-row-gap: 10px;
          grid-column-gap: 20px;
        }
        .prop {
          font-weight: bolder;
        }
        .descrip {
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

  const result: IndexProps = {
    defaultCityID: parseInt(cookies.defaultCityID, 10),
    defaultDriveHours: parseInt(cookies.defaultDriveHours, 10),
  }
  if (isNaN(result.defaultCityID as number) || isNaN(result.defaultDriveHours as number)) {
    return {}
  }

  if (isValidWeathType(cookies.defaultWeathType as WeathType)) {
    result.defaultWeathType = cookies.defaultWeathType as WeathType
  }

  return result
}

export default Index
