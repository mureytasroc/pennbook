/* eslint-disable no-undef, no-invalid-this */
import util from 'util';
import { exec } from 'child_process';

describe('server', function() {
  describe('start app', function() {
    it('should not fail', async function() {
      this.timeout(6000);
      try {
        await util.promisify(exec)('node app.js', { timeout: 5000 });
      } catch (error) {
        if (!error.killed) {
          throw error;
        }
      }
    });
  });
});
