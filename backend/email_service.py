import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_password_reset_email(to_email: str, reset_link: str):
    message = Mail(
        from_email=os.environ.get('SENDGRID_FROM_EMAIL', 'no-reply@zeitgeist.engine'),
        to_emails=to_email,
        subject='Reset Your Password for The Zeitgeist Engine',
        html_content=f'Please click the following link to reset your password: <a href="{reset_link}">{reset_link}</a>'
    )
    try:
        print(f"sendgrid api key: {os.environ.get('SENDGRID_API_KEY')}")
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        print(f"Sending email to {to_email} with reset link: {reset_link}")
        response = sg.send(message)
        print(f'SendGrid response status code: {response.status_code}')
        return response
    except Exception as e:
        print(f"Error sending email: {e}")
        print(e)
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
        print(f'SendGrid response status code: {response.status_code}')
        return response
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
