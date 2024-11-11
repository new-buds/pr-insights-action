import { existsSync } from 'node:fs';
import { setFailed, setOutput } from '@actions/core';
import { context } from '@actions/github';
import type { SizeMetrics } from '../interfaces/common';

export function validateActionType(): boolean {
  const { payload } = context;
  if (!payload.pull_request) {
    setFailed('This action should be run on pull requests only.');
    return false;
  }

  return true;
}

export function validateActionInput(
  token: string,
  configFile: string,
  statisticType: string,
): boolean {
  if (!token) {
    setFailed('GitHub token is required.');
    return false;
  }

  if (!configFile) {
    setFailed('Config file is required.');
    return false;
  }

  if (!existsSync(configFile)) {
    setFailed(`Config file not found. ${configFile}`);
    return false;
  }

  if (!statisticType) {
    setFailed('Statistic type is required.');
    return false;
  }

  if (!['all', 'production', 'test'].includes(statisticType)) {
    setFailed('Invalid statistic type.');
    return false;
  }

  return true;
}

export function setActionOutput(sizeMetric: SizeMetrics | undefined) {
  if (sizeMetric) {
    setOutput('total-size', sizeMetric.total?.label ?? '');
    setOutput('production-size', sizeMetric.production?.label ?? '');
    setOutput('test-size', sizeMetric.test?.label ?? '');
  }
}
