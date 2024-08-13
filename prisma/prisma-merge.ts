// Prisma has a built in support for that now.
// Update Prisma to v5.15.0 or later and this script is no longer needed.

import fs from 'fs';
import gl from 'glob';

const PREFIX = '//******** AUTO GENERATED FILE, DO NOT EDIT.  *********\n\n';

export function glob(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        gl.glob(path, (error, matches) => {
            if (error) {
                return reject(error);
            }
            resolve(matches);
        });
    });
}

export async function merge(schemaFilePattern: string, outputFile: string) {
    // const targetFiles = await glob(outputFile);
    // if (targetFiles.length !== 1) {
    //   throw new Error(`Cannot determine target file: ${targetFiles}`);
    // }

    const filesToMerge = await glob(schemaFilePattern);

    let prismaFile = PREFIX;

    for (const file of filesToMerge) {
        prismaFile += `\n\n${fs.readFileSync(file, { encoding: 'utf8' })}`;
    }

    // Overwrite file
    fs.writeFileSync(outputFile, prismaFile, { encoding: 'utf8' });
}

merge('prisma/schema/*.prisma', 'prisma/schema.prisma');
