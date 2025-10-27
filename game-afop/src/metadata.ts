/*
Name: Avatar: Frontiers of Pandora Vortex Extension
Structure: Ubisoft Root Folder
Author: shadowsiam
Version: 1.0.3
Date: 10/26/2025
*/

import path from 'path';
import { util } from 'vortex-api';

export const EXT_VER = '1.0.3';
export const EXT_GAME_ID = 'afop';

//Specify all the information about the game
/** Nexus Mods domain for the game. e.g. nexusmods.com/avatarfrontiersofpandora */
export const GAME_ID = 'avatarfrontiersofpandora';

/** Ubisoft+ Version exe ID */
export const PLUS_ID = 'AFOPUbiPlus';
/** Ubisoft Connect Application ID */
export const UPLAYAPP_ID = '4740';
/** Steam Application ID, you can get this from https://steamdb.info/apps/ */
export const STEAMAPP_ID = '2840770';
/** Epic Games Application ID */
export const EPICAPP_ID = '7e1b95ee07784fd3bc9a24331718a9e7';
/** Windows Store (Xbox) App ID */
//export const XBOX_ID = '???';

export const EXEC = 'afop.exe';
export const EXEC_PLUS = 'afop_plus.exe';
export const GAME_NAME = 'Avatar: Frontiers of Pandora';
export const GAME_NAME_SHORT = 'Avatar: F. of Pandora';
export const NS = 'game-avatar-frontiers-of-pandora';

//Info for mod types and installers
export const CONFIG_ID = `${EXT_GAME_ID}-config`;
export const CONFIG_PATH = path.join(util.getVortexPath('documents'), 'My Games', 'AFOP');
export const CONFIG_FILES = ['graphic settings.cfg'];
export const CONFIG_EXT = '.cfg';

export const DATA_ID = `${EXT_GAME_ID}-data`;
export const DATA_PATH = 'blue';
export const DATA_MODTYPES = {
    blue: { id: DATA_ID, path: DATA_PATH, name: 'Game mod' },
    dlc1: { id: `${EXT_GAME_ID}-dlc1-data`, path: 'dlc1', name: 'Game mod (dlc1)' },
    dlc2: { id: `${EXT_GAME_ID}-dlc2-data`, path: 'dlc2', name: 'Game mod (dlc2)' },
    //dlc3: { id: `${EXT_GAME_ID}-dlc3-data`, path: 'dlc3', name: 'Game mod (dlc3)' },
}
export const DATA_EXTS = ['.achievementsinfo', '.af', '.afms', '.airfield', '.airfieldms', '.ammotypesinfo', '.anim', '.attributedatastatsinfo', '.bakedscattersector',
    '.bakedvistasector', '.bansheenamesinfo', '.biksolver', '.bin', '.bk2', '.blackboardvariablesinfo', '.blueaicollisiondamage', '.blueaiperception',
    '.blueaipersonality', '.blueitemtype', '.blueodgroupelement', '.bnk', '.bnvib', '.bpanimations', '.bpbindings', '.bpcontrolgraph', '.bpcontrolpoint',
    '.bpexecutionpoint', '.camosettingsinfo', '.cer', '.characteraudiodata', '.charactersinfo', '.ciceroinfo', '.codexentriesinfo', '.collectiblesinfo',
    '.config', '.cookingingredientsinfo', '.craftingcategoriesinfo', '.craftingconfigurationsinfo', '.craftingrecipesinfo', '.currencydefinitionsinfo',
    '.dat', '.dds', '.destructionfrags', '.dialogueobjectsinfo', '.dynamiccampaignconfigsinfo', '.dynamiccampaignvillainsinfo', '.dynamicpropspawnsinfo',
    '.editordata', '.emotesinfo', '.ems', '.factionsinfo', '.fanimrl', '.festivalchallengesinfo', '.festivalsinfo', '.fishingrewardoverride',
    '.flyzonekeysinfo', '.fontmetrics', '.fontprohibited', '.fruit', '.fx', '.gameplaystatisticsinfo', '.gfd', '.h', '.healthstatboostsourcesinfo',
    '.hlsl', '.hlsli', '.interaction', '.interactionmk', '.interactiontypesinfo', '.itemsinfo', '.journaldescriptionentriesinfo', '.journalentriesinfo',
    '.juice', '.landmarknpcslotsinfo', '.landmarksinfo', '.landmarkstagesinfo', '.landmarktypesinfo', '.layout', '.levelsinfo', '.locpack', '.locpackbin',
    '.longdistancesound', '.lootsourcesinfo', '.m3rdpersoncamsettings', '.machievement', '.maiaimprofile', '.maimassistfilters', '.manimevent',
    '.manimmetrics', '.manimsubsys', '.manimsubsyslight', '.manimsync', '.manimsys', '.manimsysbin', '.manimsyslight', '.map', '.mattrib', '.mbakedaniminfo',
    '.mbakedlevel', '.mballistic', '.mbansheepatterndata', '.mbattlecry', '.mbcfg', '.mbeastmasterrules', '.mbehavior', '.mbehaviormodules',
    '.mblackboardset', '.mblackboardvariable', '.mbookmarks', '.mbucket', '.mbulletmagnet', '.mbvh', '.mbytecode', '.mcache', '.mcapscript',
    '.mcharacterdatabase', '.mcharacterdialogueanimpool', '.mcharacterinitialslotconditions', '.mclanchallenge', '.mclass', '.mclientbotscript',
    '.mclientscript', '.mcloth', '.mcollectible', '.mcolorpattern', '.mcompoundnode', '.mconstructiongraph', '.mconsumableitemsetup', '.mcraftingconfig',
    '.mcraftingrecipe', '.mcraftingrecipelist', '.mcurrency', '.mdialoguegraph', '.mdialoguescript', '.mdict', '.mdna', '.mdronecontrollersettings',
    '.mdynamiccampaignconfig', '.mdynamiccampaignvillain', '.mdynamicpropspawninfo', '.melementalvfxpack', '.memote', '.mencountercortexregionsettings',
    '.menvironment', '.meta', '.meyeexpressionprofile', '.mfightersettings', '.mfireteamsynergy', '.mflightintersectioneffects', '.mflyinglocomotionprofile', '.mflyzonekey',
    '.mfpactivity', '.mgameplayeffectgroup', '.mgameplaystatistics', '.mgenericinteraction', '.mgraphobject', '.mharvestableconfig', '.mimpostor',
    '.minteractionsetup', '.minterfacegraph', '.mitem', '.mjournal', '.mkeybinds', '.mlandmarktypes', '.mlayer', '.mlevel', '.mlightprobe', '.mloadingtip',
    '.mlooseitems', '.mlootchart', '.mlootqualitychart', '.mloottable', '.mlootweightchart', '.mmatdb', '.mmaterial', '.mmb', '.mmdshader', '.mmeditation',
    '.mmotionpattern', '.mmotionpatternprofile', '.mnpc', '.mnpcproceduralrotationdata', '.mnurbs', '.mobjdescsetup', '.modhierarchy', '.moffer', '.mofferspool',
    '.mparticledistribution', '.mparticles', '.mpatchnotes', '.mpatterncontrol', '.mpatterndata', '.mphys', '.mplayerweapon', '.mplayerweapondata', '.mpricing',
    '.mprojectilehitresult', '.mpropdecal', '.mqualityattributecorestat', '.mqualityattributecorestatpreset', '.mqualityattributesecondarystat',
    '.mqualityattributesecondarystatpreset', '.mquest', '.mquestbrain', '.mquestobjective', '.mragdoll', '.mrampupdown', '.mrecoil', '.mreflex',
    '.mreinforcementsettings', '.mreplay', '.mretuigraph', '.mreward', '.mrumblelibrary', '.mrumbletriggerlibrary', '.mscannablequestclue', '.mscattergraph',
    '.msciencedatatype', '.mscript', '.msequence', '.mserverscript', '.msh', '.mshader', '.mshadergraph', '.mshaders', '.msongcordbead', '.msoothingpreset',
    '.mspline', '.msplinebake', '.mspread', '.mstat', '.mstatpresetlist', '.mtalent', '.mtalentrules', '.mtalenttree', '.mtargetspots', '.mtemplate',
    '.mterrain', '.mterraindatadef', '.mterraindecals', '.mterrainsettings', '.mthrowableballisticconfig', '.mtoolaimassistdata', '.mtutorial',
    '.mubiconnectreward', '.mubicorechallenge', '.muigraph', '.muiprefab', '.mvar', '.mvendorchallenge', '.mvendorconfig', '.mvtmat', '.mwatersettings',
    '.mweapon', '.mweaponsettings', '.mweather', '.mweathercondition', '.mwidget', '.navmesh', '.navmeshbin', '.navmeshinfo', '.navmeshinplace', '.navserver', '.navvolume',
    '.navvolumeinplace', '.nb', '.ni', '.nm', '.noflyzonesinfo', '.npcarchetypesinfo', '.npcconfigsinfo', '.ns', '.nv', '.nvi', '.objectdescriptorsinfo',
    '.objspawnleveldata', '.ogg', '.openworldactivitiesinfo', '.otf', '.partialragdollprofile', '.pesworldmasklayerconfig', '.pggterrainmaterial',
    '.pilotconfig', '.playableareavolumesinfo', '.pointsofinterestinfo', '.poses', '.prefabs', '.propinteraction', '.questentitiesinfo', '.questsinfo',
    '.regionsinfo', '.rejuice', '.rewardsinfo', '.rlcdc', '.rmd', '.sector', '.seqanim', '.seqcam', '.sounddata', '.seqfolder', '.serveranim', '.sif', '.simskel', '.skin',
    '.songcordbeadsinfo', '.spawnpointsinfo', '.spritesheet', '.ssb', '.statisticrewardsinfo', '.subregionsinfo', '.talentsinfo', '.toolattachmentsinfo',
    '.trainerconfigsinfo', '.trainerrewardsinfo', '.var', '.varmap', '.vendorconfigsinfo', '.vendorsectionitementriesinfo', '.vendorsectionsinfo',
    '.virtualagentinitialownersinfo', '.wem'];
export const DATASUB_FOLDERS = ['baked', 'graph objects', 'game system data',
    'animation', 'audio', 'baked_maps', 'behaviorplanner', 'blackboard', 'capscripts',
    'characterart', 'character_dialogue_anim_pools', 'console scripts', , 'export constructiongraph',
    'export construction_graphs', 'debugimgui', 'dialoguegraphs', 'dialoguescript', 'environment',
    'gameplay', 'global variables', 'interaction', 'interactionmk', 'landmark', 'localization',
    'maps', 'materials', 'modules', 'nodes', 'packaging', 'particles', 'rogue', 'scatter_systems',
    'scripts', 'sequence', 'shaders', 'sound', 'spline', 'tag_repository', 'templates',
    'template_icons', 'ui', 'uiddata', 'unsorted', 'voice', 'vtmaterials', 'vt_material_dbs'
];

export const PLUG_ID = `${EXT_GAME_ID}-plugin`;
export const PLUG_PATH = 'plugins';
export const PLUG_EXTS = ['.asi'];

export const RESH_ID = `${EXT_GAME_ID}-reshade`;
export const RESH_PATH = '.';
export const RESH_EXTS = ['.ini', '.fx', '.fxh'];
export const RESH_FOLDERS = ['reshade-shaders'];

export const MODLOADER_ID = `${EXT_GAME_ID}-modloader`;
export const MODLOADER_FILE = 'version.dll';
export const MODLOADER_CFG = 'version.ini';
export const MODLOADER_NAME = 'Universal Snowdrop Modloader';
export const MODLOADER_PAGE_NO = 20;
export const MODLOADER_FILE_NO = 396;

/** Flag to suppress the reminder about installing USM */
export const SET_IGNORE_ML_INST = 'ignoreModloaderInstall';