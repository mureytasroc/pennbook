import { prod } from '../config/dotenv.js';
import AWS from 'aws-sdk';
import { Affiliation } from '../models/User.js';


/**
 * Loads news and then runs the livy job to recommend articles.
 */
export async function loadAffiliations() {
  console.log('Loading affiliations...');
  const s3 = new AWS.S3();
  const res = await s3.getObject(
      { Bucket: prod ? 'pennbook' : 'pennbook-dev', Key: 'affiliations.json' },
  ).promise();
  const body = JSON.parse(res.Body.toString('utf-8'));
  await Affiliation.create(body.map((a) => ({ affiliation: a.name })));
  console.log('Done loading affiliations.');
}
