<div id="top" align="center">
    <br>
    <a href="https://github.com/KatsuteDev/Settings-Repository#readme">
        <img src="https://raw.githubusercontent.com/KatsuteDev/Settings-Repository/main/assets/icon.png" alt="icon" width="100" height="100">
    </a>
    <h3>Settings Repository</h3>
    <h4>Sync VSCode settings to a repository</h4>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.settings-repository"><img src="https://img.shields.io/visual-studio-marketplace/stars/katsute.settings-repository?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.settings-repository"><img src="https://img.shields.io/visual-studio-marketplace/i/katsute.settings-repository?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.settings-repository"><img src="https://img.shields.io/visual-studio-marketplace/d/katsute.settings-repository?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF"></a>
</div>

<br>

Sync VSCode settings, extensions, keybindings, and more to a git repository.

## Installation

> ⚠️ This extension is not compatible with remote distributions of VSCode (ex: Codespaces). Pull your settings from VSCode on desktop then use the [**Settings Sync**](https://code.visualstudio.com/docs/editor/settings-sync) that is included with VSCode.

This extension requires [git](https://git-scm.com/downloads) to be installed.

#### VSCode Marketplace (recommended)

 1. Install from `katsute.settings-repository` in the extension marketplace in Visual Studio Code or install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=katsute.settings-repository).

#### Manual

 1. Install the latest release from the [releases](https://github.com/KatsuteDev/Settings-Repository/releases) tab.
 2. Open Visual Studio Code in the folder with the extension.
 3. Right click the extension and select **Install Extension VSIX**.

## &nbsp;

Run `Settings Repository: Choose Settings Repository` and select `Repository` to setup and authenticate with a repository, make sure you have your access token ready.

For classic tokens, make sure you have [**repo**] selected.

For fine grained tokens, make sure you have [**Read** and **Write** access to code] enabled.

By default this extension will use the `main` branch, if you are using a different branch make sure it has already been created before you push.

Logging information is located in the lower panel under `Output > Settings Repository`.

<div align="right"><a href="#top"><code>▲</code></a></div>

## Features

#### Extension Sync

Sync all of the extensions that you use, including disabled ones.
Currently the enabled/disabled state of extensions can not be toggled (see [microsoft/vscode#15466](https://github.com/microsoft/vscode/issues/15466#issuecomment-724147661)), extensions will be enabled/disabled based on the local settings.

#### Settings Sync

Sync your settings and snippets wherever you use VSCode.

#### Keybindings Sync

Sync keybindings between Windows and Mac, automatically swaps between <kbd>ctrl</kbd> and <kbd>⌘</kbd>.

#### Locale Sync

Sync the language that VSCode uses. Requires a restart to see changes.

#### Repository Sync

Use any git repository to backup your settings. For private repositories make sure your token is scoped correctly. Branch must already exist.

#### Import / Export to ZIP

Share copies of your settings without needing a repository.
Use `Settings Repository: Export Settings` to export settings to a zip file and use `Settings Repository: Import Settings` to import settings from a zip file.

<div align="right"><a href="#top"><code>▲</code></a></div>

## Commands

| Command | Description |
|---|---|
|`Settings Repository: Options`|Menu to access commands for this extension. Can be accessed by clicking `Settings Repository` on the statusbar.|
|`Settings Repository: Choose Settings Repository`|Menu to access repository options and commands.|
|`Settings Repository: Authenticate`|Update git authentication.|
|`Settings Repository: Overwrite Local`|Overwrite local settings with ones from the git repository.|
|`Settings Repository: Overwrite Remote`|Overwrite settings on the git repository with ones stored locally.
|`Settings Repository: Import Settings`|Import settings from a zip file.|
|`Settings Repository: Export Settings`|Export settings to a zip file.|

<div align="right"><a href="#top"><code>▲</code></a></div>

## Configuration

| Name | Type | Description |
|---|:-:|---|
|`settings-repository.repository`|`string`|The git repository to sync settings with.|
|`settings-repository.branch`|`string`|The branch to sync settings with. Branch must already exist.|
|`settings-repository.autoSync`|`boolean`|Automatically sync settings when VSCode closes.|
|`settings-repository.includeHostnameInCommitMessage`|`boolean`|Include hostname in the commit message.|

<div align="right"><a href="#top"><code>▲</code></a></div>

## &nbsp;

This extension is released under the [GNU General Public License (GPL) v2.0](https://github.com/KatsuteDev/Settings-Repository/blob/main/LICENSE).