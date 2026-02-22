interface MockCactusLm {
  download: jest.Mock<Promise<void>, []>;
  init: jest.Mock<Promise<void>, []>;
  complete: jest.Mock;
}

describe('cactus local adapter prepare state', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_ENABLE_CACTUS_LOCAL = 'true';
    process.env.EXPO_PUBLIC_CACTUS_MODEL = 'functiongemma-270m-it';
  });

  it('shares a single in-flight prepare promise for concurrent callers', async () => {
    const downloadMock = jest.fn<Promise<void>, []>(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 20);
        }),
    );
    const initMock = jest.fn<Promise<void>, []>(() => Promise.resolve());

    const cactusLmInstances: MockCactusLm[] = [];
    const CactusLMMock = jest.fn(() => {
      const mockInstance: MockCactusLm = {
        download: downloadMock,
        init: initMock,
        complete: jest.fn(),
      };
      cactusLmInstances.push(mockInstance);
      return mockInstance;
    });

    jest.doMock('cactus-react-native', () => ({
      CactusLM: CactusLMMock,
    }));

    let cactusLocalModule: typeof import('../cactus-local-llm-api') | undefined;
    jest.isolateModules(() => {
      cactusLocalModule = require('../cactus-local-llm-api') as typeof import('../cactus-local-llm-api');
    });
    if (cactusLocalModule == null) {
      throw new Error('Failed to load cactus-local-llm-api module');
    }

    await Promise.all([
      cactusLocalModule.prepareCactusLocalModelAsync(),
      cactusLocalModule.prepareCactusLocalModelAsync(),
    ]);

    expect(CactusLMMock).toHaveBeenCalledTimes(1);
    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(cactusLmInstances.length).toBe(1);
    expect(cactusLocalModule.readCactusRuntimeStateForDebugging()).toBe('ready');
  });

  it('marks runtime unavailable when constructor throws', async () => {
    const CactusLMMock = jest.fn(() => {
      throw new Error('native module unavailable');
    });

    jest.doMock('cactus-react-native', () => ({
      CactusLM: CactusLMMock,
    }));

    let cactusLocalModule: typeof import('../cactus-local-llm-api') | undefined;
    jest.isolateModules(() => {
      cactusLocalModule = require('../cactus-local-llm-api') as typeof import('../cactus-local-llm-api');
    });
    if (cactusLocalModule == null) {
      throw new Error('Failed to load cactus-local-llm-api module');
    }
    const isAvailable = await cactusLocalModule.isCactusLocalRuntimeAvailableAsync();

    expect(isAvailable).toBe(false);
    expect(cactusLocalModule.readCactusRuntimeStateForDebugging()).toBe('unavailable');
  });
});
