# PennBook

## Overview

This is the NETS-212 final project (PennBook) for group G20, comprised of Charley Cunningham, Rohan Gupta, Max Tsiang, and Patrick Liu.

This application is a simple Facebook clone, built with scalability and security in mind.

## Google Drive

Project planning resources can be found in the [Google Drive folder](https://drive.google.com/drive/folders/1Ksb2dOLsyWlh0JNXp3SytOUi-KOCgm9Q?usp=sharing) for this project.

## Development Tips

This project has pre-commit hooks that runs eslint and tests. To configure eslint highlighting and auto-formatting in VSCode, you can add the following options to your VSCode settings.json file:

```json
{
    "eslint.format.enable": true,
    "editor.codeActionsOnSave": {
        "source.fixAll": true
    },
    "[javascript]": {
        "editor.tabSize": 2
    }
}
```
