# cllama

A browser extension featuring deep content analysis of webpages via custom prompts, multi-scenario AI chat, and multilingual translation.

## Packaging and Installation

This section outlines how to package the cllama extension and how to install it in your browser.

### Packaging the Extension

The extension can be packaged using the `build.sh` script. This script prepares the necessary files for different browser environments and creates a distributable package.

To package the extension, navigate to the project's root directory in your terminal and run the `build.sh` script with the appropriate options:

*   **For Firefox:**
    ```bash
    ./build.sh
    ```
    This will generate a `cllama_firefox.xpi` file in the `dist/` directory.

*   **For Chrome (and other Chromium-based browsers like Edge):**
    ```bash
    ./build.sh --chrome
    ```
    This will generate a `cllama_chrome.zip` file in the `dist/` directory.

*   **For Firefox Android:**
    ```bash
    ./build.sh --android
    ```
    This will generate a `cllama_android.xpi` file in the `dist/` directory.

*   **Debug Mode (skips minification):**
    You can add the `--debug` flag to any of the above commands to skip JavaScript and CSS minification. This is useful for development and debugging:
    ```bash
    ./build.sh --chrome --debug
    ```

### Installing the Extension

Once packaged, you can install the cllama extension in two ways: through the respective browser marketplaces or by loading it locally.

#### Browser Marketplace Installation

It is recommended to install the extension directly from the official browser marketplaces for automatic updates and security.

*   **Firefox:**
    [https://addons.mozilla.org/firefox/addon/cllama](https://addons.mozilla.org/firefox/addon/cllama)

*   **Firefox for Android:**
    [https://addons.mozilla.org/en-US/firefox/addon/cllama-for-android/](https://addons.mozilla.org/en-US/firefox/addon/cllama-for-android/)

*   **Chrome:**
    [https://chromewebstore.google.com/detail/cllama/nfkhleipggbeadfdaonpjaggcpidjmka](https://chromewebstore.google.com/detail/cllama/nfkhleipggbeadfdaonpjaggcpidjmka)

*   **Microsoft Edge:**
    [https://microsoftedge.microsoft.com/addons/detail/cllama/icmndihododpogdmedoioieliaihlgbb](https://microsoftedge.microsoft.com/addons/detail/cllama/icmndihododpogdmedoioieliaihlgbb)

#### Local Installation (Developer Mode)

For local development or testing, you can load the packaged extension directly into your browser.

*   **Firefox:**
    1.  Open Firefox and type `about:debugging#/runtime/this-firefox` in the address bar.
    2.  Click on "Load Temporary Add-on..."
    3.  Navigate to the `dist/` directory, select the `cllama_firefox.xpi` file, and open it.

*   **Chrome / Microsoft Edge:**
    1.  Open Chrome/Edge and type `chrome://extensions` (or `edge://extensions` for Edge) in the address bar.
    2.  Enable "Developer mode" (usually a toggle switch in the top right corner).
    3.  Click on "Load unpacked" (or "Load temporary add-on" for Edge).
    4.  Navigate to the `dist/` directory and select the *unzipped* `cllama_chrome.zip` (you will need to unzip it first) or the `cllama_firefox.xpi` (if you are testing a Firefox build in Chrome/Edge Developer Mode). Alternatively, for Chrome, you can drag and drop the `cllama_chrome.zip` file directly into the extensions page.

## Usage

(Details on how to use the extension will be added soon.)
