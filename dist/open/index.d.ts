import {ChildProcess} from 'child_process';

declare namespace open {
    interface Options {
        readonly wait?: boolean;

        readonly background?: boolean;

        readonly newInstance?: boolean;

        readonly app?: App | readonly App[];

        readonly allowNonzeroExitCode?: boolean;
    }

    interface OpenAppOptions extends Omit<Options, 'app'> {
        readonly arguments?: readonly string[];
    }

    type AppName = 'firefox' | 'chrome' | 'edge';

    type App = {
        name: string | readonly string[];
        arguments?: readonly string[];
    };
}

declare const open: {
    (target: string, options?: open.Options): Promise<ChildProcess>;

    apps: Record<open.AppName, string | readonly string[]>;

    openApp: (name: open.App['name'], options?: open.OpenAppOptions) => Promise<ChildProcess>;
};

export = open;
