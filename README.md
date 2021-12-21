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

We implemented a highly scalable production infrastructure using Kubernetes, which can easily

## File Structure Overview

This repository is organized into the following sections:

- backend: the Dockerized nodejs codebase for serving API requests
- frontend: the Vue.js frontend code, served as static files by Quasar (also Dockerized)
- helm: the helm charts, templates, and configuration options for our production/Kubernetes setup
- spark: the Dockerized driver code for our adsorption pyspark job
- .husky: our simple husky setup for running pre-commit hooks enforcing shared style guidelines (cleaning up diffs)
- .github: our GitHub Actions configuration, specifying the CI/CD workflow of our project
- adsense: TODO (grohan)

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
- run `npm install`
- run `quasar dev`

To set up a production environment, you can use our helm chart (`helm/pennbook-chart`) and configuration options for the grafana, prometheus, and spark operator charts,
and take a look at `.github/build-and-deploy.yaml` for detailed steps of how our deployment process works. Note that secrets are taken from GitHub Actions secrets,
in the interest of security. We did not have enough time in this project to explore using tools like Terraform for a reproducible description
of allocated cloud computing resources, so you will have to setup EKS manually, although this is fairly easy with the eksctl command line tool.

## Declarations

All the code we are submitting as part of this project was written by us.

While we used GitHub actions for CI/CD in this project (in a private repository), we set the upstream to be our NETS-212 G20 git repo. So we have synced
our entire version control history with that repo.
