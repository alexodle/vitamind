import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import { Fragment, FunctionComponent, useState } from 'react'
import { HARDCODED_DARK_CITIES } from '../../gen/ts/db_constants'
import { toggleUserAlert, updateUserAlert } from '../../src/clientAPI'
import { Alert } from '../../src/components/Alert'
import { Layout } from '../../src/components/Layout'
import { VALID_DRIVE_HOURS } from '../../src/constants'
import { GetUserAlertsResult, User, UserAlert, WeathType } from '../../src/types'

export interface ManageAlertsProps {
  user: User
  initialUserAlerts: UserAlert[]
}

interface AlertRowProps {
  user: User
  userAlert: UserAlert
  onUpdate: (update: Partial<UserAlert>, type: 'unsub' | 'sub' | 'props') => void
  onFailedUpdate: () => void
}

interface ButtonProps {
  onClick: () => void
}

const friendlyWeathType = (weathType: WeathType) => weathType === 'sunny' ? 'Sunny weather' : 'Warm weather'

const Button: FunctionComponent<ButtonProps> = ({ children, onClick }) => (
  <a href="#" onClick={ev => { ev.preventDefault(); onClick(); }}>{children}</a>
)

const AlertRow: FunctionComponent<AlertRowProps> = ({ user, userAlert, onUpdate, onFailedUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCityID, setEditingCityID] = useState(userAlert.city_id.toString())
  const [editingDriveHours, setEditingDriveHours] = useState((userAlert.max_drive_minutes / 60).toString())
  const [editingWeathType, setEditingWeathType] = useState(userAlert.weath_type)

  const toggleActive = async () => {
    setIsSubmitting(true)
    try {
      await toggleUserAlert(userAlert.id, user.user_uuid as string, !userAlert.active)
      onUpdate({ ...userAlert, active: !userAlert.active }, userAlert.active ? 'unsub' : 'sub')
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(e)
      }
      onFailedUpdate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveChanges = async () => {
    setIsSubmitting(true)
    try {
      const cityID = parseInt(editingCityID, 10)
      const maxDriveMinutes = parseInt(editingDriveHours, 10) * 60
      const weathType = editingWeathType

      await updateUserAlert(userAlert.id, user.user_uuid as string, cityID, maxDriveMinutes, editingWeathType)

      setIsEditing(false)
      onUpdate({ ...userAlert, city_id: cityID, max_drive_minutes: maxDriveMinutes, weath_type: weathType }, 'props')
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(e)
      }
      onFailedUpdate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderButtons = () => {
    if (isSubmitting) {
      return <span className='loading'>...</span>
    } else if (isEditing) {
      return (
        <Fragment>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button> | <Button onClick={saveChanges}>Update</Button>
        </Fragment>
      )
    } else if (userAlert.active) {
      return (
        <Fragment>
          <Button onClick={() => setIsEditing(true)}>Edit</Button> | <Button onClick={toggleActive}>Unsubscribe</Button>
        </Fragment>
      )
    }
    return <Button onClick={toggleActive}>Activate</Button>
  }

  const renderEditingRow = () => (
    <Fragment>
      <select id='weathType' name='weathType' value={editingWeathType} onChange={e => setEditingWeathType(e.target.value as WeathType)} disabled={isSubmitting}>
        <option value={'sunny'}>Sunny weather</option>
        <option value={'warm'}>Warm weather</option>
      </select>
      {' '}within a{' '}
      <select id='driveHours' name='driveHours' value={editingDriveHours} onChange={ev => setEditingDriveHours(ev.target.value)} disabled={isSubmitting}>
        {VALID_DRIVE_HOURS.map(h =>
          <option key={h} value={h.toString()}>{h} hour</option>
        )}
      </select>
      {' '}drive of{' '}
      <select id='cityID' name='cityID' value={editingCityID} onChange={ev => setEditingCityID(ev.target.value)} disabled={isSubmitting}>
        {HARDCODED_DARK_CITIES.map(([name, cid]) =>
          <option key={cid} value={cid.toString()}>{name}</option>
        )}
      </select>
    </Fragment>
  )

  const renderRow = () => (
    <span className={`alert-display ${userAlert.active ? 'active' : 'inactive'}`}>
      <b>{friendlyWeathType(userAlert.weath_type)}</b> within a <b>{userAlert.max_drive_minutes / 60} hour</b> drive of <b>{userAlert.city_name}</b>
    </span>
  )

  return (
    <Fragment>
      <span className={`alert-display ${userAlert.active ? 'active' : 'inactive'}`}>
        {isEditing ? renderEditingRow() : renderRow()}
      </span>
      <span className='buttons'>{renderButtons()}</span>
      <style jsx>{`
        .alert-display, .buttons {
          display: inline-block;
        }
        .alert-display {
          width: 450px;
        }
        .buttons {
          margin-left: 20px;
        }
        .alert-display.inactive {
          text-decoration-line: line-through;
        }
      `}</style>
    </Fragment>
  )
}

const SUCCESS_MESSAGES = {
  'sub': 'Successfully activated alert.',
  'unsub': 'Deactivated alert.',
  'props': 'Successfully updated alert.',
}

const ERROR_MESSAGE = 'Something went wrong. Please try again.'

const ManageAlerts: NextPage<ManageAlertsProps> = ({ user, initialUserAlerts }) => {
  const [status, setStatus] = useState<{ status: 'error' | 'success', message: string } | null>(null)
  const [userAlerts, setUserAlerts] = useState(initialUserAlerts)

  const updateAlert = (idx: number, update: Partial<UserAlert>) => {
    const newUserAlerts = userAlerts.slice()
    newUserAlerts[idx] = { ...newUserAlerts[idx], ...update }
    setUserAlerts(newUserAlerts)
  }

  const onUpdate = (idx: number, update: Partial<UserAlert>, type: 'sub' | 'unsub' | 'props') => {
    updateAlert(idx, update)
    setStatus({ status: 'success', message: SUCCESS_MESSAGES[type] })
  }

  return (
    <Layout>
      <h2>Manage alerts for {user.email}</h2>
      {status ? <Alert status={status.status}>{status.message}</Alert> : null}
      <ul className='unstyled'>
        {userAlerts.map((a, i) => (
          <li key={a.id}>
            <AlertRow
              user={user}
              userAlert={a}
              onUpdate={(newUserAlert, type) => onUpdate(i, newUserAlert, type)}
              onFailedUpdate={() => setStatus({ status: 'error', message: ERROR_MESSAGE })}
            />
          </li>
        ))}
      </ul>
      <style jsx>{`
        ul.unstyled {
          list-style-type: none;
          padding-inline-start: 0;
        }
      `}</style>
    </Layout>
  )
}

ManageAlerts.getInitialProps = async (ctx: NextPageContext): Promise<ManageAlertsProps> => {
  const userUUID = ctx.query.userUUID as string
  if (!userUUID) {
    throw new Error('Missing required query params')
  }

  const resp = await fetch(process.env.BASE_URL + `/api/user/${userUUID}/alerts`)
  if (!resp.ok) {
    throw new Error((await resp.json()).error)
  }

  const result: GetUserAlertsResult = await resp.json()
  result.user.user_uuid = userUUID

  return {
    user: result.user,
    initialUserAlerts: result.userAlerts,
  }
}

export default ManageAlerts
