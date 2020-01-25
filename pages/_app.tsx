import App from 'next/app'
import React from 'react'
import { DEFAULT_DRIVE_HOURS } from '../src/constants'
import { IndexContext, IndexContextProps } from '../src/indexContext'

const DEFAULT_CITY_ID = '5' // Seattle

export default class MyApp extends App {

  state = {
    cityID: DEFAULT_CITY_ID,
    driveHours: DEFAULT_DRIVE_HOURS.toString(),
  }

  render() {
    const { Component, pageProps } = this.props

    // Ensure we preserve city and state accross page nav
    const { cityID, driveHours } = this.state
    const indexContextProps: IndexContextProps = {
      cityID,
      driveHours,
      setCityID: (cityID: string) => this.setState({ cityID }),
      setDriveHours: (driveHours: string) => this.setState({ driveHours }),
    }

    return (
      <IndexContext.Provider value={indexContextProps}>
        <Component {...pageProps} />
      </IndexContext.Provider>
    )
  }
}
