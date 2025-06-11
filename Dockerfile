FROM public.ecr.aws/lambda/python:3.9

WORKDIR /var/task

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY knowledgeBase.json .

# This sets the default handler to the 'analyze' function inside 'app.py'
CMD [ "app.analyze" ]