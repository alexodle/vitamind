import { NextPage } from 'next'
import Router from 'next/router'
import { SyntheticEvent, useContext } from 'react'
import { VALID_DRIVE_HOURS } from '../src/constants'
import { IndexContext } from '../src/indexContext'

const HARDCODED_DARK_CITIES = [
  ['Bend', '10'],
  ['Boise', '11'],
  ['Portland', '28'],
  ['Seattle', '5'],
  ['Spokane', '29'],
  ['Walla Walla', '9'],
  ['Yakima', '34'],
]

const Index: NextPage<{}> = () => {
  const { cityID, driveHours, setCityID, setDriveHours } = useContext(IndexContext)
  console.log('hihi.here is the context:')
  console.dir({ cityID, driveHours, setCityID, setDriveHours })

  function onSubmit(ev: SyntheticEvent) {
    ev.preventDefault()
    Router.push(`/forecast?cityID=${cityID}&driveHours=${driveHours}`)
  }

  return (
    <div>
      <h1>VitaminD <em>Let's get some</em></h1>
      <form>
        <label htmlFor='cityID'>Where do you live? (more cities coming soon!)
          <select id='cityID' name='cityID' value={cityID} onChange={ev => setCityID(ev.target.value)}>
            {HARDCODED_DARK_CITIES.map(([name, cid]) =>
              <option key={cid} value={cid}>{name}</option>
            )}
          </select>
        </label>
        <label htmlFor='driveHours'>How far will you drive?
          <select id='driveHours' name='driveHours' value={driveHours} onChange={ev => setDriveHours(ev.target.value)}>
            {VALID_DRIVE_HOURS.map(h =>
              <option key={h} value={h.toString()}>{h} hours</option>
            )}
          </select>
        </label>
        <button type='submit' onClick={onSubmit}>VitaminD please</button>
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
    </div>
  )
}

export default Index
