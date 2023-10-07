import { promisify } from "util";
import Process, { resolveRelativePath } from "../process";

export class LS extends Process {
    async main() {
        try {
            const res = await this.fs.readdir(resolveRelativePath(this.args[0] || '.', this.cwd));
            for (const item of res!) {
                this.println(item as string);
            }
            this.println();
        } catch (e) {
            if (e instanceof Error) { this.println(e.message); console.error(e) }
            else throw e;
        }
    }
}

export class MkDir extends Process {
    async main() {
        await Promise.all(this.args.map(async dir => {
            try {
                await this.fs.mkdir(resolveRelativePath(dir, this.cwd), 0o777)
            } catch (e) {
                if (e instanceof Error) { this.println(e.message); console.error(e) }
                else throw e;
            }
        }));
    }
}

export class RmDir extends Process {
    async main() {
        await Promise.all(this.args.map(async dir => {
            try {
                await this.fs.rmdir(resolveRelativePath(dir, this.cwd))
            } catch (e) {
                if (e instanceof Error) this.println(e.message);
                else throw e;
            }
        }));
    }
}
