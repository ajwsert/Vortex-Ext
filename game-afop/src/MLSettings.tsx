/*
Name: Avatar: Frontiers of Pandora Vortex Extension
Structure: Ubisoft Root Folder
Author: shadowsiam
Version: 1.0.3
Date: 10/26/2025
*/

import React, { useState, useEffect, PropsWithChildren } from 'react';
import { Toggle, MainPage, FlexLayout, fs } from 'vortex-api';
import { ControlLabel, FormGroup, HelpBlock, Panel, FormControl, Alert, Button, Glyphicon } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import ini from 'ini';

import { MODLOADER_NAME, MODLOADER_CFG, NS } from './metadata';

//https://react-bootstrap-v3.netlify.app/components/alerts/

type PriorityTypes = 'normal' | 'medium' | 'high';
type IOPriorityTypoes = 'normal' | 'high';

type Config = {
    Settings: {
        EnableMods: boolean,
        EnableScripts: boolean
    },
    DiskCacheEnabler: {
        CreateFileA: boolean,
        CreateFileW: boolean
    },
    Priorities: {
        CPUPriority: PriorityTypes,
        IOPriority: IOPriorityTypoes,
        ThreadPriority: PriorityTypes
    }
} | undefined;

export type MLSettingsProps = { iniPath: string } & PropsWithChildren;

export default function MLSettings(props: MLSettingsProps) {
    const { iniPath } = props;
    const { t } = useTranslation(NS);

    const [disableCfg, setDisableCfg] = useState(true);
    const [errorCfg, setErrorCfg] = useState(false);

    const [enableMods, setEnableMods] = useState(true);
    const [enableScripts, setEnableScripts] = useState(true);
    const [cacheCFileA, setCacheCFileA] = useState(true);
    const [cacheCFileW, setCacheCFileW] = useState(true);
    const [CPUPriority, setCPUPriority] = useState<PriorityTypes>('high');
    const [IOPriority, setIOPriority] = useState<IOPriorityTypoes>('high');
    const [ThreadPriority, setThreadPriority] = useState<PriorityTypes>('high');

    const loadPage = async () => {
        try {
            const file: string = await fs.readFileAsync(iniPath, { encoding: 'utf8' });
            const config: Config = ini.parse(file) as Config;

            setEnableMods(config.Settings.EnableMods);
            setEnableScripts(config.Settings.EnableScripts);
            setCacheCFileA(config.DiskCacheEnabler.CreateFileA);
            setCacheCFileW(config.DiskCacheEnabler.CreateFileW);
            setCPUPriority(config.Priorities.CPUPriority);
            setIOPriority(config.Priorities.IOPriority);
            setThreadPriority(config.Priorities.ThreadPriority);

            setDisableCfg(false);
        } catch (e) {
            //setDisableCfg(true);
            setErrorCfg(true);
        }
    }

    useEffect(() => {
        loadPage();
    }, []);

    const setValue = async (elemID: string, val: any) => {
        const config: Config = {
            Settings: {
                EnableMods: enableMods,
                EnableScripts: enableScripts
            },
            DiskCacheEnabler: {
                CreateFileA: cacheCFileA,
                CreateFileW: cacheCFileW
            },
            Priorities: {
                CPUPriority: CPUPriority,
                IOPriority: IOPriority,
                ThreadPriority: ThreadPriority
            }
        };

        switch (elemID) {
            case 'mods':
                setEnableMods(val);
                config.Settings.EnableMods = val;
                break;
            case 'scripts':
                setEnableScripts(val);
                config.Settings.EnableScripts = val;
                break;
            case 'cacheA':
                setCacheCFileA(val);
                config.DiskCacheEnabler.CreateFileA = val;
                break;
            case 'cacheW':
                setCacheCFileW(val);
                config.DiskCacheEnabler.CreateFileW = val;
                break;
            case 'cpuPri':
                setCPUPriority(val as PriorityTypes);
                config.Priorities.CPUPriority = val;
                break;
            case 'ioPri':
                setIOPriority(val as IOPriorityTypoes);
                config.Priorities.IOPriority = val;
                break;
            case 'thrPri':
                setThreadPriority(val as PriorityTypes);
                config.Priorities.ThreadPriority = val;
                break;
        }

        try {
            setDisableCfg(true);
            await fs.writeFileAsync(iniPath, ini.stringify(config), { encoding: 'utf8' });
            setDisableCfg(false);
        } catch (e) {
            setDisableCfg(true);
            setErrorCfg(true);
        }
    };

    const replace = { modloader: MODLOADER_NAME };

    return (
        // @ts-ignore: Weird unknown error
        <MainPage>
            <MainPage.Body>
                <FlexLayout type="column">
                    <FlexLayout.Fixed id="title">
                        <h2>{t('{{modloader}} Settings', { replace })}</h2>
                    </FlexLayout.Fixed>
                    <FlexLayout.Fixed id="settings" style={{ overflow: 'auto', paddingRight: '10px' }}>
                        {errorCfg
                            ? (<Alert bsStyle="danger"><Glyphicon glyph="warning" />
                                <h4>{t('Error reading the settings file')}</h4>
                                <p>
                                    {t('There was an error fetching these options from "{{ini}}". Check if you have "{{modloader}}" properly installed and enabled then click "Retry".',
                                        { replace: { ...replace, ini: MODLOADER_CFG } }
                                    )}
                                </p>
                                <p>
                                    <Button bsStyle="warning" onClick={() => {
                                        setErrorCfg(false);
                                        loadPage();
                                    }}>
                                        {t('Retry')}
                                    </Button>
                                </p>
                            </Alert>)
                            : (
                                <form>
                                    <Panel style={{ marginBottom: '12px' }}>
                                        <Panel.Heading>{t('General Settings')}</Panel.Heading>
                                        <Panel.Body>
                                            <FormGroup controlId='enableMods'>
                                                <Toggle
                                                    disabled={disableCfg}
                                                    checked={enableMods}
                                                    onToggle={(v: any) => setValue('mods', v)}
                                                >
                                                    {t('Enable Mods')}
                                                </Toggle>
                                                <HelpBlock>
                                                    {t('Enables mod support.')}
                                                </HelpBlock>
                                            </FormGroup>
                                            <FormGroup controlId='enableScripts'>
                                                <Toggle
                                                    disabled={disableCfg}
                                                    checked={enableScripts}
                                                    onToggle={(v: any) => setValue('scripts', v)}
                                                >
                                                    {t('Enable Scripts')}
                                                </Toggle>
                                                <HelpBlock>
                                                    {t('Enables loading DLL/ASI scripts.')}
                                                </HelpBlock>
                                            </FormGroup>
                                        </Panel.Body>
                                    </Panel>
                                    <Panel style={{ marginBottom: '12px' }}>
                                        <Panel.Heading>{t('Disk Cache Enabler')}</Panel.Heading>
                                        <Panel.Body>
                                            <p>{t("{{modloader}} also enables the use of Windows's file caching, which should result in less hard drive activity over time.", { replace })}<br />
                                                {t('This may allow the game to run on HDDs and should also result in slightly better SSD performance as well.')}</p>
                                            <FormGroup controlId='cacheCFileA'>
                                                <Toggle
                                                    disabled={disableCfg}
                                                    checked={cacheCFileA}
                                                    onToggle={(v: any) => setValue('cacheA', v)}
                                                >
                                                    CreateFileA
                                                </Toggle>
                                                <HelpBlock>
                                                    {t('Enables disk caching during calls to CreateFileA.')}
                                                </HelpBlock>
                                            </FormGroup>
                                            <FormGroup controlId='cacheCFileW'>
                                                <Toggle
                                                    disabled={disableCfg}
                                                    checked={cacheCFileW}
                                                    onToggle={(v: any) => setValue('cacheW', v)}
                                                >
                                                    CreateFileW
                                                </Toggle>
                                                <HelpBlock>
                                                    {t('Enables disk caching during calls to CreateFileW.')}
                                                </HelpBlock>
                                            </FormGroup>
                                        </Panel.Body>
                                    </Panel>
                                    <Panel>
                                        <Panel.Heading>{t('Priorities')}</Panel.Heading>
                                        <Panel.Body>
                                            <p>{t(`For additional speed, {{modloader}} allows you to set the CPU, I/O, and thread priorities to high, 
reducing stuttering and lag spikes due to other processes in the background.`, { replace })}</p>
                                            <FlexLayout type="row">
                                                <FlexLayout.Fixed style={{ marginRight: '20px' }}>
                                                    <FormGroup controlId='cpu-priority'>
                                                        <ControlLabel>{t('CPU Priority')}</ControlLabel>
                                                        <FormControl
                                                            disabled={disableCfg}
                                                            componentClass='select'
                                                            defaultValue=''
                                                            value={CPUPriority}
                                                            onChange={(e) => setValue('cpuPri', (e.target as HTMLSelectElement).value)}
                                                        >
                                                            <option value='normal'>{t('Normal')}</option>
                                                            <option value='medium'>{t('Medium')}</option>
                                                            <option value='high'>{t('High')}</option>
                                                        </FormControl>
                                                        <HelpBlock>
                                                            {t('Sets the priority level of the CPU.')}
                                                        </HelpBlock>
                                                    </FormGroup>
                                                </FlexLayout.Fixed>
                                                <FlexLayout.Fixed style={{ marginRight: '20px' }}>
                                                    <FormGroup controlId='io-priority'>
                                                        <ControlLabel>{t('IO Priority')}</ControlLabel>
                                                        <FormControl
                                                            disabled={disableCfg}
                                                            componentClass='select'
                                                            defaultValue=''
                                                            value={IOPriority}
                                                            onChange={(e) => setValue('ioPri', (e.target as HTMLSelectElement).value)}
                                                        >
                                                            <option value='normal'>{t('Normal')}</option>
                                                            <option value='high'>{t('High')}</option>
                                                        </FormControl>
                                                        <HelpBlock>
                                                            {t('Sets the priority level of the IO.')}
                                                        </HelpBlock>
                                                    </FormGroup>
                                                </FlexLayout.Fixed>
                                                <FlexLayout.Fixed>
                                                    <FormGroup controlId='thread-priority'>
                                                        <ControlLabel>{t('Thread Priority')}</ControlLabel>
                                                        <FormControl
                                                            disabled={disableCfg}
                                                            id='thrPri'
                                                            componentClass='select'
                                                            defaultValue=''
                                                            value={ThreadPriority}
                                                            onChange={(e) => setValue('thrPri', (e.target as HTMLSelectElement).value)}
                                                        >
                                                            <option value='normal'>{t('Normal')}</option>
                                                            <option value='medium'>{t('Medium')}</option>
                                                            <option value='high'>{t('High')}</option>
                                                        </FormControl>
                                                        <HelpBlock>
                                                            {t('Sets the priority level of threads.')}
                                                        </HelpBlock>
                                                    </FormGroup>
                                                </FlexLayout.Fixed>
                                            </FlexLayout>
                                        </Panel.Body>
                                    </Panel>
                                </form>
                            )}
                    </FlexLayout.Fixed>
                </FlexLayout>
            </MainPage.Body>
        </MainPage>
    );
}
