import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Alert } from '../../../src/components/alert'

export interface UnsubscribeProps {
  status: 'error' | 'success'
}

const Unsubscribe: NextPage<UnsubscribeProps> = ({ status }) => (
  <div>
    <Head>
      <title>VitaminD - let's get some</title>
    </Head>
    <Link href="/"><a>Go home</a></Link>
    <Alert status={status}>
      {status === 'success' ? 'Unsubscribed' : 'Failed to unsubscribe from user alerts. Please try again by refreshing this page.'}
    </Alert>
  </div>
)


Unsubscribe.getInitialProps = async (ctx: NextPageContext): Promise<UnsubscribeProps> => {
  const uniqueID = ctx.query.uniqueID as string
  try {
    const res = await fetch(process.env.BASE_URL + `/api/user_alert/${uniqueID}`, { method: 'DELETE' })
    return { status: res.ok ? 'success' : 'error' }
  } catch (e) {
    console.error(e)
    return { status: 'error' }
  }
}

export default Unsubscribe
