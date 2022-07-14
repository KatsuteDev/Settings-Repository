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
import * as os from "os";
import * as path from "path";

import simpleGit, { GitError } from "simple-git";

import * as auth from "./auth";
import * as config from "../config";
import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "$(cloud-download) Overwrite Local",
    description: "Overwrite local settings configuration",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.overwriteLocal"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.overwriteLocal", () => {
    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred)
        return auth.authenticate();

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync"));

    if(!temp)
        return vscode.window.showErrorMessage(`Pull failed: unable to create temporary directory '${temp}'`);

    const branch: string = config.get("branch") ?? "main";

    try{
        const gitHandle: (err: GitError | null) => void = (err: GitError | null) => {
            if(err){
                vscode.window.showErrorMessage(`Failed to push to ${config.get("repository")}:\n${err.name} ${err.message}`);
                !fs.existsSync(temp) || fs.rmSync(temp, {recursive: true});
            }
        }

        const remote: string = `https://${cred.login}:${cred.auth}@${config.get("repository").substring(8)}`;

        // todo: warn branch if missing

        simpleGit(temp)
            .init(gitHandle)
            .addRemote("origin", remote, gitHandle)
            .fetch("origin", branch, gitHandle)
            .checkout(branch, (err: GitError | null) => {
                gitHandle(err);

                if(!err){
                    // read from repo

                    //todo

                    // snippets

                    //todo

                }
            });

    }catch(error: any){
        vscode.window.showErrorMessage(`Pull failed: ${error}`);
        !fs.existsSync(temp) || fs.rmSync(temp, {recursive: true});
    }
});