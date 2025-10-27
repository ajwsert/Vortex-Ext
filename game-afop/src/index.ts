/*
Name: Avatar: Frontiers of Pandora Vortex Extension
Structure: Ubisoft Root Folder
Author: shadowsiam
Version: 1.0.3
Date: 10/26/2025
*/

//Import libraries
import path from 'path';
import semver from 'semver';
import { actions, fs, log, types, util, selectors } from 'vortex-api';
import { IFileInfo } from '@nexusmods/nexus-api';
import { ITool } from 'vortex-api/lib/types/ITool';
import { ComplexActionCreator1, createAction } from 'redux-act';

import MLSettings, { MLSettingsProps } from './MLSettings';
import DataInstaller from './dataInstaller';

import {
    EXT_VER, EXT_GAME_ID, NS, SET_IGNORE_ML_INST,
    GAME_ID, PLUS_ID, UPLAYAPP_ID, STEAMAPP_ID, EPICAPP_ID, /*XBOX_ID,*/
    EXEC, EXEC_PLUS, GAME_NAME, GAME_NAME_SHORT,
    CONFIG_ID, CONFIG_PATH, CONFIG_EXT, /*CONFIG_FILES,*/
    DATA_MODTYPES, DATA_ID, DATA_PATH, DATA_EXTS,
    PLUG_ID, PLUG_PATH, PLUG_EXTS,
    RESH_ID, RESH_PATH, RESH_EXTS, /*RESH_FOLDERS,*/
    MODLOADER_ID, MODLOADER_FILE, MODLOADER_CFG,
    MODLOADER_NAME, MODLOADER_PAGE_NO, MODLOADER_FILE_NO
} from './metadata';

type TranslateFunc = (input: string, options?: { replace: { [val: string]: string }, ns: string }) => string;

class AFOPExt {
    private static _instance: AFOPExt;
    private api: types.IExtensionApi;
    private t: TranslateFunc;
    private setIgnoreMLInst: ComplexActionCreator1<boolean, boolean, {}>;

    public static instance(context: types.IExtensionContext) {
        return this._instance || (this._instance = new this(context));
    }

    private constructor(context: types.IExtensionContext) {
        log('debug', 'AFOPExt instance started');

        this.api = context.api;
        this.t = context.api.translate;
        this.setIgnoreMLInst = createAction('SET_AFOP_IGNORE_LOADER', (enabled: boolean) => enabled);

        context.registerGame({
            version: EXT_VER,
            id: GAME_ID,
            name: GAME_NAME,
            shortName: GAME_NAME_SHORT,
            logo: 'gameart.png',
            mergeMods: true,
            queryPath: this.findGame,
            queryModPath: this.getModPath,
            executable: this.getExec,
            setup: this.setup.bind(this),
            requiresCleanup: true,
            requiredFiles: [EXEC],
            //requiresLauncher: this.requiresLauncher,
            supportedTools: [ //TODO: find a way to hide if store isn't Ubi
                {
                    id: PLUS_ID,
                    name: this.t('Launch Game Ubisoft Plus'),
                    shortName: this.t('Launch Game Ubisoft+'),
                    logo: 'tool.png',
                    queryPath: this.findGame,
                    executable: this.getToolExec,
                    requiredFiles: [EXEC_PLUS],
                    detach: true,
                    relative: true,
                    exclusive: true,
                    defaultPrimary: false, //prevents error if not found
                    //isPrimary: true,
                    parameters: []
                } as ITool,
            ],
            environment: {
                UPlayAPPId: UPLAYAPP_ID,
                SteamAPPId: STEAMAPP_ID
            },
            details: {
                nexusPageId: GAME_ID,
                uPlayAppId: UPLAYAPP_ID,
                steamAppId: STEAMAPP_ID,
                epicAppId: EPICAPP_ID
            },
            //deploymentGate: this.deploymentGate.bind(this)
        });

        context.registerMigration(this.migration.bind(this));

        const isSupported = (gameId: string) => {
            let _a: types.IDiscoveryResult;
            return (gameId === GAME_ID) && !!((_a = context.api.getState().settings.gameMode.discovered[gameId]) === null || _a === void 0 ? void 0 : _a.path);
        }

        const getPath = (game: types.IGame) => {
            let _a: types.IDiscoveryResult;
            return (_a = context.api.getState().settings.gameMode.discovered[game.id]) === null || _a === void 0 ? void 0 : _a.path;
        }

        const falsePromise = () => Promise.resolve(false);

        //register mod types
        let pri = 75;
        for (const type in DATA_MODTYPES) {
            const item = DATA_MODTYPES[type];
            context.registerModType(item.id, pri, isSupported, (game) => path.join(getPath(game), item.path), falsePromise, { name: item.name });
            pri++;
        }

        context.registerModType(PLUG_ID, 85, isSupported, getPath, falsePromise, { name: 'Modloader plugin' });
        context.registerModType(CONFIG_ID, 86, isSupported, (game) => CONFIG_PATH, falsePromise, { name: 'Config (Documents)' });
        context.registerModType(MODLOADER_ID, 87, isSupported, getPath, falsePromise, { name: 'Modloader' });
        context.registerModType(RESH_ID, 90, isSupported, (game) => path.join(getPath(game), RESH_PATH), falsePromise, { name: 'Reshade preset' });

        //register mod installers
        context.registerInstaller(DATA_ID, 25, this.testData, this.installData.bind(this));
        context.registerInstaller(PLUG_ID, 26, this.testPlugin, this.installPlugin);
        context.registerInstaller(CONFIG_ID, 27, this.testConfig, this.installConfig);
        context.registerInstaller(MODLOADER_ID, 28, this.testModLoader, this.installModLoader);
        context.registerInstaller(RESH_ID, 40, this.testReshade, this.installReshade.bind(this));
        // catch-all to prevent installing unknown stuff
        context.registerInstaller(`${EXT_GAME_ID}-unk`, 50, this.testUnknown, this.installUnknown.bind(this));

        context.registerReducer(['settings', GAME_ID], {
            reducers: {
                [this.setIgnoreMLInst.toString()]: (state, payload) => util.setSafe(state, [SET_IGNORE_ML_INST], payload)
            },
            defaults: {
                [`${SET_IGNORE_ML_INST}`]: false
                //reshadePresetPath: '.',
                //reshadeShadersPath: './reshade-shaders'
            }
        });

        context.registerMainPage('settings', this.t('Modloader Settings'), MLSettings, {
            group: 'per-game',
            id: `${EXT_GAME_ID}-settings`,
            visible: () => (selectors.activeGameId(context.api.getState()) === GAME_ID),
            props: () => {
                return {
                    iniPath: path.join(selectors.currentGameDiscovery(context.api.getState()).path, MODLOADER_CFG)
                } as MLSettingsProps;
            }
        });

        context.registerAction('mod-icons', 1000, 'import', {}, this.t('Install Modloader'), this.actionInstModLoader.bind(this),
            () => selectors.activeGameId(context.api.getState()) === GAME_ID
        );

        context.registerAction('mod-icons', 1001, 'settings', {}, this.t('Reset check suppression'), () => {
            context.api.store.dispatch(this.setIgnoreMLInst(false));
            context.api.sendNotification({
                replace: { modloader: MODLOADER_NAME },
                type: 'info',
                title: 'Preference cleaned',
                message: 'The check for {{modloader}} on load has been reenabled.'
            });
        },
            () => (
                selectors.activeGameId(context.api.getState()) === GAME_ID &&
                util.getSafe(context.api.getState(), ['settings', GAME_ID, SET_IGNORE_ML_INST], false)
            )
        );

        context.registerAction('mod-icons', 3000, 'open-ext', {}, this.t('Open Game Config Folder'), () => {
            const openPath = CONFIG_PATH;
            util.opn(openPath).catch(() => null);
        }, () => selectors.activeGameId(context.api.getState()) === GAME_ID);
    }



    /** 
     * Find the game installation folder
     * @see {@link ITool.queryPath} */
    private findGame(): string | Promise<string> {
        return util.GameStoreHelper.findByAppId([STEAMAPP_ID, EPICAPP_ID, UPLAYAPP_ID/*, XBOX_ID*/])
            .then(async (game: types.IGameStoreEntry) => {

                actions.setToolVisible(GAME_ID, PLUS_ID, (game.gameStoreId === 'uplay')); //Not working?

                return game.gamePath;
            });
    }

    /** @see {@link ITool.executable} */
    private getExec(discoveredPath?: string): string {
        return EXEC;
    }

    /** 
     * Set the mod path for the game
     * @see {@link types.IGame.queryModPath} */
    private getModPath(gamePath: string): string {
        return DATA_PATH;
    }

    /** @see {@link ITool.executable} */
    private getToolExec(discoveredPath?: string): string {
        return EXEC_PLUS;
    }

    /** @see {@link types.IGame.setup} */
    private async setup(discovery: types.IDiscoveryResult): Promise<void> {
        try {
            //await fs.ensureDirWritableAsync(path.join(util.getVortexPath('documents'), CONFIG_PATH)); //No needed, should already exist
            await fs.ensureDirWritableAsync(path.join(discovery.path, DATA_PATH));
            await fs.ensureDirWritableAsync(path.join(discovery.path, PLUG_PATH));

            await this.downloadModLoader();
            return;
        } catch (error) {
            // show error in vortex ui
            this.api.showErrorNotification('Failed to setup extension', error, { allowReport: true });
            throw error;
        }
    }

    /** @see {@link types.IExtensionContext.registerAction} */
    private async actionInstModLoader(instanceIds?: string[]): Promise<boolean | void> {
        const api = this.api;
        const isInstalled = () => {
            const mods = api.getState().persistent.mods[GAME_ID] || {};
            return Object.keys(mods).some(id => mods[id]?.type === MODLOADER_ID);
        }

        if (!isInstalled()) {
            try {
                const discovery: types.IDiscoveryResult = selectors.discoveryByGame(api.getState(), GAME_ID);
                if (!discovery || !discovery.path) {
                    return Promise.reject(new util.SetupError('Game is not discovered'));
                }

                await fs.statAsync(path.join(discovery.path, MODLOADER_FILE));

                api.sendNotification({
                    replace: { modloader: MODLOADER_NAME },
                    id: `${EXT_GAME_ID}-modloader-installed-man`,
                    type: 'warning',
                    title: '{{modloader}} already installed',
                    message: `It seems {{modloader}} was already installed manually.

It's recommended to install it through Vortex for better management.`,
                    actions: [
                        {
                            title: 'Install Modloader',
                            action: async () => { await this.downloadModLoader(); }
                        },
                    ],
                });
                return;
            } catch (e) { }

            await this.downloadModLoader();
        } else
            api.sendNotification({
                replace: { modloader: MODLOADER_NAME },
                id: `${EXT_GAME_ID}-modloader-installed`,
                type: 'info',
                title: '{{modloader}} already installed',
                message: '{{modloader}} is already installed. The action was canceled.'
            });
    }

    /*private async requiresLauncher(gamePath: string, store?: string) {
        if (store === 'xbox') {
            return Promise.resolve({
                launcher: 'xbox',
                addInfo: {
                    appId: XBOX_ID,
                    parameters: [{ appExecName: ???? }],
                },
            });
        } else {
            return Promise.resolve(undefined);
        }
    }*/

    /** Function to auto-download USM from Nexus */
    public async downloadModLoader() {
        const api = this.api;
        const isInstalled = () => {
            const mods = api.getState().persistent.mods[GAME_ID] || {};
            return Object.keys(mods).some(id => mods[id]?.type === MODLOADER_ID);
        }

        let isDetected: boolean;
        const placeHolders = { modloader: MODLOADER_NAME, gameName: GAME_NAME };

        if (!isInstalled()) {

            try {
                const discovery: types.IDiscoveryResult = selectors.discoveryByGame(api.getState(), GAME_ID);
                if (!discovery || !discovery.path) {
                    return Promise.reject(new util.SetupError('Game is not discovered'));
                }

                await fs.statAsync(path.join(discovery.path, MODLOADER_FILE));

                if (util.getSafe(api.getState(), ['settings', GAME_ID, SET_IGNORE_ML_INST], false)) return;

                // this will just run if the above doesn't fail, otherwise skip to post catch
                const response = await this.api.showDialog('question', '{{modloader}} installation detected',
                    {
                        parameters: placeHolders,
                        text: `It seems you already have {{modloader}} installed manually. For a better management it's recommended to have it installed through Vortex.

Do you want it to be installed through here? Your current files will be backed up and can be reverted later.`,
                        options: {
                            translated: true
                        }
                    },
                    [
                        { label: 'Yes, install it' },
                        { label: 'No, keep the current' }
                    ],
                    'afop-dg-pre-modloader'
                );

                isDetected = true;

                if (response.action === 'No, keep the current') {

                    api.sendNotification({
                        type: 'info',
                        title: '{{modloader}} installation canceled',
                        message: `Your current files were kept and you won't be asked again.`,
                        replace: placeHolders
                    });

                    api.store.dispatch(this.setIgnoreMLInst(true));
                    return;
                }
            } catch (e) { }


            //notification indicating install process
            const NOTIF_ID = `${EXT_GAME_ID}-modloader-installing`;

            if (!isDetected)
                await this.api.showDialog('info', '{{modloader}} installation',
                    {
                        parameters: placeHolders,
                        md: `**{{modloader}}** is **required** to mod {{gameName}}. Vortex is going to try installing it automatically.

If you get a "Download Mod" prompt just click one of the download options. Your browser will open, just follow the steps to start the download.
When prompted, choose "Open Vortex" to finish the process.`,
                        options: {
                            translated: true
                        }
                    },
                    [
                        { label: 'Continue', default: true }
                    ],
                    'afop-dg-modloader'
                );


            api.sendNotification({
                replace: placeHolders,
                id: NOTIF_ID,
                message: 'Installing {{modloader}}',
                type: 'activity',
                progress: 0,
                noDismiss: true,
                allowSuppress: false,
            });

            //make sure user is logged into Nexus Mods account in Vortex
            if (api.ext?.ensureLoggedIn !== undefined) {
                await api.ext.ensureLoggedIn();
            }

            try {
                //use the FILE_ID directly for the correct game store version
                let nxmUrl: string;
                try {
                    //get the mod files information from Nexus
                    const modFiles: IFileInfo[] = await api.ext.nexusGetModFiles(GAME_ID, MODLOADER_PAGE_NO);
                    const fileTime = (input: IFileInfo) => Number.parseInt(input.uploaded_time, 10);

                    const file = modFiles
                        .filter(file => file.category_id === 1)
                        .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];
                    if (file === undefined) {
                        throw new util.ProcessCanceled(this.t('No {{modloader}} main file found', { replace: placeHolders, ns: NS }));
                    }

                    nxmUrl = `nxm://${GAME_ID}/mods/${MODLOADER_PAGE_NO}/files/${file.file_id}`;
                } catch (e) { // use defined file ID if input is undefined above
                    nxmUrl = `nxm://${GAME_ID}/mods/${MODLOADER_PAGE_NO}/files/${MODLOADER_FILE_NO}`;
                }

                api.sendNotification({
                    replace: placeHolders,
                    id: NOTIF_ID,
                    message: 'Installing {{modloader}}',
                    progress: 50,
                    type: 'activity'
                });

                //Download the mod
                const dlInfo = { game: GAME_ID, name: MODLOADER_NAME };
                const dlId = await util.toPromise(cb =>
                    api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, undefined, { allowInstall: false }));
                const modId = await util.toPromise(cb =>
                    api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));

                const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
                const batched = [
                    actions.setModsEnabled(api, profileId, [modId], true, {
                        allowAutoDeploy: true,
                        installed: true,
                    } as types.IEnableOptions),
                    //  actions.setModType(GAME_ID, modId, MODLOADER_ID), //installer takes care of this
                ];
                util.batchDispatch(api.store, batched); // Will dispatch both actions.

            } catch (err) {
                //UserCanceled: canceled by user  skipped: true
                //UserCanceled: canceled by user  skipped: false

                if ((err as Error).message === 'canceled by user') {
                    api.sendNotification({
                        id: `${EXT_GAME_ID}-modloader-canceled`,
                        type: 'warning',
                        title: '{{modloader}} installation canceled',
                        message: `{{modloader}} is required to mod {{gameName}}.

You can try installing it manually later.

The installation will be retried on the next load.`,
                        actions: [
                            {
                                title: 'Open mod page',
                                action: () => util.opn(`https://www.nexusmods.com/${GAME_ID}/mods/${MODLOADER_PAGE_NO}/files/?tab=files`).catch(() => undefined),
                            },
                        ],
                        replace: placeHolders
                    });
                } else {
                    //Show the user the download page if the download, install process fails
                    api.showErrorNotification('Failed to download/install {{modloader}}', err, { allowReport: true, replace: placeHolders });
                }

            } finally {
                api.dismissNotification(NOTIF_ID);
            }
        }
    }



    /** Installer test for USM files */
    private testModLoader(files: string[], gameId: string): Promise<types.ISupportedResult> {
        const supported = (gameId === GAME_ID) && (files.some(file => path.basename(file).toLowerCase() === MODLOADER_FILE));
        return Promise.resolve({ supported, requiredFiles: [MODLOADER_CFG] } as types.ISupportedResult);
    }

    /** Installer install USM files */
    private installModLoader(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        const modFile = files.find(file => path.basename(file).toLowerCase() === MODLOADER_FILE);
        const idx = modFile.indexOf(path.basename(modFile));
        const rootPath = path.dirname(modFile);

        // Remove directories and anything that isn't in the rootPath.
        const filtered = files.filter(file =>
            (rootPath === '.')
                ? !file.includes(path.sep)
                : file.includes(`${rootPath}${path.sep}`) && !file.endsWith(path.sep)
        );

        const instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: file.substring(idx),
            } as types.IInstruction;
        });
        instructions.push({ type: 'setmodtype', value: MODLOADER_ID });

        return Promise.resolve({ instructions } as types.IInstallResult);
    }


    /** Test for config files */
    private testConfig(files: string[], gameId: string): Promise<types.ISupportedResult> {
        const supported = (gameId === GAME_ID) && (files.some(file => path.extname(file).toLowerCase() === CONFIG_EXT));
        return Promise.resolve({ supported, requiredFiles: /*CONFIG_FILES*/[] } as types.ISupportedResult);
    }

    /** Install config files */
    private installConfig(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        const modFile = files.find(file => path.extname(file).toLowerCase() === CONFIG_EXT);
        const idx = modFile.indexOf(path.basename(modFile));
        const rootPath = path.dirname(modFile);

        // Remove directories and anything that isn't in the rootPath.
        const filtered = files.filter(file =>
            (rootPath === '.')
                ? !file.includes(path.sep)
                : file.includes(`${rootPath}${path.sep}`) && !file.endsWith(path.sep)
        );

        const instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: file.substring(idx),
            } as types.IInstruction;
        });
        instructions.push({ type: 'setmodtype', value: CONFIG_ID });

        return Promise.resolve({ instructions } as types.IInstallResult);
    }


    /** Test for mod files */
    private testData(files: string[], gameId: string): Promise<types.ISupportedResult> {
        const supported = (gameId === GAME_ID) && (files.some(file => DATA_EXTS.includes(path.extname(file).toLowerCase())));
        return Promise.resolve({ supported, requiredFiles: [] } as types.ISupportedResult);
    }

    /** Install mod files */
    private async installData(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        return await DataInstaller.instance(this.api).installData(files, gameId, packageFile, destinationPath);
    }


    /** Test for modloader scripts */
    private testPlugin(files: string[], gameId: string): Promise<types.ISupportedResult> {
        const supported = (gameId === GAME_ID) && (files.some(file => PLUG_EXTS.includes(path.extname(file).toLowerCase())));
        return Promise.resolve({ supported, requiredFiles: [] } as types.ISupportedResult);
    }

    /** Install modloader scripts files */
    private installPlugin(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        const modFile = files.find(file => PLUG_EXTS.includes(path.extname(file).toLowerCase()));
        const rootPath = path.dirname(modFile);

        // Remove directories and anything that isn't in the rootPath.
        const filtered = files.filter(file => !file.endsWith(path.sep));

        const instructions = filtered.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: (rootPath === '.')
                    ? `${PLUG_PATH}${path.sep}${file}`
                    : ((rootPath.indexOf(PLUG_PATH) > 0)
                        ? file.replace(`${path.dirname(rootPath)}${path.sep}`, '')
                        : file
                    )
            } as types.IInstruction;
        });
        instructions.push({ type: 'setmodtype', value: PLUG_ID });

        return Promise.resolve({ instructions } as types.IInstallResult);
    }

    /** Test for Reshade files */
    private testReshade(files: string[], gameId: string): Promise<types.ISupportedResult> {
        const supported = (gameId === GAME_ID) && (files.some(file => RESH_EXTS.includes(path.extname(file).toLowerCase())));
        return Promise.resolve({ supported, requiredFiles: [] } as types.ISupportedResult);
    }

    /** Install Reshade files (for now just notifies it's not supported) */
    private async installReshade(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        await this.api.showDialog('info', 'Reshade presets not supported',
            {
                text: 'The support for Reshade presets will be implemented in a future version. The installation will be canceled.',
                options: {
                    translated: true
                },
            },
            [
                { label: 'OK', default: true }
            ],
            'afop-dg-reshade'
        );

        return Promise.reject(new util.ProcessCanceled('Reshade presets not implemented yet.'));
    }

    /** Catch-all to prevent installing unknown stuff */
    private testUnknown(files: string[], gameId: string): Promise<types.ISupportedResult> {
        return Promise.resolve({ supported: true, requiredFiles: [] })
    }

    /** 
     * "Installer" to prevent installing unknown stuff.
     * It can also catch legit mods not yet supported by this extension.
     */
    private async installUnknown(files: string[], destinationPath: string, gameId: string,
        progressDelegate: types.ProgressDelegate, choices?: any,
        unattended?: boolean, packageFile?: string): Promise<types.IInstallResult> {

        await this.api.showDialog('error', 'File not recognized or mod type not implemented',
            {
                text: `The file you tried to install was not recognized as any of the supported mod types, has not been implemented yet, or is not a mod file.

If you feel this is an error, please report it to the extension author. The installation will be canceled.`,
                options: {
                    translated: true
                },
                links: [
                    {
                        label: 'Report a bug', action(dismiss, id) {
                            util.opn('https://nexusmods.com/site/mods/1237?tab=bugs').catch(() => undefined);
                        },
                    }
                ],
            },
            [
                { label: 'OK', default: true }
            ],
            'afop-dg-unknown'
        );

        return Promise.reject(new util.ProcessCanceled('Mod type not implemented yet.'));
    }

    /** 
     * Set mods installed with the older versions to the proper mod types.
     * (The first versions didn't set any mod type)
     * @see {@link types.IExtensionContext.registerMigration} 
     */
    private async migration(oldVersion: string) {
        if (semver.gte(oldVersion, '1.0.0')) {
            return Promise.resolve();
        }

        const mods: { [modId: string]: types.IMod } = util.getSafe(this.api.getState(), ['persistent', 'mods', GAME_ID], {});
        const modIds = Object.keys(mods).filter(modId => mods[modId].type === '');
        const batched = modIds.map(modId => actions.setModType(GAME_ID, modId, DATA_ID));

        if (batched.length > 0) {
            try {
                log('info', 'Migrating mods to known base type.', { mods: batched.length });
                await this.api.awaitUI();
                util.batchDispatch(this.api.store, batched);
                log('info', 'Migrating mods to known base type done.', { mods: batched.length });
            } catch (err) {
                log('error', 'Failed to migrate mods to known base type.', { err });
                this.api.showErrorNotification('Failed to migrate mods to known base type.', err, { allowReport: true });
            }
        }
        return Promise.resolve();
    }

    /*private async deploymentGate(): Promise<void> { //use this for variation based on file names?
        return Promise.resolve();
    }*/
}

//export to Vortex
export default function main(context: types.IExtensionContext) {
    //This is the main function Vortex will run when detecting the game extension. 

    const ext = AFOPExt.instance(context);
    return true;
}