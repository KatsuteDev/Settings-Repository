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

import simpleGit from "simple-git";

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

    try{
        fs.writeFileSync(path.join(temp, "extensions.json"), dist.getExtensions(), "utf-8");
        fs.writeFileSync(path.join(temp, "keybindings.json"), dist.getKeybindings(), "utf-8");
        fs.writeFileSync(path.join(temp, "settings.json"), dist.getSettings(), "utf-8");

        simpleGit(temp)
            .init()
            .add("./*")
            .addRemote("origin", remote)
            .push("origin", config.get("branch") ?? "main");
    }catch(error: any){
        console.error(error);
    }finally{
        //if(temp)
        //    fs.rmSync(temp, {recursive: true})
    }
});