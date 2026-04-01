# --- Backend ---
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt greenlet
COPY backend/ .

# --- Frontend (nginx) ---
FROM nginx:alpine AS frontend
COPY frontend/ /usr/share/nginx/html/
