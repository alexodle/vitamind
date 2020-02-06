import { FunctionComponent } from "react";

export interface AlertProps {
  status: 'success' | 'info' | 'error'
}

export const Alert: FunctionComponent<AlertProps> = ({ status, children }) => (
  <p className={`alert ${status}`}>
    {children}
    <style jsx>{`
      .alert {
        margin: 20px 10px 20px 10px;
        border: 1px solid transparent;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
      }
      .alert.success {
        background-color: #d4edda;
        border-color: #c3e6cb;
        color: #155724;
      }
      .alert.info {
        background-color: #e2e3e5;
        border-color: #d6d8db;
        color: #383d41;
      }
      .alert.error {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
      }
    `}</style>
  </p>
)
