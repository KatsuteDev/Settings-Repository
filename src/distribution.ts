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

import * as path from "path";

export class Distribution {

    public readonly Code: string;
    public readonly User: string;
    public readonly Snippets: string;
    public readonly Extensions: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.Code = path.join(context.globalStorageUri.path, "../../../");
        this.User = path.join(this.Code, "User");
        this.Snippets = path.join(this.User, "snippets");

        const exts: vscode.Extension<any>[] = vscode.extensions.all.filter(e => !e.packageJSON.isBuiltin);

        this.Extensions = exts[0] ? path.join(exts[0].extensionPath, "../") : undefined;

        console.info(this.Code);
        console.info(this.User);
        console.info(this.Snippets);
        console.info(this.Extensions);
    }

}