import { getInput, setFailed } from '@actions/core';
import {
  setActionOutput,
  validateActionInput,
  validateActionType,
} from './github/action';
import type { Config } from './interfaces/common';
import CodeChangeChecker from './metrics/code-change-checker';
import { parseConfig, stringToBool } from './utils/utils';

export async function run(): Promise<void> {
  try {
    if (!validateActionType()) {
      return;
    }

    const githubToken: string = getInput('github_token');
    const configFile: string = getInput('config_file');
    const statisticType: string = getInput('statistic_type');
    const isSyncLabels: boolean = stringToBool(getInput('sync_labels'));
    const includeDot: boolean = stringToBool(getInput('dot'));

    if (!validateActionInput(githubToken, configFile, statisticType)) {
      return;
    }

    const config: Config = { statisticType, isSyncLabels, includeDot };
    parseConfig(config, configFile);

    const codeChangeChecker = new CodeChangeChecker(githubToken, config);
    const sizeMetrics = await codeChangeChecker.checkCodeChanges();

    setActionOutput(sizeMetrics);
  } catch (error) {
    if (error instanceof Error) setFailed(error.message);
  }
}
