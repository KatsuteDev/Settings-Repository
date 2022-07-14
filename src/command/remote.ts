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

import simpleGit, { GitError } from "simple-git";

import * as vscode from "vscode";

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as config from "../config";
import * as extension from "../extension";
import { Distribution } from "../distribution";

import { CommandQuickPickItem } from "../quickpick";
import { authenticate, authorization } from "./repository";

//

export const item: CommandQuickPickItem = {
    label: "$(cloud-upload) Overwrite Remote",
    description: "Overwrite remote settings configuration",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.overwriteRemote"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.overwriteRemote", () => {
    const dist: Distribution = extension.distribution();
    const auth = authorization();

    if(!auth) return authenticate();

    const remote: string = `https://${auth.username}:${auth.password}@${config.get("repository").substring(8)}`;

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync"));

    if(!temp)
        return vscode.window.showErrorMessage(`Push failed: failed to create temporary directory '${temp}'`);

    const gitHandle: (err: GitError | null) => void = (err: GitError | null) => {
        if(err){
            vscode.window.showErrorMessage(`Failed to push to ${config.get("repository")}:\n${err.name} ${err.message}`);
            !fs.existsSync(temp) || fs.rmSync(temp, {recursive: true});
        }
    }

    const branch: string = config.get("branch") ?? "main";

    simpleGit(temp)
        .init(gitHandle)
        .addRemote("origin", remote, gitHandle)
        .fetch("origin", branch, gitHandle)
        .checkout(branch, (err: GitError | null) => {
            gitHandle(err);

            if(!err){
                fs.writeFileSync(path.join(temp, "extensions.json"), dist.getExtensions(), "utf-8");
                fs.writeFileSync(path.join(temp, "keybindings.json"), dist.getKeybindings(), "utf-8");
                fs.writeFileSync(path.join(temp, "settings.json"), dist.getSettings(), "utf-8");

                const files: string[] = fs.readdirSync(dist.Snippets);
                if(files.length > 0){
                    const snippets: string = path.join(temp, "snippets");
                    fs.mkdirSync(snippets);

                    for(const file of files)
                        fs.copyFileSync(path.join(dist.Snippets, file), path.join(snippets, file));
                }
            }
        })
        .add(".", gitHandle)
        .commit(`VS-${vscode.version} ${config.get("includeHostnameInCommitMessage") ? `<${os.userInfo().username}@${os.hostname()}> ` : ""} Update settings repository`, gitHandle)
        .push("origin", branch, {}, (err: GitError | null) => {
            gitHandle(err);
            if(!err){
                !fs.existsSync(temp) || fs.rmSync(temp, {recursive: true});
                vscode.window.showInformationMessage(`Pushed settings to ${config.get("repository")}@${branch}`);
            }
        });
});