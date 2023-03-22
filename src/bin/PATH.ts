import Process from "../process";
import Bash from "./bash";
import Echo from "./echo";
import { LS, MkDir, RmDir } from "./fs";

const PATH: Record<string, undefined | (() => (new(...args: string[])=> Process))> = {
    'bash': () => Bash,
    'echo': () => Echo,
    'ls': () => LS,
    'mkdir': () => MkDir,
    'rmdir': () => RmDir,
};
export default PATH;