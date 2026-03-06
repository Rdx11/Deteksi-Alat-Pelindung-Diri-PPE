FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project
COPY . .

# Create media directory
RUN mkdir -p media/detections media/annotated

# Collect static files (akan dijalankan saat container start)
# RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Default command (bisa di-override di docker-compose)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
