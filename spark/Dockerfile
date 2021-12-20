ARG SPARK_IMAGE=gcr.io/spark-operator/spark-py:v3.1.1
ARG SITE_PACKAGES=/opt/spark/work-dir
ARG APPS_DIR=/opt/spark/sparkapps/


FROM python:3.7-slim AS compile-image
ARG SITE_PACKAGES
ARG INDEX_URL
ENV PIP_INDEX_URL=${INDEX_URL}
RUN mkdir -p ${SITE_PACKAGES}
RUN pip3 install --upgrade pip
RUN pip3 install --prefix=${SITE_PACKAGES} boto3


FROM ${SPARK_IMAGE}
ARG SITE_PACKAGES
ARG APPS_DIR

USER root
COPY --from=compile-image ${SITE_PACKAGES}/lib/python3.7/site-packages /usr/lib/python3/dist-packages

COPY ./*.py ${APPS_DIR}

# Setup for the Prometheus JMX exporter.
# Add the Prometheus JMX exporter Java agent jar for exposing metrics sent to the JmxSink to Prometheus.
ADD https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.11.0/jmx_prometheus_javaagent-0.11.0.jar /prometheus/
RUN chmod 644 /prometheus/jmx_prometheus_javaagent-0.11.0.jar

USER ${spark_uid}

RUN mkdir -p /etc/metrics/conf
COPY conf/metrics.properties /etc/metrics/conf
COPY conf/prometheus.yaml /etc/metrics/conf

ENTRYPOINT ["/opt/entrypoint.sh"]
