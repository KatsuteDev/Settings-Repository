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

export class Distribution {

    public readonly Code: string;
    public readonly User: string;
    public readonly Snippets: string;
    public readonly Extensions?: string;

    constructor(context: vscode.ExtensionContext) {
        this.Code = path.join(context.globalStorageUri.fsPath, "../../../");
        this.User = path.join(this.Code, "User");
        this.Snippets = path.join(this.User, "snippets");

        const exts: vscode.Extension<any>[] = vscode.extensions.all.filter(e => !e.packageJSON.isBuiltin);

        this.Extensions = exts[0] ? path.join(exts[0].extensionPath, "../") : undefined;
    }

    public getExtensions(): string {
        if(this.Extensions === undefined) return `[]`;

        let extensions: string = "";

        const installed: string[] = fs.readdirSync(this.Extensions, {withFileTypes: true})
                                        .filter(f => f.isDirectory())
                                        .map(f => f.name);

        for(const folder of installed){
            if(!fs.existsSync(path.join(this.Extensions, folder, "package.json")))
                continue;

            const pkg: any = JSON.parse(fs.readFileSync(path.join(this.Extensions, folder, "package.json"), "utf-8"));

            const extension = vscode.extensions.getExtension(`${pkg.publisher}.${pkg.name}`);

            extensions += `    {
        "identifier": "${pkg.publisher}.${pkg.name}",
        "version": "${pkg.version}",
        "enabled": ${!!extension}
    },\n`;
        }

    return extensions === ""
        ? `[]`
        : `[
${extensions.slice(0, -2)}
]`;
    }

    public getSettings(): string {
        return fs.readFileSync(path.join(this.User, "settings.json"), "utf-8");
    }

    public getKeybindings(): string {
        return fs.readFileSync(path.join(this.User, "keybindings.json"), "utf-8");
    }

}