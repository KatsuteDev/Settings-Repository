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

import AdmZip from "adm-zip";

import * as fs from "fs";
import * as path from "path";

import * as logger from "../logger";
import * as files from "../lib/files";
import * as extension from "../extension";
import { Distribution, Profile } from "../distribution";
import { isValidJson } from "../lib/is";

//

export const inport: (fsPath: string) => void = (fsPath: string) => {
    if(!files.isFile(fsPath))
        return logger.error("Failed to import settings: zip file did not exist", true);

    const dist: Distribution = extension.distribution();

    try{ // import from zip
        const zip: AdmZip = new AdmZip(fsPath);

        const extract = (file: string) => zip.extractEntryTo(file, dist.User, undefined, true);

        logger.info(`Preparing to import settings from ${fsPath}`);

        /* extensions */ {
            const extensions: AdmZip.IZipEntry | null = zip.getEntry("extensions.json");

            if(extensions && !extensions.isDirectory){
                extract("extensions.json");

                dist.updateExtensions();
            }else
                logger.warn("Extensions not found");
        }

        /* keybindings */ {
            const keybindings: AdmZip.IZipEntry | null = zip.getEntry("keybindings.json");

            if(keybindings && !keybindings.isDirectory){
                extract("keybindings.json");

                dist.updateKeybindings(); // replace with OS specific keybinds
            }else
                logger.warn("Keybindings not found");
        }

        /* locale */ {
            const locale: AdmZip.IZipEntry | null = zip.getEntry("locale.json");

            if(locale && !locale.isDirectory){
                extract("locale.json");

                dist.updateLocale();
            }else
                logger.warn("Locale not found");
        }

        /* settings */ {
            const settings: AdmZip.IZipEntry | null = zip.getEntry("settings.json");

            if(settings && !settings.isDirectory)
                extract("settings.json");
            else
                logger.warn("Settings not found");
        }

        /* snippets */ {
            let hasSnippets: boolean = false;
            for(const entry of zip.getEntries().filter(f => f.entryName.toLowerCase().startsWith("snippets/")).map(f => f.entryName)){
                hasSnippets = true;
                extract(entry);
            }

            if(!hasSnippets)
                logger.warn("Snippets not found");
        }

        /* profiles */ {
            const storage: AdmZip.IZipEntry | null = zip.getEntry("profiles.json");
            if(storage && !storage.isDirectory){
                const text = zip.readAsText("profiles.json", "utf-8");
                if(isValidJson(text))
                    dist.writeProfiles(JSON.parse(text));
                else
                    logger.error("Profile json was invalid");
            }

            let hasProfiles: boolean = false;
            for(const entry of zip.getEntries().filter(f => f.entryName.toLowerCase().startsWith("profiles/")).map(f => f.entryName)){
                hasProfiles = true;
                extract(entry);
            }

            if(!hasProfiles)
                logger.warn("Profiles not found");
        }

        logger.info(`Imported settings from ${fsPath}`, true);

        extension.notify();
    }catch(error: any){
        logger.error(`Failed to import settings: ${error}`, true);
    }
}

export const xport: (fsPath: string) => void = (fsPath: string) => {
    const dist: Distribution = extension.distribution();

    try{
        const zip: AdmZip = new AdmZip();

        const insert = (file: string, content: string) => zip.addFile(file, Buffer.from(content, "utf-8"));

        logger.info(`Preparing to export settings to ${fsPath}`);

        /* extensions */ {
            const extensions: string | undefined = dist.getExtensions();

            if(extensions)
                insert("extensions.json", extensions);
            else
                logger.warn("Extensions not found");
        }

        /* keybindings */ {
            const keybindings: string | undefined = files.read(dist.keybindings);

            if(keybindings) // force keybindings to be saved as ctrl
                insert("keybindings.json", dist.formatKeybindings(keybindings));
            else
                logger.warn("Keybindings not found");
        }

        /* locale */ {
            const locale: string | undefined = dist.getLocale();

            if(locale)
                insert("locale.json", locale);
            else
                logger.warn("Locale not found");
        }

        /* settings */ {
            const settings: string | undefined = files.read(dist.settings);

            if(settings)
                insert("settings.json", settings);
            else
                logger.warn("Settings not found");
        }

        /* snippets */ {
            if(files.isDirectory(dist.snippets))
                zip.addLocalFolder(dist.snippets, "snippets");
            else
                logger.warn("Snippets not found");
        }

        /* profiles */ {
            const profiles: Profile[] | undefined = dist.getProfiles();
            if(profiles)
                insert("profiles.json", JSON.stringify(profiles, null, 4));
            else
                logger.warn("Profiles not found");

            if(files.isDirectory(dist.profiles)){
                for(const dir of fs.readdirSync(dist.profiles)){
                    const profile: string = path.join(dist.profiles, dir);
                    if(files.isDirectory(profile)){
                        for(const f of ["extensions.json", "keybindings.json", "settings.json"]){
                            const file = path.join(profile, f);
                            files.isFile(file) && insert(`profiles/${dir}/${f}`, files.read(file)!);
                        }
                        const snippets: string = path.join(profile, "snippets");
                        if(files.isDirectory(snippets)){
                            zip.addLocalFolder(snippets, `profiles/${dir}/snippets`);
                        }
                    }
                }
            }else
                logger.warn("Profiles dir not found");
        }

        zip.writeZip(fsPath, (error: Error | null) => {
            if(error)
                logger.error(`Failed to export settings: ${error}`, true);
            else
                logger.info(`Exported settings to ${fsPath}`, true);
        });
    }catch(error: any){
        logger.error(`Failed to export settings: ${error}`, true);
    }
}