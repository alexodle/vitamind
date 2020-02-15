import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import { Fragment, FunctionComponent, useState } from 'react'
import css from 'styled-jsx/css'
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

interface EditAlerRowProps {
  userAlert: UserAlert
  isSubmitting: boolean
  onSave: (update: Partial<UserAlert>) => void
  onCancel: () => void
}

interface ButtonProps {
  disabled: boolean
  onClick: () => void
}

const rowStyles = css`
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
`

const friendlyWeathType = (weathType: WeathType) => weathType === 'sunny' ? 'Sunny weather' : 'Warm weather'

const Button: FunctionComponent<ButtonProps> = ({ children, onClick, disabled }) => (
  <a href="#" onClick={ev => { ev.preventDefault(); if (!disabled) { onClick(); } }}>{children}</a>
)

const EditAlertRow: FunctionComponent<EditAlerRowProps> = ({ userAlert, onSave, onCancel, isSubmitting }) => {
  const [driveHours, setDriveHours] = useState((userAlert.max_drive_minutes / 60).toString())
  const [weathType, setWeathType] = useState(userAlert.weath_type)

  const onSaveClick = () => {
    onSave({
      max_drive_minutes: parseInt(driveHours, 10) * 60,
      weath_type: weathType,
    })
  }

  return (
    <Fragment>
      <span className='alert-display'>
        <select id='weathType' name='weathType' value={weathType} onChange={e => setWeathType(e.target.value as WeathType)} disabled={isSubmitting}>
          <option value={'sunny'}>Sunny weather</option>
          <option value={'warm'}>Warm weather</option>
        </select>
        {' '}within a{' '}
        <select id='driveHours' name='driveHours' value={driveHours} onChange={ev => setDriveHours(ev.target.value)} disabled={isSubmitting}>
          {VALID_DRIVE_HOURS.map(h =>
            <option key={h} value={h.toString()}>{h} hour</option>
          )}
        </select>
        {' '}drive of{' '}<b>{userAlert.city.name}</b>
      </span>
      <span className='buttons'>
        <Button onClick={onCancel} disabled={isSubmitting}>Cancel</Button> | <Button onClick={onSaveClick} disabled={isSubmitting}>Update</Button>
      </span>
      <style jsx>{rowStyles}</style>
    </Fragment>
  )
}

const AlertRow: FunctionComponent<AlertRowProps> = ({ user, userAlert, onUpdate, onFailedUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleActive = async () => {
    setIsSubmitting(true)
    try {
      await toggleUserAlert(userAlert.id, user.user_uuid!, !userAlert.active)
      onUpdate({ active: !userAlert.active }, userAlert.active ? 'unsub' : 'sub')
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(e)
      }
      onFailedUpdate()
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveChanges = async (update: Partial<UserAlert>) => {
    setIsSubmitting(true)
    try {
      await updateUserAlert(userAlert.id, user.user_uuid!, userAlert.city.id, update.max_drive_minutes!, update.weath_type!)
      onUpdate(update, 'props')
      setIsEditing(false)
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
    if (userAlert.active) {
      return (
        <Fragment>
          <Button onClick={() => setIsEditing(true)} disabled={isSubmitting}>Edit</Button> | <Button onClick={toggleActive} disabled={isSubmitting}>Unsubscribe</Button>
        </Fragment>
      )
    }
    return <Button onClick={toggleActive} disabled={isSubmitting}>Activate</Button>
  }

  const renderEditRow = () => (
    <EditAlertRow userAlert={userAlert} onCancel={() => setIsEditing(false)} onSave={saveChanges} isSubmitting={isSubmitting} />
  )

  const renderRow = () => (
    <Fragment>
      <span className={`alert-display ${userAlert.active ? 'active' : 'inactive'}`}>
        <b>{friendlyWeathType(userAlert.weath_type)}</b> within a <b>{userAlert.max_drive_minutes / 60} hour</b> drive of <b>{userAlert.city.name}</b>
      </span>
      <span className='buttons'>{renderButtons()}</span>
      <style jsx>{rowStyles}</style>
    </Fragment>
  )

  return (
    <Fragment>
      {isEditing ? renderEditRow() : renderRow()}
    </Fragment>
  )
}

const SUCCESS_MESSAGES = {
  'sub': 'Activated alert.',
  'unsub': 'Unsubscribed.',
  'props': 'Updated alert.',
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
      <ul className='alerts-list'>
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
        ul.alerts-list {
          list-style-type: none;
          padding-inline-start: 0;
          margin-top: 30px;
          margin-bottom: 30px;
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
