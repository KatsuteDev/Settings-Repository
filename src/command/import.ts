/*
 * Copyright (C) 2024 Katsute <https://github.com/Katsute>
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

import { inport } from "../sync/zip";
import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../lib/quickpick";

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
        uri && uri[0] && inport(uri[0].fsPath);
    });
});