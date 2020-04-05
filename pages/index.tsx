import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import Router from 'next/router'
import { parseCookies, setCookie } from 'nookies'
import { FunctionComponent, SyntheticEvent, useState } from 'react'
import { DEFAULT_CITY, HARDCODED_DARK_CITIES } from '../gen/ts/db_constants'
import { Layout } from '../src/components/Layout'
import { DEFAULT_COOKIE_OPTIONS, DEFAULT_DRIVE_HOURS, VALID_DRIVE_HOURS } from '../src/constants'
import { WeathType } from '../src/types'
import { isValidEmail, isValidWeathType, parseBool } from '../src/util'

interface LongTooltipProps {
  iconText?: string
}
const LongTooltip: FunctionComponent<LongTooltipProps> = ({ iconText, children }) => {
  const [show, setShow] = useState(false)
  return (
    <span className='tooltip'>
      {iconText ?
        <span className='tooltip-icon' onClick={(e) => { e.preventDefault(); setShow(!show); }}>{iconText}</span> :
        <i className='material-icons tooltip-icon' onClick={(e) => { e.preventDefault(); setShow(!show); }}>help_outline</i>}
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

interface CityRequestFormProps {
  defaultEmail: string | undefined
}
const CityRequestForm: FunctionComponent<CityRequestFormProps> = ({ defaultEmail = '' }) => {
  const [city, setCity] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [requested, setRequested] = useState(false)

  const onSubmit = (ev: SyntheticEvent) => {
    ev.preventDefault()
    setRequested(true)

    // fire and forget
    fetch(`${process.env.BASE_URL}/api/city_request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, email }),
    })
  }

  return (
    <>
      {requested ? <p>Thanks! Your request has been sent. We'll send you an email if your city is added.</p> : (
        <form onSubmit={onSubmit}>
          <label htmlFor="city">Your city:<br />
            <input name="city" placeholder="Pleasantville, IA" value={city} onChange={e => setCity(e.target.value)} />
          </label>
          <label htmlFor="email">Your email (we'll only email you if we actually add your city):<br />
            <input name="email" type="email" placeholder="your.email@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={city.length < 4 || !isValidEmail(email)}>Request my city</button>
        </form>
      )}
      <style jsx>
        {`
          button {
            width: 100%;
          }
          label {
            font-size: 110%;
            font-weight: bold;
          }
          input {
            margin-top: 10px;
            width: 100%;
          }
        `}
      </style>
    </>
  )
}

export interface IndexProps {
  defaultCityID?: number
  defaultDriveHours?: number
  defaultWeathType?: WeathType
  defaultWkndsOnly?: boolean
  defaultEmail?: string
}
const Index: NextPage<IndexProps> = ({ defaultCityID, defaultDriveHours, defaultWeathType, defaultWkndsOnly, defaultEmail }) => {
  const [cityID, setCityID] = useState((defaultCityID || DEFAULT_CITY).toString())
  const [driveHours, setDriveHours] = useState((defaultDriveHours || DEFAULT_DRIVE_HOURS).toString())
  const [weathType, setWeathType] = useState<WeathType>(defaultWeathType || 'sunny')
  const [wkndsOnly, setWkndsOnly] = useState(!!defaultWkndsOnly)
  const [isQuerying, setIsQuerying] = useState(false)

  const onSubmit = (ev: SyntheticEvent) => {
    ev.preventDefault()

    setIsQuerying(true)

    // Save last search
    setCookie(null, 'defaultCityID', cityID, DEFAULT_COOKIE_OPTIONS)
    setCookie(null, 'defaultDriveHours', driveHours, DEFAULT_COOKIE_OPTIONS)
    setCookie(null, 'defaultWeathType', weathType, DEFAULT_COOKIE_OPTIONS)
    setCookie(null, 'defaultWkndsOnly', wkndsOnly.toString(), DEFAULT_COOKIE_OPTIONS)

    Router.push(`/forecast?cityID=${cityID}&driveHours=${driveHours}&weathType=${weathType}&wkndsOnly=${wkndsOnly}`)
  }

  return (
    <Layout includeAnalytics>
      <section>
        <div className='city-req'><LongTooltip iconText="Your city isn't listed? Tell us!"><CityRequestForm defaultEmail={defaultEmail} /></LongTooltip></div>
        <form className='index-form'>
          <label htmlFor='cityID'>Where do you live? {' '}
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
          <label>What are you looking for? <LongTooltip>
            <>
              <div className='prop-descrip-container'>
                <div className='prop'>Sunny weather</div>
                <div className='descrip'>
                  At least two consecutive days* with "Warm weather" OR {'<'} 20% chance of rain and {'<'} 75% cloud cover.
                </div>
                <div className='prop'>Warm weather</div>
                <div className='descrip'>
                  At least two consecutive days* with {'<'} 20% chance of rain, {'<'} 100% cloud cover,{' '}
                  max temperature {'>='} 67°F, and a max feels like temparature {'<='} 90°F.
                </div>
              </div>
              <p className='caveats'>* Just one day is required for <em>Weekends only</em> searches</p>
            </>
          </LongTooltip>
            <select id='weathType' name='weathType' value={weathType} onChange={ev => setWeathType(ev.target.value as WeathType)} disabled={isQuerying}>
              <option value={'sunny'}>Sunny weather</option>
              <option value={'warm'}>Warm weather</option>
            </select>
          </label>
          <label htmlFor='wkndsOnly'>
            <input id='wkndsOnly' name='wkndsOnly' type='checkbox' checked={wkndsOnly} onChange={ev => setWkndsOnly(!!ev.target.checked)} disabled={isQuerying} />
            {' '}Weekends only?
          </label>
          <button className='submit' type='submit' onClick={onSubmit} disabled={isQuerying}>Get That Vitamin D</button>
        </form>
      </section>
      <section>
        <h2 className='section-header'>What is Get That Vitamin D?</h2>
        <p>
          Get That Vitamin D helps you find sunny weather within driving distance. Tell us where you live and how far you're willing to drive,{' '}
          and we'll show you fun cities you can visit that are forecasted to get sun in the next 6 days.
        </p>
      </section>
      <section>
        <h2 className='section-header'>Coverage map</h2>
        Get That Vitamin D currently targets the greater PNW. <LongTooltip iconText="If you think we should add your city, tell us!"><CityRequestForm defaultEmail={defaultEmail} /></LongTooltip><br /><br />
        <figure>
          <iframe className='gmaps-iframe' src="https://www.google.com/maps/d/embed?mid=1QNbxhPjW0O_lLzKbg7J0YZZYR5X8Qp05&hl=en" />
          <figcaption>Coverage as of <b>03-02-2020</b></figcaption>
        </figure>
      </section>
      <style jsx>{`
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
        .caveats {
          margin-bottom: 0;
        }
        .city-req {
          margin-bottom: 20px;
        }
      `}</style>
    </Layout>
  )
}

Index.getInitialProps = (ctx: NextPageContext): IndexProps => {
  const result: IndexProps = {}

  const cookies = parseCookies(ctx)

  const defaultCityID = parseInt(cookies.defaultCityID, 10)
  if (!isNaN(defaultCityID)) {
    result.defaultCityID = defaultCityID
  }

  const defaultDriveHours = parseInt(cookies.defaultDriveHours, 10)
  if (!isNaN(defaultDriveHours)) {
    result.defaultDriveHours = defaultDriveHours
  }

  if (isValidWeathType(cookies.defaultWeathType as WeathType)) {
    result.defaultWeathType = cookies.defaultWeathType as WeathType
  }

  if (cookies.defaultWkndsOnly !== undefined) {
    result.defaultWkndsOnly = parseBool(cookies.defaultWkndsOnly)
  }

  if (isValidEmail(cookies.email)) {
    result.defaultEmail = cookies.email
  }

  return result
}

export default Index
