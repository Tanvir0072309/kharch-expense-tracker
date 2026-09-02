FROM postgres:18

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-pip \
       python3-venv \
    && python3 -m venv /opt/patroni \
    && /opt/patroni/bin/pip install --no-cache-dir patroni[etcd3] psycopg[binary] \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/patroni/bin:$PATH"

USER postgres

ENTRYPOINT ["patroni"]
