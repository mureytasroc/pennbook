import dotenvDefaults from 'dotenv-defaults';
import dotenvExpand from 'dotenv-expand';

dotenvExpand(dotenvDefaults.config());

export const prod = process.env.NODE_ENV === 'production';
