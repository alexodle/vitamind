import fetch from 'isomorphic-unfetch'
import { City, UserAlert, WeathType, PostUserAlertRequest, PostUserAlertResult } from './types'

export async function toggleUserAlert(alertID: number, userUUID: string, active: boolean) {
  const method = active ? 'PUT' : 'DELETE'
  const res = await fetch(process.env.BASE_URL + `/api/user_alert/${alertID}?userUUID=${userUUID}`, { method })
  if (!res.ok) {
    throw new Error(await res.json())
  }
}

export async function createOrUpdateUserAlert(cityID: number, driveHours: number, weathType: WeathType, wkndsOnly: boolean, email: string): Promise<PostUserAlertResult> {
  const data: PostUserAlertRequest = { cityID, driveHours, weathType, wkndsOnly, email }
  const res = await fetch(process.env.BASE_URL + `/api/user_alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(await res.json())
  }
  const result: PostUserAlertResult = await res.json()
  return result
}

export async function updateUserAlert(alertID: number, userUUID: string, cityID: number, maxDriveMinutes: number, weathType: WeathType, wkndsOnly: boolean) {
  const data: Partial<UserAlert> = {
    city: { id: cityID } as City,
    max_drive_minutes: maxDriveMinutes,
    weath_type: weathType,
    wknds_only: wkndsOnly,
  }
  const res = await fetch(process.env.BASE_URL + `/api/user_alert/${alertID}?userUUID=${userUUID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(await res.json())
  }
}
