import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface FileLockInfo {
  pid: number;
  timestamp: number;
  hostname: string;
  processName?: string;
  startTime?: number;
}

export class FileLock {
  static async acquireLockOrThrow(filePath: string, timeoutMs?: number): Promise<FileLock> {
    const lockFilePath = await acquireLock(filePath, timeoutMs);
    return new FileLock(filePath, lockFilePath);
  }

  constructor(
    public readonly filePath: string,
    public lockFilePath?: string,
  ) {}

  hasLock(): boolean {
    return this.lockFilePath != null;
  }

  async reacquireLockOrThrow() {
    if (this.lockFilePath == null) {
      const lockFilePath = await acquireLock(this.filePath);
      this.lockFilePath = lockFilePath;
    }
  }

  async releaseLock() {
    if (this.lockFilePath) {
      try {
        await fs.promises.unlink(this.lockFilePath);
      } catch (error: any) {
        // Lock file might have been removed already
        if (error.code !== 'ENOENT') {
          console.warn('Failed to remove lock file:', error);
        }
      }
      this.lockFilePath = undefined;
    }
  }

  releaseLockSync() {
    if (this.lockFilePath) {
      try {
        fs.unlinkSync(this.lockFilePath);
      } catch (error: any) {
        // Lock file might have been removed already
        if (error.code !== 'ENOENT') {
          console.warn('Failed to remove lock file:', error);
        }
      }
      this.lockFilePath = undefined;
    }
  }
}

async function isLockStale(lockFilePath: string, staleTimeoutInMs?: number): Promise<boolean> {
  try {
    const lockContent = await fs.promises.readFile(lockFilePath, 'utf8');
    const lockInfo = JSON.parse(lockContent) as FileLockInfo;

    // Check if process exists
    try {
      process.kill(lockInfo.pid, 0);

      // Get current process info to compare with locked process
      const lockProcessInfo = await getProcessInfo(lockInfo.pid);
      // If we have process info from the lock and current process info, compare them
      if (lockInfo.processName && lockInfo.startTime && lockProcessInfo) {
        const nameMatches = lockProcessInfo.name === lockInfo.processName;
        //const startTimeMatches = Math.abs((currentProcessInfo.startTime ?? 0) - lockInfo.startTime) < 1000;

        if (!nameMatches) {
          console.warn(`Lock file ${lockFilePath} PID reused by different process`);
          return true; // Different process using same PID
        }
      }

      // Optional: Also check timestamp for very old locks
      const lockAge = Date.now() - lockInfo.timestamp;
      if (staleTimeoutInMs != null && lockAge > staleTimeoutInMs) {
        // 5 * 60 * 1000
        console.warn(`Lock file ${lockFilePath} is very old (${lockAge}ms), considering stale`);
        return true;
      }
      // Optional: Also check timestamp for very old locks
      // const stat = await fs.promises.stat(lockFilePath);
      // const lockAge = Date.now() - stat.mtime.getTime();

      return false; // Process exists and lock is recent
    } catch (killError: any) {
      return killError.code === 'ESRCH'; // Process not found = stale
    }
  } catch (error) {
    return true; // Can't read lock file = assume stale
  }
}

async function getProcessInfo(pid: number): Promise<{ name?: string; startTime?: number } | undefined> {
  try {
    if (process.platform === 'win32') {
      // Windows: Use wmic
      const output = execSync(`wmic process where "ProcessId=${pid}" get Name,CreationDate /format:csv`, {
        encoding: 'utf8',
      });
      const lines = output.trim().split('\n');
      if (lines.length > 2) {
        const data = lines[2].split(',');
        return { name: data[1], startTime: new Date(data[0]).getTime() };
      }
    } else {
      // macOS and Linux: Use ps command, output looks like this:
      // STARTED COMMAND
      // Mon Aug 11 22:06:43 2025 sh
      const output = execSync(`ps -p ${pid} -o lstart,comm`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      if (lines.length > 1) {
        const processLine = lines[1];
        // Match the date/time part at the start (fixed format)
        const startTimeMatch = /^(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.*)$/.exec(processLine);

        if (startTimeMatch) {
          const startTime = new Date(startTimeMatch[1]).getTime();
          const fullCommand = startTimeMatch[2]; // Everything after the timestamp
          const name = path.basename(fullCommand);
          return { name, startTime };
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to get process info for PID ${pid}:`, error);
  }

  return undefined;
}

async function acquireLock(filePath: string, timeoutMs = 30000): Promise<string> {
  const lockFilePath = `${filePath}.lock`;
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    // This is atomic using exclusive creation
    try {
      // const lockInfo = process.pid.toString();

      const currentProcessInfo = await getProcessInfo(process.pid);
      const lockInfo = JSON.stringify({
        pid: process.pid,
        timestamp: Date.now(),
        hostname: os.hostname(),
        processName: currentProcessInfo?.name ?? process.argv[0],
        startTime: currentProcessInfo?.startTime ?? Date.now(),
      } as FileLockInfo);
      await fs.promises.writeFile(lockFilePath, lockInfo, {
        flag: 'wx', // w = write, x = exclusive (fail if exists)
      });
      return lockFilePath;
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        // File already exists = someone else has the lock
        const isStale = await isLockStale(lockFilePath);
        if (isStale) {
          console.log(`Breaking stale lock for ${filePath}`);
          await fs.promises.unlink(lockFilePath);
          continue; // Immediate retry
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`File ${filePath} is locked by another process`);
}

// atomic append to jsonl file
export async function appendToJsonlAtomically<T>(filePath: string, payload: T, dryRun: boolean) {
  const taskJson = JSON.stringify(payload);
  if (taskJson.includes('\n') || taskJson.includes('\r')) {
    throw new Error('Task JSON contains actual newline characters - JSONL format violation');
  }
  const taskLine = taskJson + '\n';

  const fileLock = await FileLock.acquireLockOrThrow(filePath);
  try {
    // Open with exclusive write flag - fails if file is open for read by another process
    const fileHandle = await fs.promises.open(filePath, 'a', 0o644);
    // Write the task as a JSON line
    if (!dryRun) {
      await fileHandle.write(taskLine);
    }
    await fileHandle.close();
  } finally {
    fileLock.releaseLockSync();
  }
}

export async function processAndClearJsonlAtomically<T>(
  filePath: string,
  dryRun: boolean,
  processor: (entry: T) => Promise<void>,
): Promise<void> {
  const fileLock = await FileLock.acquireLockOrThrow(filePath);
  try {
    // Read all content atomically
    const fileHandle = await fs.promises.open(filePath, 'r+', 0o644);
    const content = await fileHandle.readFile('utf8');

    // Parse the JSONL content
    const lines = content.trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const lineJson = JSON.parse(line);
          await processor(lineJson);
        } catch (e) {
          console.warn(`Failed to parse or process JSONL line: ${line}`, e);
        }
      }
    }

    // Close the file handle before deleting
    await fileHandle.close();

    if (!dryRun) {
      // Delete the file
      await fs.promises.unlink(filePath);
    }
  } catch (e) {
    // empty
  } finally {
    fileLock.releaseLockSync();
  }
}
