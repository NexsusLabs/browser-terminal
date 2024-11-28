import MountableFileSystem from "browserfs/dist/node/backend/MountableFileSystem";
import { FS } from "./fs";

export function resolveRelativePath(path: string, cwd: string): string {
    const url = new URL(path, "https://0.0.0.0" + cwd);
    return url.pathname;
}

export default abstract class Process {
    
    args: string[];
    cwd = "/";

    constructor(public fs: FS, ...args: string[]) {
        this.args = args;
    }

    abstract main(): Promise<number | void | undefined>

    print(data: string) { }
    println(data?: string) {
        this.print(data ? (data + '\n') : '\n');
    }
    handleInput = (data: string) => {
        for (const handler of this.onInput) {
            handler[0](data);
        }
        this.onInput = this.onInput.filter(handler=> !handler[1])
    }

    onInput: [((data: string) => void), boolean][] = [];

    async readKey(show = true): Promise<string> {
        const char = await new Promise<string>(resolve => this.onInput.push([resolve, true]));
        if (show) this.print(char);
        return char;
    }

    async readLine(): Promise<string> {
        const input = document.getElementById("input")!;
        let result = '';
        while (true) {
            const char = await this.readKey(false);
            if (char == '\b') result = result.slice(0, Math.max(result.length - 1, 0));
            else if (char == '\n') {
                input.innerText = '';
                this.print(result + '\n');
                return result;
            }
            else result += char;
            input.innerText = result;
        }
    }

    async runSubprocessAndMapInputs(process: Process, cwd?: string, print = this.print) {
        process.cwd = resolveRelativePath(cwd || '.', this.cwd);
        process.print = print;
        this.onInput.push([process.handleInput, false]);
        await process.main();
        this.onInput = this.onInput.filter(handler => handler[0] !== process.handleInput);
    }
}