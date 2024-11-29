export type Dir = [string, Entry][]
export type Entry = string | Dir

export const DefaultFS: Dir = [
    ['usr', [
        ['bin', [
            ['cat',
                `#!/usr/bin/node
                const path = process.resolveRelativePath(process.args[0], process.cwd);
                const file = await process.fs.readFile(path, 'utf-8', process.fileFlag('r'))
                process.println(file)`],
            ['mkdir',
                `#!/usr/bin/node
                await Promise.all(process.args.map(async dir => {
                    await process.fs.mkdir(process.resolveRelativePath(dir, process.cwd), 511).catch(e=> {
                        if (e instanceof Error) process.println(e.message);
                        else throw e;
                    })
                }));
            `],
            ['rmdir',
                `#!/usr/bin/node
                await Promise.all(process.args.map(async dir => {
                    await process.fs.rmdir(process.resolveRelativePath(dir, process.cwd)).catch(e=> {
                        if (e instanceof Error) process.println(e.message);
                        else throw e;
                    })
                }));
                `]
        ]]
    ]]
]