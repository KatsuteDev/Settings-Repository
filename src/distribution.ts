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

import * as files from "./files";

export class Distribution {

    public readonly Code: string;
        public readonly User: string;
            public readonly credentials: string;
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
        this.credentials = path.join(this.User, "credentials.json");
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
        if(!files.isDirectory(this.Extensions)) return undefined;

        let extensions: string = "";

        const installed: string[] = fs.readdirSync(this.Extensions!, {withFileTypes: true})
                                        .filter(f => f.isDirectory())
                                        .map(f => f.name);

        for(const folder of installed){
            if(!files.isDirectory(folder)) continue;

            const pkgFile: string = path.join(this.Extensions!, folder, "package.json");

            if(!files.isFile(pkgFile)) continue;

            const pkg: any = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));

            if(pkg.publisher === undefined || pkg.publisher === null || pkg.name === undefined || pkg.name === null) continue;

            const extension: vscode.Extension<any> | undefined = vscode.extensions.getExtension(`${pkg.publisher}.${pkg.name}`);

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

    public updateExtensions(): void { // we cannot handle enable/disable at the moment, see <https://github.com/microsoft/vscode/issues/15466>
        if(!files.isDirectory(this.Extensions) || !files.isFile(this.extensions)) return;

        const extensions: [{
            identifier: string,
            version: string,
            enabled: boolean
        }] = JSON.parse(fs.readFileSync(this.extensions, "utf-8"));

        const installed: string[] = fs.readdirSync(this.Extensions!, {withFileTypes: true})
                                        .filter(f => f.isDirectory())
                                        .map(f => f.name);

        // compare remote with installed
        OUTER:
        for(const extension of extensions){ // check remote extensions
            if(vscode.extensions.getExtension(extension.identifier) !== undefined) continue; // extension exists and is enabled

            const match: string = `${extension.identifier}-`;

            for(const local of installed) // check local
                if(files.isDirectory(local) && local.startsWith(match)) continue OUTER; // extension exists but is disabled

            // not found locally, install this extension
            vscode.commands.executeCommand("workbench.extensions.installExtension", extension.identifier);
        }

        // compare installed with remote
        OUTER:
        for(const local of installed){
            const pkgFile: string = path.join(this.Extensions!, local, "package.json");

            if(!files.isFile(pkgFile)) continue;

            const pkg: any = JSON.parse(fs.readFileSync(pkgFile, "utf-8"));

            if(pkg.publisher === undefined || pkg.publisher === null || pkg.name === undefined || pkg.name === null) continue;

            const match: string = `${pkg.publisher}.${pkg.name}`;

            for(const extension of extensions)
                if(extension.identifier === match)
                    continue OUTER; // extension exists on remote

            // not found on remote, uninstall this extension
            vscode.commands.executeCommand("workbench.extensions.uninstallExtension", match);
        }
    }

    public getSettings(): string | undefined {
        return files.isFile(this.settings)
            ? fs.readFileSync(this.settings, "utf-8").trim()
            : undefined;
    }

    public getKeybindings(): string | undefined {
        return files.isFile(this.keybindings)
            ? fs.readFileSync(this.keybindings, "utf-8").trim()
            : undefined;
    }

    private static readonly locale: RegExp = /(?<=^\s*"locale"\s*:\s*")[\w-]+(?=")/gm;

    public getLocale(): string | undefined {
        if(files.isFile(this.argv)) return undefined;

        const argv: string = fs.readFileSync(this.argv!, "utf-8");

        const match: RegExpExecArray | null = Distribution.locale.exec(argv);

        return match && match.length > 0
            ? `{
    "locale": "${match[0]}"
}`
            : undefined;
    }

    public updateLocale(): void {
        if(!files.isFile(this.argv) || !files.isFile(this.locale)) return;

        const argv: string = fs.readFileSync(this.argv!, "utf-8");
        const json: any = JSON.parse(fs.readFileSync(this.locale, "utf-8"));

        if(json.locale !== undefined && json.locale !== null)
            fs.writeFileSync(this.argv!, argv.replace(Distribution.locale, json.locale).trim());
    }

}