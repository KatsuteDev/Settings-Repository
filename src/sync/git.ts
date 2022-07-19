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

import * as config from "../config";
import * as logger from "../logger";
import * as files from "../lib/files";
import * as auth from "../command/auth";
import * as extension from "../extension";
import * as statusbar from "../statusbar";
import { Distribution } from "../distribution";

//

const version: string = `VS-${vscode.version}`;

const cleanup: (fsPath: string) => void = (fsPath: string) => {
    !fs.existsSync(fsPath) || fs.rmSync(fsPath, {recursive: true, force: true, retryDelay: 1000, maxRetries: 10});
    statusbar.setActive(false);
};

export const pull: (repo: string) => void = async (repo: string) => {
    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred) return auth.authenticate();

    // init directory

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync"));

    if(!fs.existsSync(temp)) return logger.error(`Pull failed: unable to create temporary directory '${temp}'`, true);

    // repo

    const part: string[] = repo.split("://");
    const remote: string = `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;

    const branch: string = config.get("branch") ?? "main";

    // callback

    const gitback: (err: GitError | null) => void = (err: GitError | null) => {
        if(err){
            logger.error(`Failed to pull from ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`, true);
            cleanup(temp);
        }
    };

    // pull

    statusbar.setActive(true);

    logger.info(`Preparing to import settings from ${config.get("repository")}@${branch}`);

    try{
        const git: SimpleGit = simpleGit(temp);

        // clone repo on branch, omit history (not needed)
        await git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => {
            gitback(err);

            if(!err){
                /* extensions */ {
                    const extensions: string = path.join(temp, "extensions.json");

                    if(files.isFile(extensions)){
                        fs.copyFileSync(extensions, dist.extensions);

                        dist.updateExtensions();
                    }else
                        logger.warn("Extensions not found");
                }

                /* keybindings */ {
                    const keybindings: string = path.join(temp, "keybindings.json");

                    if(files.isFile(keybindings))
                        fs.copyFileSync(keybindings, dist.keybindings);
                    else
                        logger.warn("Keybindings not found");
                }

                /* locale */ {
                    const locale: string = path.join(temp, "locale.json");

                    if(files.isFile(locale)){
                        fs.copyFileSync(locale, dist.locale);

                        dist.updateLocale();
                    }else
                        logger.warn("Locale not found");
                }

                /* settings */ {
                    const settings: string = path.join(temp, "settings.json");

                    if(files.isFile(settings))
                        fs.copyFileSync(settings, dist.settings);
                    else
                        logger.warn("Settings not found");
                }

                /* snippets */ {
                    const snippets: string = path.join(temp, "snippets");

                    if(files.isDirectory(snippets))
                        files.copyRecursiveSync(snippets, dist.Snippets);
                    else
                        logger.warn("Snippets not found");
                }

                logger.info(`Imported settings from ${config.get("repository")}@${branch}`, true);

                cleanup(temp);
            }
        });
    }catch(error: any){
        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
    }finally{
        cleanup(temp);
    }
}

export const push: (repo: string) => Promise<void> = async (repo: string) => {
    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred) return auth.authenticate();

    // init directory

    const temp: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-sync-"));

    if(!fs.existsSync(temp)) return logger.error(`Push failed: unable to create temporary directory '${temp}'`, true);

    // repo

    const part: string[] = repo.split("://");
    const remote: string = `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;

    const branch: string = config.get("branch") ?? "main";

    // callback

    const gitback: (err: GitError | null) => void = (err: GitError | null) => {
        if(err){
            logger.error(`Failed to push to ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`, true);
            cleanup(temp);
        }
    };

    // push

    statusbar.setActive(true);

    logger.info(`Preparing to export settings to ${config.get("repository")}@${branch}`);
    logger.debug(`includeHostnameInCommit: ${config.get("includeHostnameInCommitMessage")}`);

    try{
        const git: SimpleGit = simpleGit(temp);

        // clone repo on branch, omit history (not needed)
        await git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => {
            gitback(err);

            if(!err){
                try{
                    /* extensions */ {
                        const extensions: string | undefined = dist.getExtensions();

                        if(extensions)
                            fs.writeFileSync(path.join(temp, "extensions.json"), extensions, "utf-8");
                        else
                            logger.warn("Extensions not found");
                    }

                    /* keybindings */ {
                        const keybindings: string | undefined = dist.getKeybindings();

                        if(keybindings)
                            fs.writeFileSync(path.join(temp, "keybindings.json"), keybindings, "utf-8");
                        else
                            logger.warn("Keybindings not found");
                    }

                    /* locale */ {
                        const locale: string | undefined = dist.getLocale();

                        if(locale)
                            fs.writeFileSync(path.join(temp, "locale.json"), locale, "utf-8");
                        else
                            logger.warn("Locale not found");
                    }

                    /* settings */ {
                        const settings: string | undefined = dist.getSettings();

                        if(settings)
                            fs.writeFileSync(path.join(temp, "settings.json"), settings, "utf-8");
                        else
                            logger.warn("Settings not found");
                    }

                    /* snippets */ {
                        files.copyRecursiveSync(dist.Snippets, path.join(temp, "snippets"));
                    }
                }catch(error: any){
                    if(error){
                        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
                        cleanup(temp);
                    }
                }
            }
        })
        // add files
        .add(".", gitback)
        // commit changes
        .commit(`${version} ${config.get("includeHostnameInCommitMessage") ? `<${os.userInfo().username}@${os.hostname()}> ` : ""} Update settings repository`, gitback)
        // push to remote
        .push(["-u", "origin", "HEAD"], (err: GitError | null) => {
            gitback(err);
            if(!err){
                logger.info(`Pushed settings to ${config.get("repository")}@${branch}`, true);
                cleanup(temp);
            }
        });
    }catch(error: any){
        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
    }finally{
        cleanup(temp);
    }
}