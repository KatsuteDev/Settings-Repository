/*
 * Copyright (C) 2025 Katsute <https://github.com/Katsute>
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

const vsconfig = () => vscode.workspace.getConfiguration("settings-repository");

export const get: (key: string) => any = (key: string) => {
    return vsconfig().get(key);
}

export const update: (key: string, value: any, skipWarning?: boolean) => void = (key: string, value: any) => {
    vsconfig().update(key, value, vscode.ConfigurationTarget.Global);
}