export const SizeName: string[] = ['XS', 'Small', 'Medium', 'Large'];

export interface Config {
  statisticType: string;
  isSyncLabels: boolean;
  includeDot: boolean;
  production?: string[];
  test?: string[];
  ignore?: string[];
  metrics?: Map<string, [number, number]>;
}

export interface FileChange {
  filename: string;
  label: string;
  type: 'ignore' | 'production' | 'test' | 'other';
  isDot: boolean;
  additions: number;
  deletions: number;
  changes: number;
}

export interface SizeMetrics {
  total?: {
    label: string;
    additions: number;
    deletions: number;
    changes: number;
  };
  production?: {
    label: string;
    additions: number;
    deletions: number;
    changes: number;
  };
  test?: {
    label: string;
    additions: number;
    deletions: number;
    changes: number;
  };
  changes?: FileChange[];
}
