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

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import simpleGit, { GitError, SimpleGit } from "simple-git";

import { isNull, isValidJson } from "../lib/is";
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

const parseRepo: (repo: string, cred: auth.credentials) => string = (repo: string, cred: auth.credentials) => {
    const part: string[] = repo.split("://");
    return `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;
}

export const pull: (repo: string, skipNotify?: boolean) => void = async (repo: string, skipNotify: boolean = false) => {
    if(isNull(repo)) return;

    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred) return skipNotify || auth.authenticate();

    // init directory

    const staging: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-repository-"));

    if(!fs.existsSync(staging)) return logger.error(`Pull failed: unable to create temporary directory '${staging}'`, true);

    // repo

    const remote: string = parseRepo(repo, cred);

    const branch: string = config.get("branch") ?? "main";

    // callback

    const gitback: (err: GitError | null) => void = (err: GitError | null) => {
        if(err){
            logger.error(`Failed to pull from ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`, true);
            cleanup(staging);
        }
    };

    // pull

    statusbar.setActive(true);

    logger.info(`Preparing to import settings from ${config.get("repository")}@${branch}`);
    logger.debug(`Git clone ${auth.mask(remote, cred)}`);

    try{
        const git: SimpleGit = simpleGit(staging);

        // clone repo on branch, omit history (not needed)
        await git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => {
            gitback(err);

            if(!err){
                /* extensions */ {
                    const extensions: string = path.join(staging, "extensions.json");

                    if(files.isFile(extensions)){
                        files.copy(extensions, dist.extensions);

                        dist.updateExtensions();
                    }else
                        logger.warn("Extensions not found");
                }

                /* keybindings */ {
                    const keybindings: string = path.join(staging, "keybindings.json");

                    if(files.isFile(keybindings)){
                        files.copy(keybindings, dist.keybindings);

                        dist.updateKeybindings(); // replace with OS specific keybinds
                    }else
                        logger.warn("Keybindings not found");
                }

                /* locale */ {
                    const locale: string = path.join(staging, "locale.json");

                    if(files.isFile(locale)){
                        files.copy(locale, dist.locale);

                        dist.updateLocale();
                    }else
                        logger.warn("Locale not found");
                }

                /* settings */ {
                    const settings: string = path.join(staging, "settings.json");

                    if(files.isFile(settings))
                        files.copy(settings, dist.settings);
                    else
                        logger.warn("Settings not found");
                }

                /* snippets */ {
                    const snippets: string = path.join(staging, "snippets");

                    if(files.isDirectory(snippets))
                        files.copyRecursiveSync(snippets, dist.snippets);
                    else
                        logger.warn("Snippets not found");
                }

                /* profiles */ {
                    const storage: string = path.join(staging, "storage.json");

                    if(files.isFile(storage)){
                        const text = files.read(storage)!;
                        if(isValidJson(text)){
                            dist.writeProfiles(JSON.parse(text));
                        }
                    }else
                        logger.warn("Storage not found");

                    const profiles: string = path.join(staging, "profiles");

                    if(files.isDirectory(profiles))
                        files.copyRecursiveSync(profiles, dist.profiles);
                    else
                        logger.warn("Profiles not found");
                }

                logger.info(`Imported settings from ${config.get("repository")}@${branch}`, true);

                cleanup(staging);

                skipNotify || extension.notify();
            }
        });
    }catch(error: any){
        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
    }finally{
        cleanup(staging);
    }
}

export const push: (repo: string, ignoreBadAuth?: boolean) => Promise<void> = async (repo: string, ignoreBadAuth: boolean = false) => {
    if(isNull(repo)) return;

    const dist: Distribution = extension.distribution();
    const cred: auth.credentials | undefined = auth.authorization();

    if(!cred) return ignoreBadAuth ? undefined : auth.authenticate();

    // init directory

    const staging: string = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-settings-repository-"));

    if(!fs.existsSync(staging)) return logger.error(`Push failed: unable to create temporary directory '${staging}'`, true);

    // repo

    const remote: string = parseRepo(repo, cred);

    const branch: string = config.get("branch") ?? "main";

    // callback

    const gitback: (err: GitError | null) => void = (err: GitError | null) => {
        if(err){
            logger.error(`Failed to push to ${config.get("repository")}:\n ${auth.mask(err.message, cred)}`, true);
            cleanup(staging);
        }
    };

    // push

    statusbar.setActive(true);

    logger.info(`Preparing to export settings to ${config.get("repository")}@${branch}`);
    logger.debug(`Git clone ${auth.mask(remote, cred)}`);
    logger.debug(`includeHostnameInCommit: ${config.get("includeHostnameInCommitMessage")}`);

    try{
        const git: SimpleGit = simpleGit(staging);

        // clone repo on branch, omit history (not needed)
        await git.clone(remote, ".", ["-b", branch, "--depth", "1"], (err: GitError | null) => {
            gitback(err);

            if(!err){
                try{
                    /* extensions */ {
                        const extensions: string | undefined = dist.getExtensions();

                        if(extensions)
                            files.write(path.join(staging, "extensions.json"), extensions);
                        else
                            logger.warn("Extensions not found");
                    }

                    /* keybindings */ {
                        const keybindings: string | undefined = files.read(dist.keybindings);

                        if(keybindings) // force keybindings to be saved as ctrl
                            files.write(path.join(staging, "keybindings.json"), dist.formatKeybindings(keybindings, "ctrl"));
                        else
                            logger.warn("Keybindings not found");
                    }

                    /* locale */ {
                        const locale: string | undefined = dist.getLocale();

                        if(locale)
                            files.write(path.join(staging, "locale.json"), locale);
                        else
                            logger.warn("Locale not found");
                    }

                    /* settings */ {
                        const settings: string | undefined = files.read(dist.settings);

                        if(settings)
                            files.write(path.join(staging, "settings.json"), settings);
                        else
                            logger.warn("Settings not found");
                    }

                    /* snippets */ {
                        const snippets: string = path.join(staging, "snippets");

                        // remove remote, use local copy
                        fs.rmSync(snippets, {recursive: true, force: true});

                        if(files.isDirectory(dist.snippets))
                            files.copyRecursiveSync(dist.snippets, snippets);
                        else
                            logger.warn("Snippets not found");
                    }

                    /* profiles */ {
                        const prof = dist.getProfiles();

                        if(prof)
                            files.write(path.join(staging, "storage.json"), JSON.stringify(prof, null, 4));
                        else
                            logger.warn("Storage not found");

                        const profiles: string = path.join(staging, "profiles");

                        // remove remote, use local copy
                        fs.rmSync(profiles, {recursive: true, force: true});

                        if(files.isDirectory(dist.profiles)){
                            for(const dir of fs.readdirSync(dist.profiles)){
                                const profile: string = path.join(dist.profiles, dir);
                                if(files.isDirectory(profile)){
                                    for(const f of ["extensions.json", "keybindings.json", "settings.json"]){
                                        files.copy(path.join(profile, f), path.join(profiles, dir, f));
                                    }
                                    const snippets: string = path.join(profile, "snippets");
                                    files.copyRecursiveSync(snippets, path.join(profiles, dir, "snippets"));
                                }
                            }
                        }else
                            logger.warn("Profiles not found");
                    }
                }catch(error: any){
                    if(error){
                        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
                        cleanup(staging);
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
                cleanup(staging);
            }
        });
    }catch(error: any){
        logger.error(`Push failed: ${auth.mask(error, cred)}`, true);
    }finally{
        cleanup(staging);
    }
}