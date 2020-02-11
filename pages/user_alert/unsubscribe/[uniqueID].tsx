import fetch from 'isomorphic-unfetch'
import { NextPage, NextPageContext } from 'next'
import Link from 'next/link'
import { Alert } from '../../../src/components/Alert'
import { Layout } from '../../../src/components/Layout'

export interface UnsubscribeProps {
  status: 'error' | 'success'
}

const Unsubscribe: NextPage<UnsubscribeProps> = ({ status }) => (
  <Layout>
    <Alert status={status}>
      {status === 'success' ? 'Unsubscribed' : 'Failed to unsubscribe from user alerts. Please try again by refreshing this page.'}
    </Alert>
    <Link href="/"><a>Go home</a></Link>
  </Layout>
)

Unsubscribe.getInitialProps = async (ctx: NextPageContext): Promise<UnsubscribeProps> => {
  const userAlertID = ctx.query.uniqueID as string
  const 
  try {
    const res = await fetch(process.env.BASE_URL + `/api/user_alert/${uniqueID}`, { method: 'DELETE' })
    return { status: res.ok ? 'success' : 'error' }
  } catch (e) {
    console.error(e)
    return { status: 'error' }
  }
}

export default Unsubscribe
