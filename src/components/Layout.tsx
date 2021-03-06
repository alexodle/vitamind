import Head from 'next/head';
import Link from "next/link";
import { FunctionComponent } from "react";
import { Colors } from "./colors";
import { BRAND } from '../constants';

const G_ANALYTICS_RAW_JS = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${process.env.G_ANALYTICS_UID}');
`

const GoogleAnalytics: FunctionComponent = () => (
  <>
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-162875180-1" />
    <script dangerouslySetInnerHTML={{ __html: G_ANALYTICS_RAW_JS }} />
  </>
)

export interface LayoutProps {
  includeAnalytics?: boolean
}
export const Layout: FunctionComponent<LayoutProps> = ({ includeAnalytics, children }) => (
  <div className='outer-container'>
    <Head key='layout-head'>
      <title>{BRAND} - find sunny weather within driving distance</title>
      <meta charSet="utf-8" />
      <meta
        name="description"
        content={`${BRAND} helps you find sunny weather within driving distance. Tell us where you live and how far you're willing to drive, and we'll show you fun cities you can visit that are forecasted to get sun in the next 6 days.`}
      />
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      {process.env.NODE_ENV === 'production' && includeAnalytics ? <GoogleAnalytics /> : undefined}
    </Head>
    <header>
      <div className='container'>
        <h1 className='logo'><Link href="/"><a className='unstyled'>{BRAND}</a></Link></h1>
      </div>
    </header>
    <div className='container content'>
      {children}
    </div>
    <footer>
        <p><small>Weather forecasts provided by <a href="https://darksky.net/" target="_blank">DarkSky</a>. Driving distances provided by <a href="https://www.google.com/maps" target="_blank">Google Maps</a>.</small></p>
    </footer>

    <style jsx>{`
      .outer-container {
        height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
      }

      .container {
        margin: 0 auto;
        width: 800px;
      }

      header {
        background-color: ${Colors.primary};
        margin: 0;
        padding: 0;
        margin-bottom: 30px;
        padding-top: 30px;
        width: 100%;
      }

      footer {
        background-color: ${Colors.primary};
        margin: 0;
        padding: 0;
        text-align: center;
      }

      .logo {
        font-size: 60px;
        padding-bottom: 10px;
      }

      a.unstyled {
        text-decoration: none;
        color: inherit;
      }

      @media only screen and (max-width: 812px) {
        .container {
          width: 100%;
          padding-left: 10px;
          padding-right: 10px;
        }
      }
    `}</style>

    <style jsx global>{`
      h1,h2,h3,h4 {
        margin: 0;
        padding: 0;
        margin-bottom: 20px;
        margin-top: 10px;
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        margin: 0;
        padding: 0;
        background-color: ${Colors.contrast};
      }
      body * {
        box-sizing: border-box;
      }
      section {
        margin-bottom: 40px;
      }
      .section-header {
        font-size: larger;
        border-bottom: 1px solid gray;
        padding-bottom: 15px;
        margin-bottom: 30px;
      }
      input {
        border: 1px solid gray;
        border-radius: 5px;
        padding: 10px;
        font-size: 110%;
      }
      label {
        display: block;
        margin-bottom: 20px;
      }
      select, button.submit {
        margin-top: 10px;
        width: 100%;
      }
      select {
        display: block;
        font-size: large;
      }
      button.submit, button[type=submit] {
        position: relative;
        font-size: large;
        background-color: ${Colors.accent2};
        border: gray 1px solid;
        border-radius: 10px;
        padding: 10px;
        cursor: pointer;
      }
      button:enabled:hover {
        filter: brightness(80%);
      }
      button:disabled {
        cursor: initial;
      }
      button:disabled:after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: gray;
        opacity: 0.2;
        border-radius: 10px;
      }
    `}</style>
  </div>
)
