export type Dir = [string, Entry][]
export type Entry = string | Dir

export const DefaultFS: Dir = [
    ['usr', [
        ['bin', [
            ['cat',
                `#!/usr/bin/node
                const path = process.resolveRelativePath(process.args[0], process.cwd);
                const file = await process.fs.promises.readFile(path, 'utf-8')
                process.println(file)`],
            ['mkdir',
                `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("mkdir: Missing operand");
                    return;
                }
                await Promise.all(process.args.map(async dir => {
                    await process.fs.promises.mkdir(process.resolveRelativePath(dir, process.cwd)).catch(e=> {
                        if (e instanceof Error) process.println(e.message);
                        else throw e;
                    })
                }));
            `],
            ['rmdir',
                `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("rmdir: Missing operand");
                    return;
                }
                await Promise.all(process.args.map(async dir => {
                    await process.fs.promises.rmdir(process.resolveRelativePath(dir, process.cwd)).catch(e=> {
                        if (e instanceof Error) process.println(e.message);
                        else throw e;
                    })
                }));
                `],
            ['node',
                `#!/usr/bin/node
                // virtual file`],
            ['touch',
                `#!/usr/bin/node
                if(process.args.length == 0) {
                    process.println("touch: Missing file operand");
                    return;
                }
                await Promise.all(process.args.map(async file => {
                    const path = process.resolveRelativePath(file, process.cwd);
                    if(await process.fs.promises.exists(path)) {
                        await process.fs.promises.utimes(path, new Date(), new Date());
                    } else {
                        await process.fs.promises.writeFile(path, '', 'utf-8');
                    }
                }));
                `], 
            ['ls',`#!/usr/bin/node
                const res = await process.fs.promises.readdir(process.resolveRelativePath(process.args[0] || '.', process.cwd));
                for (const item of res) {
                    process.println(item);
                }`]
        ]]
    ]]
]