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

import simpleGit, { GitError, SimpleGit } from "simple-git";

import * as auth from "./auth";
import * as files from "../files";
import * as config from "../config";
import * as extension from "../extension";
import * as statusbar from "../statusbar";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../quickpick";

//

export const item: CommandQuickPickItem = {
    label: "$(cloud-upload) Overwrite Remote",
    description: "Overwrite remote settings configuration",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.overwriteRemote"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.overwriteRemote", () => {
    update();
});

// must be async for deactivate to work correctly
export const update: () => Promise<any> = async () => {
    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred) return auth.authenticate();

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync-"));

    if(!temp) return vscode.window.showErrorMessage(`Push failed: unable to create temporary directory '${temp}'`);

    const branch: string = config.get("branch") ?? "main";

    const cleanup: () => void = () => {
        !fs.existsSync(temp) || fs.rmSync(temp, {recursive: true, force: true, retryDelay: 5000, maxRetries: 5});
        !fs.existsSync(temp) || fs.rmSync(temp);
        statusbar.setActive(false);
    };

    try{
        statusbar.setActive(true);

        const gitHandle: (err: GitError | null) => void = (err: GitError | null) => {
            if(err){
                console.error(`${auth.mask(err.message, cred)}`);
                vscode.window.showErrorMessage(`Failed to push to ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`);
                cleanup();
            }
        }

        const part: string[] = config.get("repository").split("://");
        const remote: string = `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;

        const git: SimpleGit = simpleGit(temp);

        await git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => { // pull latest changes
            gitHandle(err);

            if(!err){
                try{
                    // extensions

                    const extensions: string | undefined = dist.getExtensions();
                    extensions && fs.writeFileSync(path.join(temp, "extensions.json"), extensions, "utf-8");

                    // keybindings

                    const keybindings: string | undefined = dist.getKeybindings();
                    keybindings && fs.writeFileSync(path.join(temp, "keybindings.json"), keybindings, "utf-8");

                    // locale

                    const locale: string | undefined = dist.getLocale();
                    locale && fs.writeFileSync(path.join(temp, "locale.json"), locale, "utf-8");

                    // settings

                    const settings: string | undefined = dist.getSettings();
                    settings && fs.writeFileSync(path.join(temp, "settings.json"), settings, "utf-8");

                    // snippets

                    files.copyRecursiveSync(dist.Snippets, path.join(temp, "snippets"));

                }catch(error: any){
                    console.error(auth.mask(error, cred));
                    vscode.window.showErrorMessage(`Push failed: ${auth.mask(error, cred)}`);
                    cleanup();
                }
            }
        })
        .add(".", gitHandle) // add files
        // commit changes
        .commit(`VS-${vscode.version} ${config.get("includeHostnameInCommitMessage") ? `<${os.userInfo().username}@${os.hostname()}> ` : ""} Update settings repository`, gitHandle)
        // push to remote
        .push(["-u", "origin", "HEAD"], (err: GitError | null) => {
            gitHandle(err);
            if(!err){ // cleanup
                vscode.window.showInformationMessage(`Pushed settings to ${config.get("repository")}@${branch}`);
                cleanup();
            }
        });
    }catch(error: any){
        console.error(auth.mask(error, cred));
        vscode.window.showErrorMessage(`Push failed: ${auth.mask(error, cred)}`);
        cleanup();
    }
}