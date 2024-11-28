import BrowserFS, { FileSystem } from 'browserfs'
import MountableFileSystem from 'browserfs/dist/node/backend/MountableFileSystem';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { promisify } from 'util'

const CreateUnixFS = promisify(FileSystem.MountableFileSystem.Create);
const CreateIndexedDB = promisify(FileSystem.IndexedDB.Create);

async function mkIfNotExists(cb: ()=> Promise<unknown>) {
    // yeah just try to make it and ignore if it explodes
    try {
        await cb()
    } catch (err) {
        if (!(typeof err == 'object' && err && 'code' in err && err.code === "EEXIST"))
            throw err;
    }
}


export async function createFS() {
    const root = await CreateIndexedDB({
        storeName: 'sda1'
    });
    if (!root) throw new Error("Failed to load /dev/sda1");
    const fs = await CreateUnixFS({
        '/': root
    });
    if (!fs) throw new Error("Failed to create Unix file system");
    const Fs = new FS(fs);
    //@ts-ignore
    window.fs = Fs;
    //@ts-ignore
    window.FileFlag = FileFlag
    mkIfNotExists(()=>Fs.mkdir('/usr', 0o777));
    mkIfNotExists(() => Fs.mkdir('/usr/bin', 0o777));
    mkIfNotExists(()=>Fs.writeFile("/usr/bin/node", "#!/usr/bin/node\n//Virtual file", 'utf-8', new FileFlag("w"), 0o555))
    return Fs;
}

export class FS {
    constructor(public fs: MountableFileSystem) { }

    readdir = promisify(this.fs.readdir.bind(this.fs))
    mkdir = promisify(this.fs.mkdir.bind(this.fs))
    rmdir = promisify(this.fs.rmdir.bind(this.fs))
    exists = (path: string)=> new Promise<boolean>(resolve=> this.fs.exists(path, resolve))
    readFile = promisify(this.fs.readFile.bind(this.fs));
    writeFile = promisify(this.fs.writeFile.bind(this.fs));
}