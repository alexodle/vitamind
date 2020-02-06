import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import Link from 'next/link'
import { SyntheticEvent, useState } from 'react'
import { Alert } from '../../../src/components/Alert'
import { Layout } from '../../../src/components/Layout'
import { InvalidRequestErrorStatus } from '../../../src/errors'

export interface EmailConfirmationProps {
  status: 'error' | 'success' | 'toolate'
  confirmationID: string
}

const EmailConfirmation: NextPage<EmailConfirmationProps> = ({ status, confirmationID }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<null | 'success' | 'error'>(null)

  async function resendEmail(ev: SyntheticEvent) {
    ev.preventDefault()

    setIsSubmitting(true)

    try {
      const res = await fetch(process.env.BASE_URL + `/api/user/confirm/${confirmationID}`, { method: 'DELETE' })
      setSubmitResult(res.ok ? 'success' : 'error')
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(e)
      }
      setSubmitResult('error')
    }
  }

  const renderResendAlert = (): string | JSX.Element => (
    <Alert status={submitResult!}>
      {submitResult === 'success' ? 'Check your email. Confirmation resent.' : 'Something went wrong. Try refreshing the page.'}
    </Alert>
  )

  const renderAlert = (): string | JSX.Element => {
    let body: string | JSX.Element
    if (status === 'success') {
      body = 'Email confirmed'
    } else if (status === 'error') {
      body = 'Something went wrong... Try the link in your email again, or try signing up for another alert.'
    } else {
      body = (
        <span>This link is too old. <button onClick={resendEmail} disabled={isSubmitting}>Click here to resend the confirmation email</button></span>
      )
    }
    return (
      <Alert status={status === 'success' ? 'success' : 'error'}>{body}</Alert>
    )
  }

  return (
    <Layout>
      {submitResult === null ? renderAlert() : renderResendAlert()}
      <Link href="/"><a>Go home</a></Link>
    </Layout>
  )
}

EmailConfirmation.getInitialProps = async (ctx: NextPageContext): Promise<EmailConfirmationProps> => {
  const confirmationID = ctx.query.confirmationID as string
  try {
    const res = await fetch(process.env.BASE_URL + `/api/user/confirm/${confirmationID}`, { method: 'PUT' })
    if (res.ok) {
      return { status: 'success', confirmationID: confirmationID }
    } else if (res.status === InvalidRequestErrorStatus) {
      // past the grace period
      return { status: 'toolate', confirmationID: confirmationID }
    }
  } catch (e) {
    console.error(e)
  }

  return { status: 'error', confirmationID: confirmationID }
}

export default EmailConfirmation
