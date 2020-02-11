import Head from 'next/head';
import Link from "next/link";
import { FunctionComponent } from "react";

export const Layout: FunctionComponent<{}> = ({ children }) => (
  <div className='container'>
    <Head key='layout-head'>
      <title>VitaminD</title>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
      />
      <link
        href="https://fonts.googleapis.com/css?family=IBM+Plex+Serif&display=swap"
        rel="stylesheet"
      />
    </Head>
    <h1 className='logo'><Link href="/"><a className='unstyled'>VitaminD</a></Link></h1>
    {children}
    <footer>
      <p><small>Weather forecasts provided by <a href="https://darksky.net/" target="_blank">DarkSky</a>. Driving distances provided by <a href="https://www.google.com/maps" target="_blank">Google Maps</a>.</small></p>
    </footer>

    <style jsx>{`
      .container {
        margin: auto;
        width: 900px;
      }
      .logo {
        font-size: 40px;
      }
      a.unstyled {
        text-decoration: none;
        color: inherit;
      }
      @media only screen and (max-width: 812px) {
        .container {
          width: 100%;
        }
      }
    `}</style>

    <style jsx global>{`
      body {
        font-family: 'IBM Plex Serif', serif;
      }
    `}</style>
  </div >
)
