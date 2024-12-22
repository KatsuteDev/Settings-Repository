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

import * as os from "os";

import { isNull, isValidJson } from "../lib/is";
import * as logger from "../logger";
import * as files from "../lib/files";
import { Crypt } from "../lib/encrypt";
import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../lib/quickpick";

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

const crypt: Crypt = new Crypt(os.hostname());

//

export const mask: (s: string, c: credentials) => string = (s: string, c: credentials) => {
    return `${s}`.replace(new RegExp(c.auth, "gm"), "***");
}

export const authenticate: () => void = () => {
    const auth: credentials | undefined = authorization();
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
        }).then((password?: string) => {
            if(!password) return;

            const dist: Distribution = extension.distribution();

            logger.info(`Updated authentication: ${username}`);

            files.write(
                dist.credentials,
`{
    "login": "${username}",
    "auth": "${crypt.encrypt(password)}"
}`
            );
        });
    });
}

export const authorization: () => credentials | undefined = () => {
    const dist: Distribution = extension.distribution();

    if(!files.isFile(dist.credentials)) return undefined;

    const json: string = files.read(dist.credentials)!;

    if(!isValidJson(json)) return undefined;

    const credentials: credentials = JSON.parse(json);

    if(isNull(credentials.login) || isNull(credentials.auth)) return undefined;

    return {
        login: credentials.login,
        auth: crypt.decrypt(credentials.auth)
    };
}