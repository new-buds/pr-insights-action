import { readFileSync } from 'node:fs';
import { type Config, SizeName } from '../interfaces/common';

export function stringToBool(str: string): boolean {
  const normalizedStr = str.trim().toLowerCase();
  return ['true', 'yes', '1'].includes(normalizedStr);
}

export function parseConfig(config: Config, configFile: string): void {
  const configJson = JSON.parse(readFileSync(configFile, 'utf8'));
  let { metrics, production, test, ignore } = configJson;
  if (!metrics) {
    throw new Error('Metrics config not found');
  }

  if (Number.isInteger(metrics)) {
    metrics = [metrics];
  } else if (
    !Array.isArray(metrics) ||
    metrics.length === 0 ||
    metrics.length > SizeName.length - 1
  ) {
    throw new Error(`Metrics config is invalid: ${metrics}`);
  } else {
    for (const metric of metrics) {
      if (!Number.isInteger(metric) || metric <= 0) {
        throw new Error(`Metrics config is invalid: ${metrics}`);
      }
    }
  }

  let labelCount = 0;
  let startNumber = 0;
  config.metrics = new Map();
  for (const metric of metrics) {
    config.metrics.set(SizeName[labelCount], [startNumber, metric]);
    startNumber = metric;
    labelCount++;
  }
  config.metrics.set(SizeName[labelCount], [
    startNumber,
    Number.MAX_SAFE_INTEGER,
  ]);

  if (production) {
    if (typeof production === 'string') {
      production = [production];
    } else if (!Array.isArray(production)) {
      throw new Error(`Production config is invalid: ${production}`);
    }

    config.production = production;
  }

  if (test) {
    if (typeof test === 'string') {
      test = [test];
    } else if (!Array.isArray(test)) {
      throw new Error(`Test config is invalid: ${test}`);
    }

    config.test = test;
  }

  if (ignore) {
    if (typeof ignore === 'string') {
      ignore = [ignore];
    } else if (!Array.isArray(ignore)) {
      throw new Error(`Ignore config is invalid: ${ignore}`);
    }

    config.ignore = ignore;
  }
}
