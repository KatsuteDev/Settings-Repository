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

import * as fs from "fs";
import * as path from "path";

import { isNotNull } from "./is";

//

// file is directory and exists
export const isDirectory: (dir: string | undefined | null) => boolean = (dir: string | undefined | null) => {
    return isNotNull(dir) && fs.existsSync(dir!) && fs.lstatSync(dir!).isDirectory();
}

// file is file and exists
export const isFile: (file: string | undefined | null) => boolean = (file: string | undefined | null) => {
    return isNotNull(file) && fs.existsSync(file!) && !fs.lstatSync(file!).isDirectory();
}

// copy recursively
export const copyRecursiveSync: (src: string | undefined | null, dest: string) => void = (src: string | undefined | null, dest: string) => {
    if(!isDirectory(src)) return;

    fs.existsSync(dest) || fs.mkdirSync(dest);

    for(const file of fs.readdirSync(src!) || []){
        const fsPath: string = path.join(src!, file);
        if(isFile(fsPath))
            fs.copyFileSync(fsPath, path.join(dest, file));
        else if(isDirectory(fsPath)){
            fs.mkdirSync(path.join(dest, file));
            copyRecursiveSync(fsPath, path.join(dest, file));
        }
    }
}