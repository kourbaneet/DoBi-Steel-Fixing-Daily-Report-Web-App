import config from '@/config'

export function getPasswordChangedTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password changed</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: ${config.colors.main}; 
          }
          .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
          }
          h2 {
            color: #333;
            margin-top: 0;
          }
          p {
            margin: 16px 0;
          }
          .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
          }
          @media only screen and (max-width: 600px) {
            .container {
              padding: 20px 10px;
            }
            .content {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${config.appName}</div>
          </div>
          
          <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hi ${name},</p>
            <p>Your password has been changed successfully on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.</p>
            
            <div class="alert">
              <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
            </div>
            
            <p>For your security, we recommend:</p>
            <ul>
              <li>Using a unique, strong password</li>
              <li>Enabling two-factor authentication if available</li>
              <li>Not sharing your login credentials with anyone</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification from ${config.appName}.</p>
            <p>If you have concerns about your account security, please contact support immediately.</p>
          </div>
        </div>
      </body>
    </html>
  `
}