# Stage 1: Build the React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend-react
COPY frontend-react/package*.json ./
RUN npm install
COPY frontend-react/ ./
RUN npm run build

# Stage 2: Setup Python Backend
FROM python:3.11-slim
WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt /app/backend/
WORKDIR /app/backend

# Install minimal requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ /app/backend/

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /app/frontend-react/dist /app/frontend-react/dist

# Create a non-root user (HF Spaces requirement for some setups)
RUN useradd -m -u 1000 user
USER user

# Set writable home for the user (needed for SQLite DB)
ENV HOME=/home/user
WORKDIR /app/backend

# Copy files with correct ownership
COPY --chown=user:user backend/ /app/backend/

# Expose the port (Hugging Face Spaces uses 7860 by default)
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
