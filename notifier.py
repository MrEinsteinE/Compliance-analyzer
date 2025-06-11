# notifier.py
import boto3
import os
from datetime import date

# Initialize the SES client
ses_client = boto3.client('ses', region_name=os.environ['AWS_REGION'])

# IMPORTANT: Use the email address you verified in SES
SENDER_EMAIL = 'einsteine.be26@uceou.edu' 
RECIPIENT_EMAIL = 'einsteine.be26@uceou.edu' # Sending to yourself for the demo

def send_reminder(event, context):
    today = date.today()
    
    # Simple logic for the demo: If it's the beginning of December, send a reminder.
    if today.month == 12:
        subject = 'Compliance Reminder: FCRA Annual Report Deadline'
        body_text = """
        Hello NGO Compliance Team,

        This is a reminder that your FCRA annual report (Form FC-4) for the financial year is due by December 31st.

        Please ensure you have all necessary documentation ready for timely submission.

        Thank you,
        Your Compliance Tool
        """
        
        try:
            response = ses_client.send_email(
                Source=SENDER_EMAIL,
                Destination={'ToAddresses': [RECIPIENT_EMAIL]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {'Text': {'Data': body_text}}
                }
            )
            print(f"Email sent! Message ID: {response['MessageId']}")
            return {"status": "Email sent"}
        except Exception as e:
            print(f"Error sending email: {e}")
            return {"status": "Error", "error_message": str(e)}

    else:
        print("Not December. No reminder sent.")
        return {"status": "No reminder needed"}