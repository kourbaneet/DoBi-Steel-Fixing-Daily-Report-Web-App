import config from '@/config'

export function getWelcomeTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${config.appName}</title>
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
            <h2>Welcome to ${config.appName}, ${name}!</h2>
            <p>Your email has been verified and your account is now active. You can start using all the features of our platform.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${config.domainName}/dashboard" class="button">Get Started</a>
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          
          <div class="footer">
            <p>Thanks for joining ${config.appName}!</p>
          </div>
        </div>
      </body>
    </html>
  `
}