import { loadNews } from './load-news.js';
import { redisClient } from '../models/connect.js';
import Handlebars from 'handlebars';
import fs from 'fs';
import util from 'util';
import ChildProcess from 'child_process';
import { prod } from '../config/dotenv.js';
const exec = util.promisify(ChildProcess.exec);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const SPARK_POLL_MS = 10000;

/**
 * Gets the status of the specified sparkapplication. Possible values:
 * 'COMPLETED', 'FAILED', 'SUBMISSION_FAILED', 'FAILING', 'INVALIDATING',
 * '', 'PENDING_RERUN', 'RUNNING', 'SUBMITTED', 'SUCCEEDING', 'UNKNOWN'
 * @param {string} name the name of the sparkapplication to get the status of
 * @return {string} the status of the specified spark application
 */
export async function getSparkStatus(name) {
  if (!prod) {
    return 'UNKNOWN';
  }
  try {
    const res = await exec(
        `kubectl get sparkapplication ${name} -o jsonpath="{.status.applicationState.state}"`);
    return res.stdout;
  } catch (err) {
    if (err.stderr && err.stderr.includes('NotFound')) {
      return 'UNKNOWN';
    }
    throw err;
  }
}

/**
 * Deletes the specified Spark job
 * @param {string} name the name of the sparkapplication to delete
 */
export async function deleteSparkJob(name) {
  if (!prod) {
    return;
  }
  try {
    return await exec(
        `kubectl delete sparkapplication ${name}`);
  } catch (err) {
    if (err.stderr && err.stderr.includes('NotFound')) {
      console.log(err);
      return;
    }
    throw err;
  }
}

/**
 * Loads news and then runs the livy job to recommend articles.
 */
export async function recommendArticles() {
  const sparkJobFinished = async function() {
    return [
      'COMPLETED', 'FAILED', 'SUBMISSION_FAILED', 'UNKNOWN',
    ].includes(await getSparkStatus('spark-recommend-articles'));
  };

  const isRunning = (
    JSON.parse(await redisClient.get('RECOMMENDER_RUNNING') || JSON.stringify(false)));

  if (isRunning || !(await sparkJobFinished())) {
    await redisClient.set('RECOMMENDER_RUN_WHEN_DONE', JSON.stringify(true));
    return;
  }
  await redisClient.set('RECOMMENDER_RUNNING', JSON.stringify(true));

  try {
    // Load new articles since yesterday
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 1);
    await loadNews(minDate);

    // Start Spark job
    await deleteSparkJob('spark-recommend-articles');
    const source = (
      await readFileAsync('./jobs/spark-recommend-articles-template.yaml')).toString();
    const template = Handlebars.compile(source);
    const contents = template(
        { GIT_SHA: process.env.GIT_SHA, RELEASE_NAME: process.env.RELEASE_NAME });
    await writeFileAsync('./jobs/spark-recommend-articles.yaml', contents);

    if (prod) {
      await exec('kubectl apply -f ./jobs/spark-recommend-articles.yaml');
    } else {
      console.log('Recommended.');
    }

    do {
      await new Promise((resolve) => setTimeout(resolve, SPARK_POLL_MS));
    } while (!(await sparkJobFinished()));
  } catch (err) {
    await redisClient.set('RECOMMENDER_RUNNING', JSON.stringify(false));
    throw err;
  }

  // TODO: add a new article to recommended list for each user?

  await redisClient.set('RECOMMENDER_RUNNING', JSON.stringify(false));
  if (JSON.parse(await redisClient.get('RECOMMENDER_RUN_WHEN_DONE'))) {
    await redisClient.set('RECOMMENDER_RUN_WHEN_DONE', JSON.stringify(false));
    return await recommendArticles();
  }
}
