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

import { push } from "./sync/git";
import * as config from "./config";
import * as logger from "./logger";
import { statusbar } from "./statusbar";
import * as auth from "./command/auth";
import * as nport from "./command/import";
import * as xport from "./command/export";
import * as local from "./command/local";
import * as remote from "./command/remote";
import * as options from "./command/options";
import { Distribution } from "./distribution";
import * as repository from "./command/repository";

//

let dist: Distribution;

export const distribution: () => Distribution = (): Distribution => dist;

let ctx: vscode.ExtensionContext;

export const context: () => vscode.ExtensionContext = () : vscode.ExtensionContext => ctx;

//

export const activate: (context: vscode.ExtensionContext) => void = (context: vscode.ExtensionContext) => {
    context.subscriptions.push(nport.command);
    context.subscriptions.push(xport.command);
    context.subscriptions.push(local.command);
    context.subscriptions.push(remote.command);

    context.subscriptions.push(auth.command);
    context.subscriptions.push(options.command);
    context.subscriptions.push(repository.command);

    context.subscriptions.push(statusbar);
    statusbar.show();

    logger.info("Added subscriptions");

    ctx = context;

    dist = new Distribution(context);

    logger.info("Added distribution");

    logger.info(`Auto sync is ${config.get("autoSync")}`);
}

// must be async, otherwise vscode closes without waiting
export const deactivate: () => Promise<void> = async () => {
    if(config.get("autoSync") === true)
        config.get("repository") && await push(config.get("repository"));
}

export const notify: () => void = () => {
    vscode.window.showWarningMessage("Settings have been modified, a reload is required to see changes.", "Reload", "Ignore").then((value?: string) => {
        if(value === "Reload")
            vscode.commands.executeCommand("workbench.action.reloadWindow");
    });
}