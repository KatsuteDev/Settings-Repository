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
            public readonly extensions: string;
            public readonly keybindings: string;
            public readonly locale: string;
            public readonly settings: string;
            public readonly Snippets: string;
    public readonly dotVscode?: string;
        public readonly Extensions?: string;
        public readonly argv?: string;

    constructor(context: vscode.ExtensionContext) {
        this.Code = path.join(context.globalStorageUri.fsPath, "../../../");
        this.User = path.join(this.Code, "User");
        this.extensions  = path.join(this.User, "extensions.json");
        this.keybindings = path.join(this.User, "keybindings.json");
        this.locale      = path.join(this.User, "locale.json");
        this.settings    = path.join(this.User, "settings.json");
        this.Snippets    = path.join(this.User, "snippets");

        const exts: vscode.Extension<any>[] = vscode.extensions.all.filter(e => !e.packageJSON.isBuiltin);

        this.Extensions = exts[0] ? path.join(exts[0].extensionPath, "../") : undefined;
        this.dotVscode  = this.Extensions ? path.join(this.Extensions, "../") : undefined;
        this.argv       = this.dotVscode ? path.join(this.dotVscode, "argv.json") : undefined;
    }

    public getExtensions(): string | undefined {
        if(!this.Extensions || !fs.existsSync(this.Extensions) || !fs.lstatSync(this.Extensions).isDirectory()) return undefined;

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

    return extensions !== ""
        ? `[
${extensions.slice(0, -2)}
]`
        : undefined;
    }

    public updateExtensions(): void {

        // todo: uninstall removed extensions

        // todo: install missing extensions

        // todo: handle enable/disable

    }

    public getSettings(): string | undefined {
        return fs.existsSync(this.settings) && !fs.lstatSync(this.settings).isDirectory()
            ? fs.readFileSync(this.settings, "utf-8").trim()
            : undefined;
    }

    public getKeybindings(): string | undefined {
        return fs.existsSync(this.keybindings) && !fs.lstatSync(this.keybindings).isDirectory()
            ? fs.readFileSync(this.keybindings, "utf-8").trim()
            : undefined;
    }

    private static readonly locale: RegExp = /(?<=^\s*"locale"\s*:\s*")[\w-]+(?=")/gm;

    public getLocale(): string | undefined {
        if(!this.argv || !fs.existsSync(this.argv) || fs.lstatSync(this.argv).isDirectory())
            return undefined;

        const argv: string = fs.readFileSync(this.argv!, "utf-8");

        const match: RegExpExecArray | null = Distribution.locale.exec(argv);

        return match && match.length > 0
            ? `{
    "locale": "${match[0]}"
}`
            : undefined;
    }

    public updateLocale(): void {

        // todo: read locale

        // todo: update locale

    }

}