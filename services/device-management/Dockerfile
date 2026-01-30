FROM python:3.10-slim

WORKDIR /app

# Create a non-root user
RUN useradd -m userapp

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create logs directory
RUN mkdir -p /app/logs && chown -R userapp:userapp /app

# Switch to non-root user
USER userapp

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
