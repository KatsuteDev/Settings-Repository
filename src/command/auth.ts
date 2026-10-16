/*
 * Copyright (C) 2026 Katsute <https://github.com/Katsute>
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

import { isNull, isValidJson } from "../lib/is";
import * as config from "../config";
import * as logger from "../logger";
import * as extension from "../extension";
import { CommandQuickPickItem } from "../lib/quickpick";
import simpleGit from "simple-git";

//

export const item: CommandQuickPickItem = {
    label: "$(key) Authentication",
    description: "Configure authentication",
    onSelect: () => new Promise(() => vscode.commands.executeCommand("settings-repository.authenticate"))
}

export const command: vscode.Disposable = vscode.commands.registerCommand("settings-repository.authenticate", () => {
    authenticate();
});

//

export type credentials = {
    login: string,
    auth: string
};

const secret: string = "settings-repository.credentials";

//

const parseRepo: (repo: string, cred: credentials) => string = (repo: string, cred: credentials) => {
    const part: string[] = repo.split("://");
    return `${part[0]}://${cred.login}:${cred.auth}@${part.slice(1).join("://")}`;
}

export const mask: (s: string, c: credentials) => string = (s: string, c: credentials) => {
    return s.replace(new RegExp(c.auth, "gm"), "***");
}

export const authenticate: () => Promise<void> = async () => {
    const auth: credentials | undefined = await authorization();
    vscode.window.showInputBox({
        title: "Username",
        value: auth ? auth.login : undefined,
        placeHolder: "Username",
        prompt: "Login to access the repository",
        validateInput: (value: string) => {
            if(value.trim().length === 0)
                return "Login can not be blank";
        }
    }).then((username?: string) => {
        if(!username) return;
        vscode.window.showInputBox({
            title: "Token",
            placeHolder: "Token",
            password: true,
            prompt: "Token to authenticate with, if repository is private make sure token is scoped correctly",
            validateInput: (value: string) => {
                if(value.trim().length === 0)
                    return "Token can not be blank";
            }
        }).then(async (password?: string) => {
            if(!password) return;

            const repo: string = config.get("repository");

            if(repo){
                const cred: credentials = { login: username, auth: password };
                const remote: string = parseRepo(repo, cred);

                const err = await simpleGit().listRemote([remote])
                    .then(() => {
                        logger.info(`Credentials are valid for ${repo}`);
                    })
                    .catch(e => {
                        logger.error(`Failed to verify credentials for ${repo}:\n ${mask(String(e?.message ?? e), cred)}`, true);
                        return e;
                    });

                if(err) return;
            }

            await extension.context().secrets.store(secret, JSON.stringify({ login: username, auth: password }));

            logger.info(`Updated authentication: ${username}`);
        });
    });
}

const parse: (json?: string) => credentials | undefined = (json?: string) => {
    if(!json || !isValidJson(json)) return undefined;

    const credentials: credentials = JSON.parse(json);

    if(isNull(credentials.login) || isNull(credentials.auth)) return undefined;

    return {
        login: credentials.login,
        auth: credentials.auth
    };
}

export const authorization: () => Promise<credentials | undefined> = async () => parse(await extension.context().secrets.get(secret));