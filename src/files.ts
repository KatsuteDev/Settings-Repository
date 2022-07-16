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


import * as fs from "fs";
import * as path from "path";

export const isDirectory: (dir: string | undefined | null) => boolean = (dir: string | undefined | null) => {
    return dir !== undefined && dir !== null && fs.existsSync(dir) && fs.lstatSync(dir).isDirectory();
}

export const isFile: (file: string | undefined | null) => boolean = (file: string | undefined | null) => {
    return file !== undefined && file !== null && fs.existsSync(file) && !fs.lstatSync(file).isDirectory();
}

export const copyRecursiveSync: (src: string | undefined | null, dest: string) => void = (src: string | undefined | null, dest: string) => {
    if(!isDirectory(src)) return;

    if(!fs.existsSync(dest)) fs.mkdirSync(dest);

    for(const file of fs.readdirSync(src!) || [])
        if(isFile(file))
            fs.copyFileSync(path.join(src!, file), path.join(dest, file));
        else if(isDirectory(file)){
            fs.mkdirSync(path.join(dest, file));
            copyRecursiveSync(path.join(src!, file), path.join(dest, file));
        }
}