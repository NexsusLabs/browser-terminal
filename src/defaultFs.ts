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
                if(process.args.length == 0) {
                    process.println("mkdir: Missing operand");
                    return;
                }
                await Promise.all(process.args.map(async dir => {
                    await process.fs.mkdir(process.resolveRelativePath(dir, process.cwd), 511).catch(e=> {
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
                    await process.fs.rmdir(process.resolveRelativePath(dir, process.cwd)).catch(e=> {
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
                    if(await process.fs.exists(path)) {
                        // yeah just read it and write the same data why not, who cares about performance
                        let contents = await process.fs.readFile(path,'utf-8', process.fileFlag('r'));
                        await process.fs.writeFile(path, contents, 'utf-8', process.fileFlag('w'), 365);
                    } else {
                        await process.fs.writeFile(path, '', 'utf-8', process.fileFlag('w'), 365);
                    }
                }));
                `], 
                /*[
                    'ls',`
                    
                    `
                ]*/
        ]]
    ]]
]