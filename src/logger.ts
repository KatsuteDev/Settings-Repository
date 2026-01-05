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

//

export const check: string = '✔️';
export const x: string = '❌';
export const warning: string = '⚠️';

const logger: vscode.OutputChannel = vscode.window.createOutputChannel("Settings Repository", "log");

const indent: (message: string) => string = (message: string) => {
    return message.replace(/^/gm, "      ").substring(6)
}

export const log: (message: string) => void = (message: string) => {
    logger.appendLine(`      ${indent(message)}`);
    console.log(message);
}

export const info: (message: string, notify?: boolean) => void = (message: string, notify: boolean = false) => {
    logger.appendLine(`INFO  ${indent(message)}`);
    console.info(message);
    notify && vscode.window.showInformationMessage(message);
}

export const warn: (message: string, notify?: boolean) => void = (message: string, notify: boolean = false) => {
    logger.appendLine(`WARN  ${indent(message)}`);
    console.warn(message);
    notify && vscode.window.showWarningMessage(message);
}

export const error: (message: string, notify?: boolean) => void = (message: string, notify: boolean = false) => {
    logger.appendLine(`ERROR ${indent(message)}`);
    console.error(message);
    notify && vscode.window.showErrorMessage(message);
}

export const debug: (message: string) => void = (message: string) => {
    logger.appendLine(`DEBUG ${indent(message)}`);
    console.debug(message);
}