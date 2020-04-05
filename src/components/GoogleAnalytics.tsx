import { FunctionComponent, useEffect } from "react";
import Head from 'next/head';

const RAW_JS = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${process.env.G_ANALYTICS_UID}');
`

export const GoogleAnalytics: FunctionComponent = () => (
  <Head key='google-analytics'>
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-162875180-1" />
    <script dangerouslySetInnerHTML={{ __html: RAW_JS }} />
  </Head>
)
