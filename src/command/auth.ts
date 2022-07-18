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

import * as files from "../files";
import { Crypt } from "../encrypt";
import * as logger from "../logger";
import * as extension from "../extension";
import { Distribution } from "../distribution";
import { CommandQuickPickItem } from "../quickpick";

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
    return s.replace(new RegExp(c.auth, "gm"), "***");
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

            fs.writeFileSync(
                dist.credentials,
`{
    "login": "${username}",
    "auth": "${crypt.encrypt(password)}
}`,
                "utf-8");
        });
    });
}

export const authorization: () => credentials | undefined = () => {
    const dist: Distribution = extension.distribution();

    if(!files.isFile(dist.credentials)) return undefined;

    const credentials: credentials = JSON.parse(fs.readFileSync(dist.credentials, "utf-8"));

    if(credentials.login === undefined || credentials.auth === undefined) return undefined;

    return {
        login: credentials.login,
        auth: crypt.decrypt(credentials.auth)
    };
}