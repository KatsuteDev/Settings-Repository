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

import * as nport from "./import";
import * as xport from "./export";
import * as repo from "./repository";
import { handle, separator } from "../lib/quickpick";

//

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.options", () => {
    vscode.window.showQuickPick([
        repo.item,
        separator(),
        nport.item,
        xport.item
    ], options)
    .then(handle);
});

//

export const options: vscode.QuickPickOptions = {
    title: "Settings Repository",
    matchOnDetail: true,
    matchOnDescription: true
}