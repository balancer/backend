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

export async function merge(
    baseFile: string,
    schemaFilePattern: string,
    outputFile: string,
    excludedFilePattern: string,
) {
    // const targetFiles = await glob(outputFile);
    // if (targetFiles.length !== 1) {
    //   throw new Error(`Cannot determine target file: ${targetFiles}`);
    // }

    const excludedFiles = await glob(excludedFilePattern);

    const candidateFiles = await glob(schemaFilePattern);
    const filesToMerge = candidateFiles.filter(
        (file) => !excludedFiles.includes(file) && !file.endsWith(baseFile) && !file.endsWith(outputFile),
    );

    let prismaFile = PREFIX + fs.readFileSync(baseFile, { encoding: 'utf8' });

    for (const file of filesToMerge) {
        prismaFile += `\n\n${fs.readFileSync(file, { encoding: 'utf8' })}`;
    }

    // Overwrite file
    fs.writeFileSync(outputFile, prismaFile, { encoding: 'utf8' });
}

merge('prisma/base.prisma', 'modules/**/*.prisma', 'prisma/schema.prisma', 'prisma/schema.prisma');
