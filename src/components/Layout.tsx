import Head from 'next/head';
import Link from "next/link";
import { FunctionComponent } from "react";
import { Colors } from "./colors";

export const Layout: FunctionComponent<{}> = ({ children }) => (
  <>
    <Head key='layout-head'>
      <title>Get That Vitamin D - find sunny weather within driving distance</title>
      <meta charSet="utf-8" />
      <meta
        name="description"
        content="Get That Vitamin D helps you find sunny weather within driving distance. Tell us where you live and how far you're willing to drive, and we'll show you fun cities you can visit that are forecasted to get sun in the next 6 days."
      />
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
      />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
    </Head>
    <header>
      <div className='container'>
        <h1 className='logo'><Link href="/"><a className='unstyled'>Get That Vitamin D</a></Link></h1>
      </div>
    </header>
    <div className='container'>
      {children}
    </div>
    <footer>
        <p><small>Weather forecasts provided by <a href="https://darksky.net/" target="_blank">DarkSky</a>. Driving distances provided by <a href="https://www.google.com/maps" target="_blank">Google Maps</a>.</small></p>
    </footer>

    <style jsx>{`
      .container {
        margin: 0 auto;
        width: 800px;
      }

      header {
        margin-bottom: 30px;
        margin-top: 0;
        padding-top: 30px;
        background-color: ${Colors.primary};
        width: 100%;
      }

      .logo {
        font-size: 60px;
        padding-bottom: 10px;
      }

      a.unstyled {
        text-decoration: none;
        color: inherit;
      }

      footer {
        background-color: ${Colors.primary};
        margin: 0;
        padding: 0;
        text-align: center;
      }
      footer p {
        padding-top:10px;
        padding-bottom: 20px;
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
        font-size: large;
        background-color: ${Colors.secondary};
        color: white;
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
        filter: brightness(50%);
      }
    `}</style>
  </>
)
