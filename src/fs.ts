
import { DefaultFS, Dir } from './defaultFs';
import { configure, fs } from '@zenfs/core';
import { IndexedDB } from '@zenfs/dom';

async function mkIfNotExists(cb: ()=> Promise<unknown>) {
    // yeah just try to make it and ignore if it explodes
    try {
        await cb()
    } catch (err) {
        if (!(typeof err == 'object' && err && 'code' in err && err.code === "EEXIST"))
            throw err;
    }
}

export type FS = typeof fs

export async function createFS() {
    await configure({
        mounts: {
            '/': {backend: IndexedDB, storeName: "sda1"}
        },
        addDevices: true
    })
    //@ts-ignore
    window.fs = fs;
    if (!fs.existsSync("/usr")) {
        async function generateDir(path: string, dir: Dir) {
            for (const [name, entry] of dir) {
                if (typeof entry == 'string') {
                    console.log('file', path+name)
                    await fs.promises.writeFile(path + name, entry, 'utf-8');
                } else {
                    console.log('dir', path)
                    await fs.promises.mkdir(path+name+'/')
                    generateDir(path+name+'/', entry)
                }
            }
        }
        generateDir('/', DefaultFS);
    }
    return fs;
}
