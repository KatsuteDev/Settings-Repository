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

import * as logger from "../logger";
import * as files from "../lib/files";
import * as extension from "../extension";
import { Distribution } from "../distribution";

//

export const inport: (fsPath: string) => void = (fsPath: string) => {
    if(!files.isFile(fsPath))
        return logger.error("Failed to import settings: zip file did not exist", true);

    const dist: Distribution = extension.distribution();

    try{ // import from zip
        const zip: AdmZip = new AdmZip(fsPath);

        logger.info(`Preparing to import settings from ${fsPath}`);

        /* extensions */ {
            const extensions: AdmZip.IZipEntry | null = zip.getEntry("extensions.json");

            if(extensions && !extensions.isDirectory){
                zip.extractEntryTo("extensions.json", dist.User, undefined, true);

                dist.updateExtensions();
            }else
                logger.warn("Extensions not found");
        }

        /* keybindings */ {
            const keybindings: AdmZip.IZipEntry | null = zip.getEntry("keybindings.json");

            if(keybindings && !keybindings.isDirectory){
                zip.extractEntryTo("keybindings.json", dist.User, undefined, true);

                dist.updateKeybindings(); // replace with OS specific keybinds
            }else
                logger.warn("Keybindings not found");
        }

        /* locale */ {
            const locale: AdmZip.IZipEntry | null = zip.getEntry("locale.json");

            if(locale && !locale.isDirectory){
                zip.extractEntryTo("locale.json", dist.User, undefined, true);

                dist.updateLocale();
            }else
                logger.warn("Locale not found");
        }

        /* settings */ {
            const settings: AdmZip.IZipEntry | null = zip.getEntry("settings.json");

            if(settings && !settings.isDirectory)
                zip.extractEntryTo("settings.json", dist.User, undefined, true);
            else
                logger.warn("Settings not found");
        }

        /* snippets */ {
            let hasSnippets: boolean = false;
            for(const entry of zip.getEntries().filter(f => f.entryName.toLowerCase().startsWith("snippets/")).map(f => f.entryName)){
                hasSnippets = true;
                zip.extractEntryTo(entry, dist.User, undefined, true);
            }

            if(!hasSnippets)
                logger.warn("Snippets not found");
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

        logger.info(`Preparing to export settings to ${fsPath}`);

        /* extensions */ {
            const extensions: string | undefined = dist.getExtensions();

            if(extensions)
                zip.addFile("extensions.json", Buffer.from(extensions, "utf-8"));
            else
                logger.warn("Extensions not found");
        }

        /* keybindings */ {
            const keybindings: string | undefined = dist.getKeybindings();

            if(keybindings) // force keybindings to be saved as ctrl
                zip.addFile("keybindings.json", Buffer.from(dist.formatKeybindings(keybindings), "utf-8"));
            else
                logger.warn("Keybindings not found");
        }

        /* locale */ {
            const locale: string | undefined = dist.getLocale();

            if(locale)
                zip.addFile("locale.json", Buffer.from(locale));
            else
                logger.warn("Locale not found");
        }

        /* settings */ {
            const settings: string | undefined = dist.getSettings();

            if(settings)
                zip.addFile("settings.json", Buffer.from(settings, "utf-8"));
            else
                logger.warn("Settings not found");
        }

        /* snippets */ {
            if(files.isDirectory(dist.Snippets))
                zip.addLocalFolder(dist.Snippets, "snippets");
            else
                logger.warn("Snippets not found");
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