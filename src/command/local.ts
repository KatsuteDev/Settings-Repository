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
import * as logger from "../logger";
import * as extension from "../extension";
import * as statusbar from "../statusbar";
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

    if(!cred) return auth.authenticate();

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync"));

    if(!temp) return vscode.window.showErrorMessage(`Pull failed: unable to create temporary directory '${temp}'`);

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
                vscode.window.showErrorMessage(logger.error(`Failed to push to ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`));
                cleanup();
            }
        };

        const part: string[] = config.get("repository").split("://");
        const remote: string = `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;

        logger.info(`Preparing to import settings from ${config.get("repository")}@${branch}`);

        const git: SimpleGit = simpleGit(temp);

        git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => { // pull latest changes
            gitHandle(err);

            if(!err){
                // extensions

                const extensions: string = path.join(temp, "extensions.json");

                if(files.isFile(extensions)){
                    fs.copyFileSync(extensions, dist.extensions);

                    dist.updateExtensions();
                }else
                    logger.warn("Extensions not found");

                // keybindings

                const keybindings: string = path.join(temp, "keybindings.json");

                if(files.isFile(keybindings))
                    fs.copyFileSync(keybindings, dist.keybindings);
                else
                    logger.warn("Keybindings not found");

                // locale

                const locale: string = path.join(temp, "locale.json");

                if(files.isFile(locale)){
                    fs.copyFileSync(locale, dist.locale);

                    dist.updateLocale();
                }else
                    logger.warn("Locale not found");

                // settings

                const settings: string = path.join(temp, "settings.json");

                if(files.isFile(settings))
                    fs.copyFileSync(settings, dist.settings);
                else
                    logger.warn("Settings not found");

                // snippets

                const snippets: string = path.join(temp, "snippets");

                if(files.isDirectory(snippets))
                    files.copyRecursiveSync(snippets, dist.Snippets);
                else
                    logger.warn("Snippets not found");

                vscode.window.showInformationMessage(logger.info(`Imported settings from ${config.get("repository")}@${branch}`));
            }
        });
    }catch(error: any){
        vscode.window.showErrorMessage(logger.error(`Push failed: ${auth.mask(error, cred)}`));
    }finally{
        cleanup();
    }
});