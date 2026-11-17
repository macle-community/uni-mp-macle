declare module '@macle/fs-extra' {
  const fsExtra: {
    copySync(source: string, destination: string, options?: { overwrite?: boolean }): void;
    ensureDirSync(directory: string): void;
    removeSync(target: string): void;
  };
  export = fsExtra;
}

declare module '@macle/open' {
  function open(target: string): Promise<void>;
  export = open;
}
