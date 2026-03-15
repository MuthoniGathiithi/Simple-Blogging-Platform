FROM python:3.11-slim

WORKDIR /app

# System dependencies for opencv
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download buffalo_l during build so startup is fast
RUN python -c "from insightface.app import FaceAnalysis; app=FaceAnalysis(name='buffalo_l',providers=['CPUExecutionProvider']); app.prepare(ctx_id=0,det_size=(320,320)); print('Model ready.')"

COPY main.py .

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]