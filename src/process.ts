import { FS } from "./fs";


export const history: string[] = [];
export let historyIndex = -1;

export function resolveRelativePath(path: string, cwd: string): string {
    const url = new URL(path, "https://0.0.0.0" + cwd);
    return url.pathname;
}

export default abstract class Process {

    args: string[];
    cwd = "/";
    env: Record<string, string> = {};

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
        this.onInput = this.onInput.filter(handler => !handler[1])
    }

    onInput: [((data: string) => void), boolean][] = [];

    async readKey(show = true, surpressSpecial = true): Promise<string> {
        let char = '';
        do {
            char = await new Promise<string>(resolve => this.onInput.push([resolve, true]));
            if (char.length > 1 && surpressSpecial) char = '';
        } while (char == '')
        if (show) this.print(char);
        return char;
    }

    async readLine(): Promise<string> {
        const input = document.getElementById("input")!;
        let result = '';
        while (true) {
            const char = await this.readKey(false, false);
            console.log(char)
            if (char == '\b') result = result.slice(0, Math.max(result.length - 1, 0));
            else if (char == '\n') {
                input.innerText = '';
                this.print(result + '\n');
                if ((result != '\n' && result != '')) {
                    historyIndex++;
                    history.push(result);

                }
                console.log(history, historyIndex);
                return result;
            }
            else if (char == 'ArrowUp') {
                if (!(historyIndex + 1 >= history.length)) {
                    historyIndex++;

                }
                /* FIX ME*/ input.innerText = history[historyIndex]; // this line doesn't work as it should.
                console.log(history[historyIndex], historyIndex);
            }
            else if (char == 'ArrowDown') {
                if (!(historyIndex - 1 > 0)) {
                    historyIndex--;

                }
               /* FIX ME*/ input.innerText = history[historyIndex]; // this line doesn't work as it should.
                console.log(history[historyIndex], historyIndex);
            }
            else result += char;
            input.innerText = result;
        }
    }

    async runSubprocessAndMapInputs(process: Process, cwd?: string, env?: Process['env'], print = this.print) {
        process.cwd = resolveRelativePath(cwd || '.', this.cwd);
        process.env = { ...this.env, ...env };
        process.print = print;
        this.onInput.push([process.handleInput, false]);
        await process.main();
        this.onInput = this.onInput.filter(handler => handler[0] !== process.handleInput);
    }
}