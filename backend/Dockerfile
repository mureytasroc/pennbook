FROM node:17

ADD https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip ./awscliv2.zip
RUN unzip ./awscliv2.zip
RUN ./aws/install
RUN rm -rf ./awscliv2.zip ./aws

ADD https://dl.k8s.io/release/v1.23.0/bin/linux/amd64/kubectl ./kubectl
RUN install -o root -g root -m 0755 ./kubectl /usr/local/bin/kubectl
RUN rm -rf ./kubectl

WORKDIR /app/

COPY package*.json ./

ENV NODE_ENV production

RUN npm ci --only=production

COPY . .
