import { sep } from 'node:path';
import { context, getOctokit } from '@actions/github';
import {
  type Config,
  type FileChange,
  type SizeMetrics,
  SizeName,
} from '../interfaces/common';

export default class CodeChangeChecker {
  private token: string;
  private config: Config;

  constructor(token: string, config: Config) {
    this.token = token;
    this.config = config;
  }

  public async checkCodeChanges(): Promise<SizeMetrics | undefined> {
    if (!context.payload.pull_request) {
      return;
    }

    const octokit = getOctokit(this.token);
    const { owner, repo } = context.repo;
    const pull_number = context.payload.pull_request.number;
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    const metrics: SizeMetrics = {};
    const fileChanges: FileChange[] = [];
    for (const file of files) {
      const { additions, deletions, changes } = file;
      const label = this.getSizeLabel(changes);
      const fileChange: FileChange = {
        filename: file.filename,
        label,
        type: this.getFileType(file.filename),
        isDot: this.checkDotFile(file.filename),
        additions,
        deletions,
        changes,
      };
      fileChanges.push(fileChange);
    }

    metrics.changes = fileChanges;
    for (const change of fileChanges) {
      if (change.isDot && !this.config.includeDot) {
        continue;
      }

      if (change.type === 'production') {
        if (!metrics.production) {
          metrics.production = {
            label: SizeName[0],
            additions: 0,
            deletions: 0,
            changes: 0,
          };
        }

        metrics.production.additions += change.additions;
        metrics.production.deletions += change.deletions;
        metrics.production.changes += change.changes;
        metrics.production.label = this.getSizeLabel(
          metrics.production.changes,
        );
      } else if (change.type === 'test') {
        if (!metrics.test) {
          metrics.test = {
            label: SizeName[0],
            additions: 0,
            deletions: 0,
            changes: 0,
          };
        }

        metrics.test.additions += change.additions;
        metrics.test.deletions += change.deletions;
        metrics.test.changes += change.changes;
        metrics.test.label = this.getSizeLabel(metrics.test.changes);
      }

      if (change.type !== 'ignore') {
        if (!metrics.total) {
          metrics.total = {
            label: SizeName[0],
            additions: 0,
            deletions: 0,
            changes: 0,
          };
        }

        metrics.total.additions += change.additions;
        metrics.total.deletions += change.deletions;
        metrics.total.changes += change.changes;
        metrics.total.label = this.getSizeLabel(metrics.total.changes);
      }
    }

    console.log('Metrics:', metrics);
    return metrics;
  }

  private checkDotFile(file: string): boolean {
    const segments = file.split(sep);
    const filename = segments.pop();

    // Check if any directory in the path is a dot folder
    const isInDotFolder = segments.some(
      (segment) => segment.startsWith('.') && segment.length > 1,
    );

    // Check if the file itself is a dot file
    const isDotFile = filename?.startsWith('.') && filename.length > 1;

    return isInDotFolder || Boolean(isDotFile);
  }

  private getFileType(
    file: string,
  ): 'ignore' | 'production' | 'test' | 'other' {
    for (const ignoreReg of this.config.ignore ?? []) {
      const regex = new RegExp(ignoreReg);
      if (regex.test(file)) {
        return 'ignore';
      }
    }

    for (const ignoreReg of this.config.production ?? []) {
      const regex = new RegExp(ignoreReg);
      if (regex.test(file)) {
        return 'production';
      }
    }

    for (const ignoreReg of this.config.test ?? []) {
      const regex = new RegExp(ignoreReg);
      if (regex.test(file)) {
        return 'test';
      }
    }

    return 'other';
  }

  private getSizeLabel(size: number): string {
    for (const [label, [min, max]] of this.config.metrics ?? []) {
      if (size >= min && size < max) {
        return label;
      }
    }

    return '';
  }
}
