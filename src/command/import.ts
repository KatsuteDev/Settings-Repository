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

import AdmZip = require("adm-zip");

import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "$(file-zip) Import Settings",
    description: "Import settings from a zip file",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.importSettings"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.importSettings", () => {
    const dist: Distribution = extension.distribution();
    vscode.window.showOpenDialog({
        title: "Import Settings",
        defaultUri: vscode.Uri.file(dist.User),
        filters: {"ZIP archive": ["zip"]},
    }).then((uri?: vscode.Uri[]) => {
        if(!uri || uri.length == 0) return;

        const file: string = uri[0].fsPath;

        if(!fs.existsSync(file))
            return vscode.window.showErrorMessage("Failed to import settings: zip file did not exist");

        try{ // import from zip
            const zip: AdmZip = new AdmZip(file);

            // todo

        }catch(error: any){
            return vscode.window.showErrorMessage(`Failed to import settings: ${error}`);
        }
    });
});