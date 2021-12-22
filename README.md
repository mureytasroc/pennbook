# PennBook

## Overview

This is the NETS-212 final project (PennBook) for group G20, comprised of
Charley Cunningham (ccunning), Rohan Gupta (grohan), Max Tsiang (mtsiang), and Patrick Liu (liupat).

This application is a Facebook clone, built with scalability and security in mind.

## Google Drive

Project planning resources can be found in the [Google Drive folder](https://drive.google.com/drive/folders/1Ksb2dOLsyWlh0JNXp3SytOUi-KOCgm9Q?usp=sharing) for this project.

## API Documentation

For a detailed description of our backend API interface, see [this google sheet](https://docs.google.com/spreadsheets/d/1R5LzdjQepMrg244BvkVXsvzGqAkr8yitZ2f57D0m610/edit?usp=sharing).

## Features Implemented and Extra Credit

Besides all the normal features, we implemented some extra features we believe may be worthy of extra credit consideration.

We implemented friend requests (requiring bidirectional confirmation before a friendship is established).

We implemented paging / infinite scrolling on all routes that serve an unbounded number of resources, in the interest of scalability.
This was especially difficult for the home page and news search routes due to the complicated composition of resources being served
(see `backend/models/Post.js/getHomepageItems` and `backend/models/News.js/articleSearch`).

We implemented very rigorous edge-case checking and input validation on the backend, set up a system of error handling middleware
(so routes can just throw errors of certain classes defined in `backend/error/error.js` rather than manually forming error repsonses
and cluttering up the code with try/catch blocks around promises), and set up JSON Web Token based authentication (also handled
with middleware for optimal code quality), which is a cryptographic form of authentication that doesn't require any storage on the backend.
We also added rate limiting to the login route so too many failed login attempts will block your IP for a day.

We implemented a CI/CD system that automatically lints, tests, Dockerizes, and deploys the PennBook application (backend, frontend, and spark job)
upon commit to master. See `.github/build-and-deploy.yaml` for our workflow specification.

We implemented a highly scalable production infrastructure using Kubernetes.
See [this diagram](https://docs.google.com/drawings/d/1C6wGLiv0xLoiG6v6JggdXkh93UfQMV-0IIO1YnMi3gM/edit?usp=sharing)
for context. We can easily scale up the number of replicas/workers in any of our deployments (backend, frontend, Spark, Redis, even the ingress
controller and observability/monitoring deployments), depending on production needs (which can be assessed using the monitoring/observability tools discussed below).
Check out `helm/pennbook-chart/values.yaml` to see how easy it is to tweak the number of replicas. Additionally, we successfully set up
AWS EKS load balancing, and an NGINX ingress controller with TLS termination to route requests to the proper services,
so we have secure and scalable traffic ingress to our cluster from the outside world.
We set up Cloudflare to manage the DNS records of our pennbook.app domain name and point traffic to our EKS load balancer. Cloudflare also offers
additional security and caching features (like preventing DOS attacks and filtering out otherwise malicious requests), with a generous free tier.

We connected our application to Sentry, so any errors that occur in production show up (with the relevant stack trace / context)
in our Sentry dashboard, where we can detect and diagnose issues. We also set up deployments of Prometheus (a system for collecting and managing metrics, e.g.
about a Kubernetes cluster), and Grafana (a frontend interface supporting informative dashboards and data visualizations) so we can monitor the health of
our Kubernetes cluster in real time, assess scaling needs, and set up automatic alerts. [screenshot](https://drive.google.com/file/d/1-1KkE1qNzlrQIg0D7GkvVBkXJ5wKQ4h0/view?usp=sharing).

We set up Google's SparkOperator to manage Spark jobs with kubernetes (making creation of workers a more lightweight process due to containerization as
opposed to VM creation). This was more difficult than expected due to the novelty of this project, but we were ultimately able to get it working
and it fit very seamlessly into the rest of our production architecture. Hopefully support for spark on kubernetes continues to improve.

We implemented an Ad recommendation algorithm. We obtained ad data from this source: https://archive.ics.uci.edu/ml/machine-learning-databases/internet_ads/. This algorithm revolved around a 3 layer Neural Network built and trained in PyTorch, which takes in a vector of user interests and outputs a probability distribution over the 40 categories of ads in our dataset (about 8000 images). We then sample a category from this probability distribution, and select an ad (at random) from the chosen category. Most notably, however, this algorithm offers strong differential privacy guarantees (epsilon ~= 2.5) since we train it using Differentially Private SGD (implemented through the Opacus library). This is useful since we don’t want to be able to trace ad recommendations back to users. This model is served for inference via Fast API (a lightweight Python library).

We set up an orchestration system to schedule Spark jobs when the total diff of user interests grows beyond a certain size. By default we made that size 1 to match the project description, but this could be increased to get around the problem of “interest thrashing”, where a user could schedule many expensive spark jobs just by changing their interests frequently. We also ensure that only one spark job is running at a time, and any requests for a new job (either due to the 1 hour schedule or due to an interest diff reaching the threshold) that arrive when a job is currently running, will cause the current job to automatically trigger another run when it finishes. This enables a more modular, scalable architecture and prevents adversarial behaviour by users.

## File Structure Overview

This repository is organized into the following sections:

- backend: the Dockerized nodejs codebase for serving API requests
- frontend: the Vue.js frontend code, served as static files by Quasar (also Dockerized)
- helm: the helm charts, templates, and configuration options for our production/Kubernetes setup
- spark: the Dockerized driver code for our adsorption pyspark job
- .husky: our simple husky setup for running pre-commit hooks enforcing shared style guidelines (cleaning up diffs)
- .github: our GitHub Actions configuration, specifying the CI/CD workflow of our project
- adsense: contains the code for training the machine learning model and serving it via Fast API (serve.py) -- all Dockerized 

## Instructions to Run this Application

To run the backend in dev, follow the following steps:

- add a `.env` file to the backend containing `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` variables specifying an AWS account with access to DynamoDB.
- [install Redis](https://redis.io/topics/quickstart) and run `redis-server` in the background
- cd into the backend directory
- run `npm install`
- run `node app.js`

After you have done this, you can load news with the command `npm load-data`, and simulate the recommendation script (without actually running Spark)
with the command `npm recommend-articles`. In production this command actually triggers the Spark job.

To run the frontend in dev, follow the following steps:

- cd into the frontend directory
- run `npm install -g @quasar/cli`
- run `npm install`
- run `quasar dev`

To set up a production environment, you can use our helm chart (`helm/pennbook-chart`) and configuration options for the grafana, prometheus, and spark operator charts in `helm`.
Take a look at `.github/build-and-deploy.yaml` for detailed steps of how our deployment process works. Note that secrets are taken from GitHub Actions secrets,
in the interest of security. We did not have enough time in this project to explore using tools like Terraform for a reproducible/declarative specification
of cloud computing resources, so you will have to set up EKS manually, although this is fairly easy with the eksctl command line tool.

## Declarations

All the code we are submitting as part of this project was written by us.

While we used GitHub actions for CI/CD in this project (in a private repository), we set the upstream to be our NETS-212 G20 git repo. So we have synced
our entire version control history with that repo.
