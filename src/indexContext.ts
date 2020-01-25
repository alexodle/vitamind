import { createContext } from 'react';

export interface IndexContextProps {
  cityID: string
  driveHours: string
  setCityID: (cityID: string) => void
  setDriveHours: (driveHours: string) => void
}

export const IndexContext = createContext<IndexContextProps>({
  cityID: '-1',
  driveHours: '-1',
  setCityID: (_cid: string) => null,
  setDriveHours: (_driveHours: string) => null,
})
