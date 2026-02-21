import type { CrashAnalyticsReporter, CrashAnalyticsReporterRegistry } from './types.ts';

export class CrashAnalyticsDefaultReporterRegistry implements CrashAnalyticsReporterRegistry {
  private reporters = new Map<string, CrashAnalyticsReporter>();

  registerReporter(key: string, impl: CrashAnalyticsReporter): void {
    this.reporters.set(key, impl);
  }

  getReporters(): CrashAnalyticsReporter[] {
    return Array.from(this.reporters.values());
  }

  getReporterByName(name: string): CrashAnalyticsReporter | undefined {
    return this.reporters.get(name);
  }
}
