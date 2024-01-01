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

// return if object is strictly null or undefined
export const isNull: (obj: any) => boolean = (obj: any) => obj === null || obj === undefined;

// return if object is strictly not null or defined
export const isNotNull: (obj: any) => boolean = (obj: any) => !isNull(obj);

// return if object is strictly equal to false
export const isFalse: (obj: any) => boolean = (obj: any) => obj === false;

// return if object is strictly equal to true
export const isTrue: (obj: any) => boolean = (obj: any) => obj === true;

// return if JSON is valid
export const isValidJson: (json: string) => boolean = (json: string) => {
    try{
        JSON.parse(json);
        return true;
    }catch(error: any){
        return false;
    }
}