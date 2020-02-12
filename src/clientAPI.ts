import fetch from 'isomorphic-unfetch'
import { WeathType, UserAlert } from './types'

export async function toggleUserAlert(alertID: number, userUUID: string, active: boolean) {
  const method = active ? 'PUT' : 'DELETE'
  const res = await fetch(process.env.BASE_URL + `/api/user_alert/${alertID}?userUUID=${userUUID}`, { method })
  if (!res.ok) {
    throw new Error(await res.json())
  }
}

export async function updateUserAlert(alertID: number, userUUID: string, cityID: number, maxDriveMinutes: number, weathType: WeathType) {
  const data: Partial<UserAlert> = {
    city_id: cityID,
    max_drive_minutes: maxDriveMinutes,
    weath_type: weathType,
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
