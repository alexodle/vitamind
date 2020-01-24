import { NextPage } from 'next'
import { useState, SyntheticEvent } from 'react'
import Router from 'next/router'

const HARDCODED_DARK_CITIES = [
  ['10', 'Bend'],
  ['11', 'Boise'],
  ['5', 'Seattle'],
]

const DEFAULT_CITY = '5' // Seattle

interface IndexProps {
}

const Index: NextPage<IndexProps> = () => {
  const [cityID, setCityID] = useState(DEFAULT_CITY)
  const [driveHours, setDriveHours] = useState('8')
  const [isLoading, setIsLoading] = useState(false)

  function onSubmit(ev: SyntheticEvent) {
    ev.preventDefault()
    setIsLoading(true)
    Router.push(`/forecast?cityID=${cityID}&driveHours=${driveHours}`)
  }

  return (
    <div>
      <h1>VitaminD <em>Let's get some</em></h1>
      <form>
        <label htmlFor='cityID'>Where do you live? (more cities coming soon!)
          <select id='cityID' name='cityID' value={cityID} onChange={ev => setCityID(ev.target.value)} disabled={isLoading}>
            {HARDCODED_DARK_CITIES.map(([cid, name]) =>
              <option key={cid} value={cid}>{name}</option>
            )}
          </select>
        </label>
        <label htmlFor='driveHours'>How far will you drive?
          <select id='driveHours' name='driveHours' value={driveHours} onChange={ev => setDriveHours(ev.target.value)} disabled={isLoading}>
            <option value='2'>2 hours</option>
            <option value='4'>4 hours</option>
            <option value='8'>8 hours</option>
            <option value='12'>12 hours</option>
          </select>
        </label>
        <button type='submit' onClick={onSubmit} disabled={isLoading}>VitaminD please</button>
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
