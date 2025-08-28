import config from '@/config'

export function getVerificationTemplate(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
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
            <h2>Verify your email address</h2>
            <p>Thanks for signing up! Please click the button below to verify your email address and activate your account.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
          </div>
          
          <div class="footer">
            <p>If you didn't create an account with ${config.appName}, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}