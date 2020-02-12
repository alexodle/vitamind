import { NextPage, NextPageContext } from 'next'
import Link from 'next/link'
import { toggleUserAlert } from '../../../src/clientAPI'
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
  const userUUID = ctx.query.userUUID as string
  const alertID = parseInt(ctx.query.id as string, 10)
  if (isNaN(alertID) || !userUUID) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('missing query params')
    }
    return { status: 'error' }
  }

  try {
    await toggleUserAlert(alertID, userUUID, false)
    return { status: 'success' }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(e)
    }
    return { status: 'error' }
  }
}

export default Unsubscribe
