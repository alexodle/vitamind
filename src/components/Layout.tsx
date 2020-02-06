import Head from 'next/head';
import Link from "next/link";
import { FunctionComponent } from "react";

export const Layout: FunctionComponent<{}> = ({ children }) => (
  <div className='container'>
    <Head key='layout-head'>
      <title>VitaminD - get some</title>
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
    <h1><Link href="/"><a className='unstyled'>VitaminD <em>get some</em></a></Link></h1>
    {children}

    <style jsx>{`
      .container {
        margin: auto;
        width: 60em;
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
  </div>
)
