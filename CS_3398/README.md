<img src="splash.png" alt="VidCat" width="500" height="500">


## Quick Links
1. [Installation](#installation)
1. [Usage](#usage)
1. [Known Defects](#known-defects)
1. [Collaborators](#collaborators)
1. [Getting Involved](#getting-involved)
1. [License](#license)

## Table of Contents
1. [Introduction](#introduction)
2. [Objectives](#objectives)
3. [Target Customers](#target-customers)
4. [Value Proposition](#value-proposition)
5. [Application, Features, and Description](#application-features-and-description)
6. [Technologies Used](#technologies-used)
7. [Installation](#installation)
8. [Usage](#usage)
9. [Known Defects](#known-defects)
10. [Collaborators](#collaborators)
11. [Getting Involved](#getting-involved)
12. [License](#license)

## Introduction
**vidCat** is designed to tackle a common problem encountered by drone enthusiasts and casual videographers: the inconvenience of devices like the DJI Mini 4 Pro drone splitting recorded videos into multiple clips. Existing solutions require bulky, complex software or technical expertise in CLI-based tools. **vidCat** offers a user-friendly, efficient solution for merging video clips into a single continuous file, making video editing accessible for everyone.

## Objectives
**vidCat** aims to provide a simple application that allows users to easily append their video clips into a single continuous video, without needing extensive editing knowledge or software. The key goals include:
- Creating a user-friendly environment for merging video clips.
- Offering a quick and efficient merging process to save users time.
- Ensuring accessibility for users with no prior video editing experience.

## Target Customers
**vidCat** caters to a broad audience that includes:
- **Hobbyist Drone Users**: Individuals using drones for recreational video recording.
- **Casual Videographers**: Users who need a simple tool to merge video clips from various devices.
- **Social Media Content Creators**: Individuals creating content for platforms like YouTube, Instagram, and TikTok.
- **Amateur Filmmakers**: Beginners in filmmaking who require a straightforward solution for video merging.

## Value Proposition
**vidCat** stands out by offering:
- **Simplicity**: Focuses solely on appending video clips, avoiding the complexities of advanced editing software.
- **Speed**: Ensures quick processing times, enhancing user productivity.
- **Accessibility**: Features an easy-to-use graphical interface suitable for non-professionals.
- **Unique Features**: Supports automatic clip detection and merging, high-resolution videos, and a minimalistic user interface to enhance user experience.

## Application, Features, and Description
**Minimum Viable Product (MVP) Features:**
- **Import Functionality**: Support for multiple video formats and resolutions, allowing users to select video clips directly from their device.
- **Merge Functionality**: Seamlessly merge the selected clips into a single continuous video file.
- **Export Functionality**: Save the merged video in various formats and resolutions, with options to choose the export destination.
- **Graphical Interface**: A clean, user-friendly interface for importing, merging, and exporting videos, designed for ease of use and minimal user interaction.

## Technologies Used
- **[Electron.js](https://www.electronjs.org/)**: Utilized for building a cross-platform desktop application.
- **[ffmpeg](https://ffmpeg.org/)**: A complete, cross-platform solution to record, convert, and stream audio and video.
- **[npm](https://www.npmjs.com/)**: A package manager for the JavaScript programming language, used for managing dependencies. Version 10.8.1.
- **[Bulma](https://bulma.io/)**: A modern CSS framework based on Flexbox. Version 1.0.1.
- **[Electron](https://www.electronjs.org/)**: A framework for building cross-platform desktop apps with JavaScript, HTML, and CSS. Version 31.0.2.
- **[Express](https://expressjs.com/)**: A fast, unopinionated, minimalist web framework for Node.js. Version 4.19.2.
- **[ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static)**: A static build of ffmpeg for use with Node.js. Version 5.2.0.
- **[ffprobe-static](https://www.npmjs.com/package/ffprobe-static)**: A static build of ffprobe for use with Node.js. Version 3.1.0.
- **[fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)**: A fluent API for ffmpeg. Version 2.1.3.

## Installation
1. Clone the repository
    ```bash
    git clone https://github.com/dogghoodie/CS_3398
    ```
2. Navigate to the project directory
    ```bash
    cd CS_3398
    ```
3. Install dependencies
    ```bash
    npm install
    ```

## Usage
- To start the project
    ```bash
    npm start
    ```

## Known Defects
- Concatenating audio and non-audio files
- Concatenating different resolutions is inconsistent
- Windows: drag & drop (doesn't work)
- Windows: file output definitions (needs additional handling because '/' is currently appended)

## Collaborators
- [Brandon Howell](https://github.com/bhow2)
- [Christopher Hanly](https://github.com/cmhrfx)
- [Jeffrey Kamal](https://github.com/jeffreykamal14)
- [Phillip Henry](https://github.com/zidelen)
- [Walker Knapp](https://github.com/dogghoodie)

## Getting Involved
Interested in contributing to **vidCat**? We welcome contributions from developers, designers, and video enthusiasts. Please contact us for more information on how you can help.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
