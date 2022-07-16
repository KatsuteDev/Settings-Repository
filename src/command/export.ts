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

import * as AdmZip from "adm-zip";

import * as files from "../files";
import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "$(file-zip) Export Settings",
    description: "Export settings to a zip file",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.exportSettings"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.exportSettings", () => {
    const dist: Distribution = extension.distribution();
    vscode.window.showSaveDialog({
        title: "Export Settings",
        defaultUri: vscode.Uri.file(path.join(dist.User, "settings.zip")),
        filters: {"ZIP archive": ["zip"]}
    }).then((uri?: vscode.Uri) => {
        if(!uri) return;

        try{
            const zip: AdmZip = new AdmZip();

            // extensions

            const extensions: string | undefined = dist.getExtensions();
            extensions && zip.addFile("extensions.json", Buffer.from(extensions, "utf-8"));

            // keybindings

            const keybindings: string | undefined = dist.getKeybindings();
            keybindings && zip.addFile("keybindings.json", Buffer.from(keybindings, "utf-8"));

            // locale

            const locale: string | undefined = dist.getLocale();
            locale && zip.addFile("locale.json", Buffer.from(locale));

            // settings

            const settings: string | undefined = dist.getSettings();
            settings && zip.addFile("settings.json", Buffer.from(settings, "utf-8"));

            // snippets

            files.isDirectory(dist.Snippets) && zip.addLocalFolder(dist.Snippets, "snippets");

            zip.writeZip(uri.fsPath, (error: Error | null) => {
                if(error){
                    console.error(error);
                    return vscode.window.showErrorMessage(`Failed to export settings: ${error}`);
                }
            });
        }catch(error: any){
            console.error(error);
            return vscode.window.showErrorMessage(`Failed to export settings: ${error}`);
        }
    });
});