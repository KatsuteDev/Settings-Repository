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

import * as os from "os";

import * as config from "../config";

import * as local from "./local";
import * as remote from "./remote";


import * as extension from "../extension";
import { Distribution } from "../distribution";

import { CommandQuickPickItem, handle, separator } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "Settings Repository",
    description: "Choose which repository to sync to",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.repository"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.repository", () => {
    vscode.window.showQuickPick([
        repository,
        branch,
        separator(),
        local.item,
        remote.item,
    ], options)
    .then(handle);
});

export const options: vscode.QuickPickOptions = {
    title: "Settings Repository",
    matchOnDetail: true,
    matchOnDescription: true
}

//

const repository: CommandQuickPickItem = {
    label: "$(repo) Repository:",
    description: config.get("repository") || "Select repository",
    onSelect: () => new Promise(() => {
        vscode.window.showInputBox({
            title: "Repository",
            value: config.get("repository"),
            placeHolder: "Repository",
            prompt: "The repository to sync settings to"
        }).then((repo: string | undefined) => {
            if(!repo) return;
            vscode.window.showInputBox({
                title: "Username",
                placeHolder: "Username",
                prompt: "Login to access the repository"
            }).then((username: string | undefined) => {
                if(!username) return;
                vscode.window.showInputBox({
                    title: "Password",
                    placeHolder: "Password",
                    password: true,
                    prompt: "Password or token to authenticate with"
                }).then((password: string | undefined) => {
                    if(!password) return;

                    const dist: Distribution = extension.distribution();

                    config.update("repository", repo);

                    os.hostname();
                });
            });
        });
    })
}

const branch: CommandQuickPickItem = {
    label: "$(git-branch) Branch:",
    description: config.get("branch") || "Select branch",
    onSelect: () => new Promise(() => {
        vscode.window.showInputBox({
            title: "Branch",
            value: config.get("branch"),
            placeHolder: "Branch",
            prompt: "The branch to sync settings to"
        }).then((s: string | undefined) => config.update("branch", s));
    })
}