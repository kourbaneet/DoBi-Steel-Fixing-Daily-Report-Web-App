import config from '@/config'

export function getPasswordResetTemplate(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
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
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: ${config.colors.main}; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500; 
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
            <h2>Reset your password</h2>
            <p>You requested to reset your password. Click the button below to set a new password.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p><strong>This reset link will expire in 1 hour.</strong></p>
          </div>
          
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}