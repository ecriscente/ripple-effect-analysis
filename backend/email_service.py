import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_password_reset_email(to_email: str, reset_link: str):
    message = Mail(
        from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'no-reply@zeitgeist.engine'),
        to_emails=to_email,
        subject='Reset Your Password for Ripple Effect Analysis',
        html_content=f'Please click the following link to reset your password: <a href="{reset_link}">{reset_link}</a>'
    )
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response
    except Exception as e:
        print(f"Error sending email: {type(e).__name__}")
        return None

def send_advanced_analysis_request_email(user_email: str, technology: str):
    message = Mail(
        from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'no-reply@zeitgeist.engine'),
        to_emails=os.environ.get('SENDGRID_FROM_EMAIL'),
        subject=f'Advanced Analysis Request for {technology} from {user_email}',
        html_content=f'User {user_email} has requested an advanced analysis for the technology: {technology}.'
    )
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response
    except Exception as e:
        print(f"Error sending email: {type(e).__name__}")
        return None

def send_email_verification(to_email: str, verification_link: str):
    message = Mail(
        from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'no-reply@zeitgeist.engine'),
        to_emails=to_email,
        subject='Verify Your Email for Ripple Effect Analysis',
        html_content=f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Welcome to Ripple Effect Analysis!</h2>
                <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{verification_link}">{verification_link}</a>
                </p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    This verification link will expire in 24 hours. If you didn't create an account, 
                    you can safely ignore this email.
                </p>
            </div>
        </body>
        </html>
        '''
    )
    try:
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        return response
    except Exception as e:
        print(f"Error sending verification email: {type(e).__name__}")
        return None
