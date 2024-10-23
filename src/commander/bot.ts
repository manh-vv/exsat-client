import { configureLogger, logger } from '../utils/logger';
import { select } from '@inquirer/prompts';
import fs from 'node:fs';
import { SynchronizerCommander } from './synchronizer';
import { ValidatorCommander } from './validator';
import { Version } from '../utils/version';
import { updateMenu, notAccountMenu } from './common';
import { Client } from '../utils/enumeration';
import { getErrorMessage, isValidUrl, reloadEnv, retry, showInfo, sleep } from '../utils/common';

async function tryActivate(asyncAct) {
  try {
    await asyncAct();
    return true;
  } catch (err) {
    // @ts-ignore
    console.error(err.message);
  }
}

/**
 * Main entry point for the application.
 * Checks for updates, displays user guide information, and prompts user to select a client to start.
 */
async function main() {
  // Initialize the selected client and configure logger
  const clientCommander = new ValidatorCommander();

  // Check if keystore exists
  while (!fs.existsSync(process.env.VALIDATOR_KEYSTORE_FILE)) {
    await notAccountMenu(Client.Validator);
    reloadEnv();
  }
  await clientCommander.init();

  const activateFn = () => tryActivate(() => clientCommander.activeValidator());

  let res = await activateFn();
  while (!res) {
    res = await activateFn();
    await sleep(+process.env.BOT_ACTIVATE_DELAY || 150);
  }
}

// Execute the main function and handle any errors
(async () => {
  try {
    await main();
  } catch (e) {
    logger.error(e);
  }
})();
