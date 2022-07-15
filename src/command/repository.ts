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

import * as auth from "./auth";
import * as local from "./local";
import * as remote from "./remote";
import * as config from "../config";
import { CommandQuickPickItem, handle, separator } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "$(gear) Settings Repository",
    description: "Choose which repository to sync to",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.repository"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.repository", () => {
    vscode.window.showQuickPick([
        repository,
        branch,
        auth.item,
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
            prompt: "The repository to sync settings to, if repository is private make sure token is scoped correctly",
            validateInput: (value: string) => {
                if(!value.startsWith("https://"))
                    return "Repository should start with 'https://'";
                if(!value.endsWith(".git"))
                    return "Repository should end with '.git'";
                return null;
            }
        }).then((repo?: string) => {
            if(!repo) return;

            config.update("repository", repo);
            repository.description = repo;

            auth.authenticate();
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
            prompt: "The branch to sync settings to, branch must already exist",
            validateInput: (value: string) => {
                if(value.trim().length === 0)
                    return "Branch can not be blank";
            }
        }).then((s?: string) => {
            config.update("branch", s);
            branch.description = s;
        });
    })
}