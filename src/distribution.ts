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

import * as logger from "./logger";
import * as files from "./lib/files";
import { isNotNull, isNull, isValidJson } from "./lib/is";

//

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

    public readonly macos: boolean = process.platform === "darwin";

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

        logger.debug(`Distribution:
  Code: ${this.Code}
  └ User: ${this.User}
    ├ credentials: ${this.credentials}
    ├ extensions:  ${this.extensions}
    ├ keybindings: ${this.keybindings}
    ├ locale:      ${this.locale}
    ├ settings:    ${this.settings}
    └ Snippets:    ${this.Snippets}
  .vscode: ${this.dotVscode}
  ├  Extensions: ${this.Extensions}
  └  argv:       ${this.argv}
  macos: ${this.macos}`);
    }

    public getExtensions(): string | undefined {
        if(!files.isDirectory(this.Extensions)) return undefined;

        let extensions: {[extension: string]: {version: string, enabled: boolean}} = {};

        const installed: string[] = fs.readdirSync(this.Extensions!, {withFileTypes: true})
                                        .filter(f => f.isDirectory())
                                        .map(f => f.name);

        for(const folder of installed){
            if(!files.isDirectory(path.join(this.Extensions!, folder))) continue;

            const pkgFile: string = path.join(this.Extensions!, folder, "package.json");

            if(!files.isFile(pkgFile)) continue;

            const json: string = fs.readFileSync(pkgFile, "utf-8");

            if(!isValidJson(json)) continue;

            const pkg: any = JSON.parse(json);

            if(isNull(pkg.publisher) || isNull(pkg.name)) continue;

            const extension: vscode.Extension<any> | undefined = vscode.extensions.getExtension(`${pkg.publisher}.${pkg.name}`);

            const id: string = `${pkg.publisher}.${pkg.name}`;

            if(!extensions[id] || pkg.version > extensions[id].version) // add if missing or higher version
                extensions[id] = {
                    version: pkg.version,
                    enabled: !!extension
                };
        }

        let json: string = "";

        for(const e in extensions){
            const ext: {
                version: string,
                enabled: boolean
            } = extensions[e];

            json += `    {
        "identifier": "${e}",
        "version": "${ext.version}",
        "enabled": ${ext.enabled}
    },\n`;
        }

    return json !== ""
        ? `[
${json.slice(0, -2)}
]`
        : undefined;
    }

    public updateExtensions(): void { // we cannot handle enable/disable at the moment, see <https://github.com/microsoft/vscode/issues/15466#issuecomment-724147661>
        if(!files.isDirectory(this.Extensions) || !files.isFile(this.extensions)) return;

        const json: string = fs.readFileSync(this.extensions, "utf-8");

        const extensions: [{
            identifier: string,
            version: string,
            enabled: boolean
        }] = isValidJson(json) ? JSON.parse(json) : [];

        const installed: string[] = fs.readdirSync(this.Extensions!, {withFileTypes: true})
                                        .filter(f => f.isDirectory())
                                        .map(f => f.name);

        // compare remote with installed
        OUTER:
        for(const extension of extensions){ // check remote extensions
            if(isNotNull(vscode.extensions.getExtension(extension.identifier))) continue; // extension exists and is enabled

            /* vscode doesn't remove extension folder on uninstall, see <https://github.com/microsoft/vscode/issues/81046#issuecomment-532317549>

            const match: string = `${extension.identifier.toLocaleLowerCase()}-`;

            for(const local of installed) // check local
                if(files.isDirectory(path.join(this.Extensions!, local)) && local.toLowerCase().startsWith(match)) continue OUTER; // extension exists but is disabled

            */

            // not found locally, install this extension
            vscode.commands.executeCommand("workbench.extensions.installExtension", extension.identifier); // works even if already installed
            logger.info(`${logger.check} Installed ${extension.identifier}`);
        }

        // compare installed with remote
        OUTER:
        for(const local of installed){
            const pkgFile: string = path.join(this.Extensions!, local, "package.json");

            if(!files.isFile(pkgFile)) continue;

            const json: string = fs.readFileSync(pkgFile, "utf-8");

            if(!isValidJson(json)) continue;

            const pkg: any = JSON.parse(json);

            if(isNull(pkg.publisher) || isNull(pkg.name)) continue;

            const identifier: string = `${pkg.publisher}.${pkg.name}`;

            for(const extension of extensions)
                if(extension.identifier === identifier)
                    continue OUTER; // extension exists on remote

            // not found on remote, uninstall this extension
            try{
                vscode.commands.executeCommand("workbench.extensions.uninstallExtension", identifier);
            }finally{} // ignore failed uninstall (already uninstalled)
            logger.info(`${logger.x} Uninstalled ${identifier}`);
        }
    }

    public getSettings(): string | undefined {
        return files.isFile(this.settings)
            ? fs.readFileSync(this.settings, "utf-8").trim()
            : undefined;
    }

    private static readonly ctrl: RegExp = /(?<=^\s*"key"\s*:\s*".*)\bctrl\b(?=.*",?$)/gmi; // ⌃ ctrl
    private static readonly cmd:  RegExp = /(?<=^\s*"key"\s*:\s*".*)\bcmd\b(?=.*",?$)/gmi;  // ⌘ cmd

    public getKeybindings(): string | undefined {
        return files.isFile(this.keybindings)
            ? fs.readFileSync(this.keybindings, "utf-8").trim()
            : undefined;
    }

    public formatKeybindings(keybindings: string, ctrl: "ctrl" | "cmd" = "ctrl"): string {
        return keybindings.replace(ctrl === "ctrl" ? Distribution.cmd : Distribution.ctrl, ctrl); // ⌃ ctrl ↔ ⌘ cmd
    }

    public updateKeybindings(): void {
        if(!files.isFile(this.keybindings)) return;

        // replace local keybindings with OS specific keybinds
        fs.writeFileSync(this.keybindings, this.formatKeybindings(fs.readFileSync(this.keybindings, "utf-8"), this.macos ? "cmd" : "ctrl"));
    }

    private static readonly locale: RegExp = /(?<=^\s*"locale"\s*:\s*")[\w-]+(?=")/mi;

    public getLocale(): string | undefined {
        if(!files.isFile(this.argv)) return undefined;

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

        const json: string = fs.readFileSync(this.locale, "utf-8");

        if(!isValidJson(json)) return;

        const locale: any = JSON.parse(json);

        if(isNotNull(locale.locale))
            fs.writeFileSync(this.argv!, argv.replace(Distribution.locale, locale.locale).trim());
    }

}