# Monitoring Guide

This project includes two monitoring layers:

## Level 1: Health Monitoring

Backend source exposes:

```bash
GET /health
```

The `/health` endpoint verifies that the API process is running and that it can connect to SQL Server.

The Docker Compose backend health check uses a TCP check against port `8080` so it remains compatible with the currently published backend image. After rebuilding and publishing the backend image with the latest source, `/health` can also be checked directly.

Docker Compose health checks are configured for:

- `db`
- `backend`
- `frontend`
- `nginx`
- `elasticsearch`
- `kibana`
- `logstash`
- `filebeat`

Check service health:

```bash
docker compose ps
```

Expected status after startup:

```text
backend        healthy
frontend       healthy
nginx_proxy    healthy
elasticsearch  healthy
kibana         healthy
logstash       healthy
filebeat       healthy
```

## Level 2: Log-Based Monitoring

Request logs from the backend middleware are parsed by Logstash into fields that can be used in Kibana.

Create a Kibana data view:

```text
app-logs-*
```

Useful fields:

- `http.request.method`
- `url.path`
- `http.response.status_code`
- `event.duration_ms`
- `trace.id`
- `user.id`
- `source.ip`

Useful Kibana filters:

```text
tags: "http_request_log"
```

```text
http.response.status_code >= 500
```

```text
event.duration_ms > 1000
```

Suggested dashboard panels:

- Request count over time
- Error count over time
- Slow requests where `event.duration_ms > 1000`
- Top slow endpoints grouped by `url.path`
- Status code distribution grouped by `http.response.status_code`

## Level 3: Elastic Stack Monitoring

Elastic Stack monitoring is enabled for:

- Elasticsearch internal collection
- Kibana container UI mode
- Logstash monitoring output
- Filebeat monitoring output

Open Kibana:

```text
http://localhost:5601
```

Then go to:

```text
Stack Monitoring
```

Useful checks:

```bash
docker compose ps
```

```bash
curl http://localhost:9200/_cat/indices/.monitoring-*?v
curl http://localhost:9200/_cat/indices/app-logs-*?v
curl "http://localhost:9200/app-logs-*/_search?pretty&size=3"
curl "http://localhost:9200/app-logs-*/_mapping?pretty"
```

Expected result: `.monitoring-*` indices should appear after the stack has been running for a short time.
