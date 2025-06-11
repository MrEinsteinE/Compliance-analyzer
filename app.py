# app.py - FINAL version, built for the unified knowledge base schema

import json
import base64
import io
import zipfile
import boto3
import docx
import fitz
import requests
import hashlib
import os

# --- Configuration & Initialization ---
BEDROCK_RUNTIME = boto3.client(service_name='bedrock-runtime', region_name='us-west-2')
MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'
SENDER_EMAIL = "your-verified-email@gmail.com" # Replace this
SES_CLIENT = boto3.client('ses', region_name='us-west-2')
S3_CLIENT = boto3.client('s3')

# Load the knowledge base at Lambda startup for efficiency
with open('knowledgeBase.json', 'r', encoding='utf-8') as f:
    KNOWLEDGE_BASE = json.load(f)

# --- Primary Handler: AI Analysis ---
def analyze(event, context):
    try:
        # Body from API Gateway is a JSON string, so we load it.
        body = json.loads(event.get("body", "{}"))
        
        # Safely get data from the payload using .get() to avoid KeyErrors
        file_base64 = body.get("document_base64")
        filename = body.get("filename")
        selected_country_code = body.get("country_code", "IN") # Default to India

        if not file_base64 or not filename:
            return create_error_response(400, "Missing filename or document content.")

        # Filter the knowledge base safely
        relevant_clauses = [item for item in KNOWLEDGE_BASE if item.get('country') == selected_country_code]
        if not relevant_clauses:
            return create_error_response(400, f"No regulations found for country code: {selected_country_code}")
        
        regulation_text_as_json = json.dumps(relevant_clauses, indent=2)
        
        # Process uploaded documents
        document_text_to_analyze = extract_text_from_upload(filename, file_base64)
        
        # Create the AI prompt
        prompt = construct_analysis_prompt(regulation_text_as_json, document_text_to_analyze)
        
        # Invoke Bedrock Model
        request_body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        })
        response = BEDROCK_RUNTIME.invoke_model(body=request_body, modelId=MODEL_ID, contentType='application/json')
        response_body = json.loads(response.get('body').read())
        ai_generated_json_string = response_body['content'][0]['text']

        # Return the AI's direct JSON response
        return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": ai_generated_json_string}

    except Exception as e:
        print(f"[ERROR] in analyze function: {type(e).__name__} - {e}")
        return create_error_response(500, "An internal server error occurred.", str(e))

# --- Email Handler ---
def send_alert(event, context):
    try:
        recipient_email = event.get("recipient_email", SENDER_EMAIL)
        subject = event.get("subject", "Default Compliance Alert")
        body_text = event.get("body_text", "This is a default message.")
        SES_CLIENT.send_email(Destination={'ToAddresses': [recipient_email]},
                              Message={'Body': {'Text': {'Data': body_text}}, 'Subject': {'Data': subject}},
                              Source=SENDER_EMAIL)
        return {"statusCode": 200, "body": json.dumps({"message": "Email sent!"})}
    except Exception as e:
        print(f"[ERROR] in send_alert: {e}")
        return create_error_response(500, "Failed to send email.", str(e))

# --- Web Crawler Handler ---
def check_for_changes(event, context):
    try:
        s3_bucket = os.environ.get('S3_BUCKET_NAME')
        target_url = 'https://fcraonline.nic.in/home/index.aspx'
        s3_key = 'last_content_hash.txt'
        current_hash = hashlib.sha256(requests.get(target_url, timeout=10).text.encode()).hexdigest()
        try:
            last_hash = S3_CLIENT.get_object(Bucket=s3_bucket, Key=s3_key)['Body'].read().decode()
        except S3_CLIENT.exceptions.NoSuchKey:
            last_hash = None
        if current_hash != last_hash:
            S3_CLIENT.put_object(Bucket=s3_bucket, Key=s3_key, Body=current_hash)
            return {"status": "Change Detected"}
        return {"status": "No Change"}
    except Exception as e:
        print(f"[ERROR] in check_for_changes: {e}")
        return create_error_response(500, "Failed to check for changes.", str(e))

# --- Helper Functions ---
def create_error_response(statusCode, error, details=None):
    body = {"error": error}
    if details:
        body["details"] = details
    return {"statusCode": statusCode, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body)}

def extract_text_from_upload(filename, file_base64):
    file_bytes = base64.b64decode(file_base64)
    if filename.lower().endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(file_bytes), 'r') as archive:
            return "\n".join(extract_text_from_bytes(name, archive.read(name)) for name in archive.namelist() if not name.startswith('__MACOSX/'))
    else:
        return extract_text_from_bytes(filename, file_bytes)

def extract_text_from_bytes(item_name, item_bytes):
    ext = item_name.split('.')[-1].lower()
    if ext == 'docx':
        return "\n".join([p.text for p in docx.Document(io.BytesIO(item_bytes)).paragraphs])
    if ext == 'pdf':
        with fitz.open(stream=item_bytes, filetype="pdf") as doc:
            return "".join([page.get_text() for page in doc])
    if ext == 'txt':
        return item_bytes.decode('utf-8', errors='ignore')
    return ""

def construct_analysis_prompt(regulation_json, policy_text):
    return f"""You are an expert AI compliance assistant for non-profits. Your task is to analyze an NGO's internal policy documents against a specific set of legal clauses from our knowledge base.

**Your Task:**
Carefully review the user's "Policy Document Text". For EACH clause in the provided "Regulatory Knowledge Base (JSON)", determine if the user's policy addresses it. You MUST provide your analysis ONLY in a valid JSON format. Do not add any text before or after the JSON object.

The JSON output must be an object with two keys: "executive_summary" and "compliance_breakdown".

The "compliance_breakdown" must be an array, where each object corresponds to ONE of the clauses from the knowledge base and has the following structure:
{{
  "clause_id": string,
  "clause_text": string,
  "status": string,  // Must be one of: "Compliant", "Partial", "Non-compliant", or "Not Addressed"
  "evidence_in_policy": string, // Quote the specific sentence(s) from the user's policy that addresses this clause. If not addressed, this should be an empty string.
  "recommendation": string,
  "required_evidence": [],
  "potential_penalties": []
}}

**Regulatory Knowledge Base (JSON):**
---
{regulation_json}
---

**Policy Document Text:**
---
{policy_text}
---
"""