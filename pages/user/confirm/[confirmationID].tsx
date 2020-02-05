import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Alert } from '../../../src/components/alert'

export interface EmailConfirmationProps {
  status: 'error' | 'success'
}

const EmailConfirmation: NextPage<EmailConfirmationProps> = ({ status }) => (
  <div>
    <Head>
      <title>VitaminD - let's get some</title>
    </Head>
    <Link href="/"><a>Go home</a></Link>
    <Alert status={status}>
      {status === 'success' ? 'Email confirmed' : 'Something went wrong... Try the link in your email again.'}
    </Alert>
  </div>
)

EmailConfirmation.getInitialProps = async (ctx: NextPageContext): Promise<EmailConfirmationProps> => {
  const confirmationID = ctx.query.confirmationID as string
  try {
    const res = await fetch(process.env.BASE_URL + `/api/user/confirm/${confirmationID}`, { method: 'PUT' })
    return { status: res.ok ? 'success' : 'error' }
  } catch (e) {
    console.error(e)
    return { status: 'error' }
  }
}

export default EmailConfirmation
