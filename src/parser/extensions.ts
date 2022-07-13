/*
 * Copyright (C) 2022 Katsute <https://github.com/Katsute>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as vscode from "vscode";

import * as fs from "fs";
import * as path from "path";

export const parse: (Extensions: string | undefined) => string = (Extensions: string | undefined) => {
    if(Extensions === undefined) return `{
\t"extensions": []
}`

    let extensions: string = "";

    const installed: string[] = fs.readdirSync(Extensions, {withFileTypes: true})
                                    .filter(f => f.isDirectory())
                                    .map(f => f.name);

    for(const folder of installed){
        if(!fs.existsSync(path.join(Extensions, folder, "package.json")))
            continue;

        const pkg: any = JSON.parse(fs.readFileSync(path.join(Extensions, folder, "package.json"), "utf-8"));

        const extension = vscode.extensions.getExtension(`${pkg.publisher}.${pkg.name}`);

        extensions += `\t\t{
\t\t\t"identifier": "${extension ? extension.id : folder.split('-').slice(0, -1).join('-')}",
\t\t\t"version": "${pkg.version}",
\t\t\t"enabled": ${!!extension}
\t\t},\n`;
    }

    return `{
\t"extensions": [
${extensions.slice(0, -2)}
\t]
}`;
}
