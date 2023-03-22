import Process, { resolveRelativePath } from "../process";
import { fs } from 'memfs';

export class LS extends Process {
    async main() {
        try {
            const res = await fs.promises.readdir(resolveRelativePath(this.args[0] || '.', this.cwd));
            for (const item of res) {
                this.println(item as string);
            }
            this.println();
        } catch (e) {
            if (e instanceof Error) this.println(e.message);
            else throw e;
        }
    }
}

export class MkDir extends Process {
    async main() {
        await Promise.all(this.args.map(async dir => {
            try {
                await fs.promises.mkdir(resolveRelativePath(dir, this.cwd))
            } catch (e) {
                if (e instanceof Error) this.println(e.message);
                else throw e;
            }
        }));
    }
}

export class RmDir extends Process {
    async main() {
        await Promise.all(this.args.map(async dir => {
            try {
                await fs.promises.rmdir(resolveRelativePath(dir, this.cwd))
            } catch (e) {
                if (e instanceof Error) this.println(e.message);
                else throw e;
            }
        }));
    }
}
