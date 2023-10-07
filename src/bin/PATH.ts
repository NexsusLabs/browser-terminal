import MountableFileSystem from "browserfs/dist/node/backend/MountableFileSystem";
import Process from "../process";
import Bash from "./bash";
import Echo from "./echo";
import { LS, MkDir, RmDir } from "./fs";
import { FS } from "../fs";

const PATH: Record<string, undefined | (() => (new(fs: FS, ...args: string[])=> Process))> = {
    'bash': () => Bash,
    'echo': () => Echo,
    'ls': () => LS,
    'mkdir': () => MkDir,
    'rmdir': () => RmDir,
};
export default PATH;