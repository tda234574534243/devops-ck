#!/bin/sh
set -eu

until curl -fsS http://elasticsearch:9200/_cluster/health >/dev/null; do
  sleep 5
done

curl -fsS -X PUT http://elasticsearch:9200/_index_template/app-logs-single-node \
  -H 'Content-Type: application/json' \
  -d '{
    "index_patterns": ["app-logs-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0
      }
    }
  }'

curl -fsS -X PUT http://elasticsearch:9200/app-logs-*/_settings \
  -H 'Content-Type: application/json' \
  -d '{
    "index": {
      "number_of_replicas": 0
    }
  }'
