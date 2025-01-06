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

import * as crypto from "crypto";

//

export class Crypt {

    private static readonly IV: number = 16;
    private static readonly SALT: number = 64;
    private static readonly AUTH: number = 16;

    private readonly secret: string;

    constructor(secret: string){
        this.secret = secret;
    }

    private getKey(salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(this.secret, salt, 100_000, 32, "sha512");
    }

    public encrypt(value: string): string {
        const iv  : Buffer = crypto.randomBytes(Crypt.IV);
        const salt: Buffer = crypto.randomBytes(Crypt.SALT);

        const civ: crypto.CipherGCM = crypto.createCipheriv("aes-256-gcm", this.getKey(salt), iv);

        const enc: Buffer = Buffer.concat([civ.update(value, "utf-8"), civ.final()]);

        return Buffer.concat([salt, iv, civ.getAuthTag(), enc]).toString("hex");
    }

    public decrypt(value: string){
        const buf: Buffer = Buffer.from(value, "hex");

        const iv  : Buffer = buf.subarray(Crypt.SALT, Crypt.SALT + Crypt.IV);
        const salt: Buffer = buf.subarray(0, Crypt.SALT);

        const enc : Buffer = buf.subarray(Crypt.SALT + Crypt.IV + Crypt.AUTH);
        const auth: Buffer = buf.subarray(Crypt.SALT + Crypt.IV, Crypt.SALT + Crypt.IV + Crypt.AUTH);

        const div: crypto.DecipherGCM = crypto.createDecipheriv("aes-256-gcm", this.getKey(salt), iv);
        div.setAuthTag(auth);

        return div.update(enc) + div.final("utf-8");
    }

}