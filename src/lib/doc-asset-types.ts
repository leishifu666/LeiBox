export interface CodeAsset {
  id: string;
  label: string;
  fileName: string;
  url: string;
}

export interface CodeContent {
  source: string;
  html?: string;
}

export interface MotionPackageRef {
  framework: string;
  label: string;
  component: string;
  slug: string;
  dependencies: string[];
  install: string;
  usage: string;
  prompt?: string;
  promptUrl?: string;
  bundleUrl: string;
  files: CodeAsset[];
}

export interface DocAssetIndex {
  canvas: Record<string, { webgl: CodeAsset[]; webgpu: CodeAsset[]; demoUrl?: string }>;
  motion: Record<string, MotionPackageRef[]>;
}
