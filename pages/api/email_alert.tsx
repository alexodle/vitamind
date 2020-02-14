import { NextApiRequest, NextApiResponse } from "next";
import { FunctionComponent } from "react";
import ReactDOMServer from 'react-dom/server';
import { getRecommendationsForCity, getUserAlertByID } from "../../src/access";
import { DEFAULT_FORECAST_LIMIT } from "../../src/constants";
import { createRequestHandler } from "../../src/requestHandler";
import { ProcessedForecast, UserAlert } from "../../src/types";

interface EmailAlertProps {
  alert: UserAlert
  recommendations: ProcessedForecast[]
}

const EmailAlert: FunctionComponent<EmailAlertProps> = ({ alert, recommendations }) => (
  <html>
    <head></head>
    <body>
      <code>
        {JSON.stringify({
          alert,
          recommendations,
        })}
      </code>
    </body>
  </html>
)

async function get(req: NextApiRequest, res: NextApiResponse) {
  const alertID = parseInt(req.query.alertID as string, 10)
  if (isNaN(alertID)) {
    throw new Error('invalid alertID')
  }
  const alert = await getUserAlertByID(alertID)
  const recommendations = (await getRecommendationsForCity(alert.city.id, alert.weath_type, DEFAULT_FORECAST_LIMIT))
    .filter(r => r.driveTimeMinutes <= alert.max_drive_minutes)


  const html = ReactDOMServer.renderToString(<EmailAlert alert={alert} recommendations={recommendations} />)
  res.status(200).send(html)
}

export default createRequestHandler({ get })
