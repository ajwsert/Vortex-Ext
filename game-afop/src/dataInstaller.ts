/*
Name: Avatar: Frontiers of Pandora Vortex Extension
Structure: Ubisoft Root Folder
Author: shadowsiam
Version: 1.0.3
Date: 10/26/2025
*/

import path from 'path';
import { fs, types, util, log } from 'vortex-api';
//import Nexus from '@nexusmods/nexus-api';
import { DATASUB_FOLDERS, DATA_MODTYPES } from './metadata';
//import IExtState from './IExtState';

//todo: implement a way to choose variations based on file names?

type IDialogContentEx = types.IDialogContent['options'] & { order: string[] };

export default class DataInstaller {
    private static _instance: DataInstaller;
    private api: types.IExtensionApi;

    public static instance(api: types.IExtensionApi) {
        return this._instance || (this._instance = new this(api));
    }

    private constructor(api: types.IExtensionApi) {
        this.api = api;
    }

    /** Install mod files with options to define the destination based on the package structure */
    public async installData(files: string[], gameId: string, packageFile: string, destinationPath: string): Promise<types.IInstallResult> {

        const readme = files.find(file => ['readme.txt', 'readme.md', 'instructions.txt'].indexOf(path.basename(file).toLowerCase()) >= 0);
        if (readme) {
            let cont: string = await fs.readFileAsync(path.join(destinationPath, readme), { encoding: 'utf8' });
            await this.viewReadme(cont);
        }

        let instructions: types.IInstruction[] | boolean | undefined;
        instructions = await this.hasKnownMainFolder(files, gameId, packageFile);

        if (instructions === false) return Promise.reject(new util.UserCanceled(true));

        if (!instructions) {
            instructions = await this.hasKnownSubfolders(files, gameId, packageFile);

            if (instructions === false) return Promise.reject(new util.UserCanceled(true));

            if (!instructions) {
                instructions = await this.unknownStructure(files, gameId, packageFile);

                if (instructions === false) return Promise.reject(new util.UserCanceled(true));
            }
        }

        return Promise.resolve({ instructions } as types.IInstallResult);
    }

    private async viewContents(list: string, name: string) {
        await this.api.showDialog('info', 'File contents',
            {
                parameters: {
                    name: name
                },
                text: 'These are the contents of the package file for "{{name}}":',
                message: list,
                options: {
                    translated: true
                }
            },
            [
                { label: 'Back', default: true }
            ],
            'afop-dg-view-files'
        );
    }

    private async viewReadme(content: string) {
        await this.api.showDialog('info', 'Mod Information/Read-me',
            {
                text: `This mod's package contains a "readme" file, which may contain important information, so its contents are shown below
(you can ignore anything below about installation, Vortex will take care of that in the next step):`,
                message: content,
                options: {
                    translated: true,
                    wrap: true
                }
            },
            [
                { label: 'Continue', default: true }
            ],
            'afop-dg-view-readme'
        );
    }

    private async pickVariation(variations: string[], modName: string, modAuthor?: string, modPage?: string) {
        const choices = variations.map((item, idx) => {
            return {
                id: `choice${idx}`, value: (idx == 0),
                text: item.replace(path.sep + path.basename(item) + path.sep, '').replace(path.sep, ' - ')
            } as types.ICheckbox;
        });

        const choicesNames = variations.map((item, idx) => path.basename(path.dirname(item)));

        const response: types.IDialogResult = await this.api.showDialog('question', 'Choose a variation',
            {
                parameters: { modName, modAuthor, modPage },
                md: `The ${(modAuthor) ? 'mod **{{modName}}** (by **{{modAuthor}}**)' : "mod's package"} seems to contain variations of the same files, please choose one below.

You can have multiple ones installed or choose a different one later by reinstalling the mod.`,
                choices,
                bbcode: `[i]Note: These choices are guessed based on the folders structure. ${(modPage) ? "Check the [url={{modPage}}]mod's page[/url] for more details." : 'Check the mod origin for more info.'}[/i]`,
                options: {
                    translated: true,
                    order: ['md', 'choices', 'bbcode']
                } as IDialogContentEx,
            },
            [
                { label: 'Cancel' },
                { label: 'Confirm', default: true }
            ],
            'afop-dg-pick-var'
        );

        if (response.action === 'Cancel') return false;

        const idx = Object.entries(response.input).findIndex(val => val[1] === true);
        return [variations[idx], choicesNames[idx]];
    }

    private async lookupModMeta(packageFile: string, gameId: string): Promise<{ modName: string; modAuthor: string; modPage: string; }> {
        const metadata: types.ILookupResult[] = await this.api.lookupModMeta({ filePath: packageFile, gameId: gameId });

        if (metadata[0]?.value.logicalFileName !== undefined)
            return {
                modName: metadata[0].value.logicalFileName,
                modAuthor: metadata[0].value.details?.author,
                modPage: metadata[0].value.details?.homepage
            };

        return undefined;
    }




    /** if there is a "blue" or "dlc1" folder */
    private async hasKnownMainFolder(files: string[], gameId: string, packageFile: string): Promise<boolean | types.IInstruction[]> {
        const modTypes = Object.entries(DATA_MODTYPES);

        let modFolder: string | boolean = files.find(file => modTypes.map(v => v[1].path).indexOf(path.basename(file).toLowerCase()) >= 0);

        if (!modFolder) return undefined;

        const variations = files.filter(file => path.basename(file) === path.basename(modFolder as string));
        let pickedVar: string[] | boolean;
        let chosenVar: string;
        if (variations.length > 1) {
            const metadata = await this.lookupModMeta(packageFile, gameId);

            pickedVar = await this.pickVariation(variations, metadata?.modName || 'Unknown mod', metadata?.modAuthor, metadata?.modPage);
            if (!pickedVar as boolean)
                return false;

            [modFolder, chosenVar] = pickedVar as string[];
        }

        const idx = modFolder.length;
        const rootPath = path.dirname(modFolder);
        let baseFolder = path.basename(modFolder);

        const filtered = files.filter(file =>
            !file.endsWith(path.sep) &&
            file.includes((rootPath === '.')
                ? `${baseFolder}${path.sep}`
                : `${rootPath}${path.sep}`
            )
        );

        let instructions: types.IInstruction[];

        instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: file.substring(idx)
            };
        });
        instructions.push({
            type: 'setmodtype',
            value: modTypes.filter(v => v[1].path === baseFolder)[0][1].id
        });
        if (chosenVar)
            instructions.push({
                type: 'attribute',
                key: 'variant',
                value: chosenVar
            });

        return instructions;
    }

    /** if there is not a "blue" or "dlc1" folder but there are some of the known subfolders */
    private async hasKnownSubfolders(files: string[], gameId: string, packageFile: string): Promise<boolean | types.IInstruction[]> {
        let modsubFolder: string | boolean = files.find(file => DATASUB_FOLDERS.indexOf(path.basename(file).toLowerCase()) >= 0);

        if (!modsubFolder) return undefined;

        const metadata = await this.lookupModMeta(packageFile, gameId);
        const parameters = metadata || { modName: 'Unknown mod' };

        const choices = Object.entries(DATA_MODTYPES).map((item, idx) => {
            return {
                id: item[1].path, value: (idx == 0),
                text: `It uses "${item[1].path}" as root folder`
            } as types.ICheckbox;
        });

        const response: types.IDialogResult = await this.api.showDialog('question', 'Unexpected package structure',
            {
                parameters,
                md: `Vortex is unable to properly determine how to automatically install ${metadata ? '**{{modName}}** (by **{{modAuthor}}**)' : '**{{modName}}**'} based on its package structure.

${metadata
                        ? `Please go to the [mod's page]({{modPage}}) and check the **description** for instructions, then pick the proper option below.`
                        : `Check the mod origin for instructions, then pick the proper option below.`}`,
                choices,
                text: ' ',
                bbcode: ' ',
                options: {
                    translated: true,
                    order: ['md', 'choices', 'text', 'bbcode']
                } as IDialogContentEx,
            },
            [
                { label: 'Cancel' },
                { label: 'Confirm', default: true }
            ],
            'afop-dg-pick-root'
        );

        if (response.action === 'Cancel') return false;

        const variations = files.filter(file => path.basename(file) == path.basename(modsubFolder as string));
        let pickedVar: string[] | boolean;
        let chosenVar: string;
        if (variations.length > 1) {

            pickedVar = await this.pickVariation(variations, metadata?.modName || 'Unknown mod', metadata?.modAuthor, metadata?.modPage);
            if (!pickedVar as boolean)
                return false;

            [modsubFolder, chosenVar] = pickedVar as string[];
        }

        const rootPath = path.dirname(modsubFolder);

        const filtered = files.filter(file =>
            !file.endsWith(path.sep) &&
            ((rootPath === '.')
                ? (DATASUB_FOLDERS.indexOf(file.substring(0, file.indexOf(path.sep)).toLowerCase()) >= 0)
                : file.includes(`${rootPath}${path.sep}`))
        );

        let instructions: types.IInstruction[];

        instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: (rootPath === '.') ? file : file.substring(rootPath.length + 1)
            };
        });

        instructions.push({
            type: 'setmodtype',
            value: Object.entries(DATA_MODTYPES)[Object.entries(response.input).findIndex(val => val[1] === true)][1].id
        });
        if (chosenVar)
            instructions.push({
                type: 'attribute',
                key: 'variant',
                value: chosenVar
            });

        return instructions;
    }

    /** If no known structure could be detected, path must be set manually */
    private async unknownStructure(files: string[], gameId: string, packageFile: string): Promise<boolean | types.IInstruction[]> {

        const metadata = await this.lookupModMeta(packageFile, gameId);
        const parameters = metadata || { modName: 'Unknown mod' };

        let _this = this;
        const response = await this.api.showDialog('question', 'Unexpected package structure',
            {
                parameters,
                md: `Vortex is unable to automatically determine how to install ${metadata ? '**{{modName}}** (by **{{modAuthor}}**)' : '**{{modName}}**'} based on its package structure.

${metadata ? `Please go to the [mod's page]({{modPage}}) and check the **description** for instructions` : 'Check the mod origin for instructions'}, then specify below the path where the files should be installed.

It **must** start with either "blue", "dlc1" or "dlc2". E.g. if the mod description instructs to use \`...games\\AFOP\\blue\\gameplay\\vanity\\juice\\...\` put \`blue\\gameplay\\vanity\\juice\\...\` below.
Either slash (\`/\`) and backslash (\`\\\`) works.`,
                links: [
                    {
                        label: 'View file contents', action(dismiss, id) {
                            _this.viewContents(files.join('\n'), parameters.modName);
                        }
                    }
                ],
                input: [
                    { id: 'path', type: 'text', label: 'Base path', placeholder: 'must start with "blue", "dlc1" or "dlc2", e.g: blue\\baked\\characterart\\npc...' },
                ],
                checkboxes: [
                    { id: 'full', value: false, text: 'Use complete structure (enable this option if the instructions tell to unpack the whole folders structure)' }
                ],
                options: {
                    translated: true,
                    order: ['md', 'links', 'input', 'checkboxes']
                } as IDialogContentEx,
                condition: (content) => {
                    // Loop through the input fields and make sure the user
                    //  provided a value.
                    const errors = content.input.map((inp) => {
                        switch (true) {
                            case (!inp.value):
                                return {
                                    actions: ['Install'], // The action/button we want to disable
                                    errorText: 'You must specify a value', // Tell the user what went wrong
                                    id: inp.id // this needs to be the id of the input so that Vortex highlights it as invalid
                                };
                            case (!inp.value.match(new RegExp(`^(?:${Object.keys(DATA_MODTYPES).join('|')})\\s*[/\\\\]`, 'gi'))):
                                return {
                                    actions: ['Install'],
                                    errorText: 'Path must start with either "blue", "dlc1" or "dlc2"',
                                    id: inp.id
                                };
                            case ((inp.value.search(/[><:]/g) >= 0)):
                                return {
                                    actions: ['Install'],
                                    errorText: 'Value has invalid characters (cannot contain > < and :)',
                                    id: inp.id
                                };

                            default: return undefined;
                        }

                    }).filter(err => err !== undefined);
                    return errors;
                }
            },
            [
                { label: 'Cancel' },
                { label: 'Install', default: true }
            ],
            'afop-dg-set-path'
        );

        if (response.action === 'Cancel') return false;

        const filtered = files.filter(file => (!file.endsWith(path.sep)));

        const basePath = (response.input.path as string)
            .replace(/(\s+[\\\/]\s+)/g, path.sep)
            .replace(/[\\\/]/g, path.sep).trim();

        let instructions: types.IInstruction[];

        instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: path.join(
                    basePath.substring(basePath.indexOf(path.sep) + 1),
                    (response.input.full) ? file : file.replace(`${path.dirname(file)}${path.sep}`, '')
                )
            };
        });

        let type = basePath.substring(0, basePath.indexOf(path.sep)).toLowerCase();

        instructions.push({
            type: 'setmodtype',
            value: DATA_MODTYPES[type].id
        });

        return instructions;
    }
}