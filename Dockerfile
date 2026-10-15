FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd -u 10061 -r -s /usr/sbin/nologin pwyw
COPY app.py campaigns.py brandpack.py admin_api.py admin_bootstrap.py ./
COPY static ./static
USER 10061
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8080/api/health',timeout=3)" || exit 1
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","8080","--proxy-headers","--forwarded-allow-ips","*"]
