import BrowserFS, { FileSystem } from 'browserfs'
import MountableFileSystem from 'browserfs/dist/node/backend/MountableFileSystem';
import { promisify } from 'util'

const CreateUnixFS = promisify(FileSystem.MountableFileSystem.Create);
const CreateIndexedDB = promisify(FileSystem.IndexedDB.Create);

export async function createFS() {
    const root = await CreateIndexedDB({
        storeName: 'sda1'
    });
    if (!root) throw new Error("Failed to load /dev/sda1");
    const fs = await CreateUnixFS({
        '/': root
    });
    if (!fs) throw new Error("Failed to create Unix file system");
    return new FS(fs);
}

export class FS {
    constructor(public fs: MountableFileSystem) { }

    readdir = promisify(this.fs.readdir.bind(this.fs))
    mkdir = promisify(this.fs.mkdir.bind(this.fs))
    rmdir = promisify(this.fs.rmdir.bind(this.fs))
}