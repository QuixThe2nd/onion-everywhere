'use strict';

var browser = typeof browser !== "undefined" ? browser : chrome;
var enableRedirect = true;

function validate_onion_host(hostname) {
    if (!hostname.endsWith("onion")) {
        throw new URIError("not an onion host:" + hostname);
    }

    hostname = hostname.substring(0, hostname.length - ".onion".length);

    var i = hostname.lastIndexOf(".");
    if (i != -1) {
        hostname = hostname.substring(i + 1);
    }

    if (hostname.length == 56) {
        // Work on assumption it is a v3 address
    } else if (hostname.length == 16) {
        // Work on assumption it is a v2 address
    } else {
        throw new URIError("unknown onion address type");
    }
}

function tor_redirect(details) {
    // If disabled, don't care to redirect
    if (!enableRedirect) return;

    var onion_location_header = details.responseHeaders.find(function (header) {
        return header['name'].toLowerCase() == 'onion-location';
    });
    if (onion_location_header === void 0) return;

    // TODO: this may throw an error on an invalid URL... should that be caught?
    var onion_location = new URL(onion_location_header.value);

    // The Onion-Location value must be a valid URL with http: or https: protocol and a .onion hostname.
    if (onion_location.protocol !== "http:" && onion_location.protocol !== "https:") {
        console.log("Invalid Onion-Location uri: unexpected scheme:", onion_location.protocol);
        return;
    }

    try {
        validate_onion_host(onion_location.hostname);
    } catch (e) {
        console.log("Invalid Onion-Location uri:" + e.message);
        return;
    }

    // The webpage defining the Onion-Location header must be served over HTTPS.
    var old_location = new URL(details.url);
    if (old_location.protocol !== "https:") {
        console.log("Ignoring Onion-Location: not served over HTTPS");
        return;
    }

    // The webpage defining the Onion-Location header must not be an onion site.
    if (old_location.hostname.endsWith("onion")) {
        console.log("Ignoring Onion-Location uri: already an onion host:", old_location.hostname);
        return;
    }

    console.log("Redirecting to Onion-Location: ", onion_location.href);
    return {
        redirectUrl: onion_location.href,
    };
}

browser.webRequest.onHeadersReceived.addListener(
    tor_redirect,
    { urls: ['<all_urls>'] },
    ['blocking', 'responseHeaders']
);

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'ONION_LOCATION_FOUND') {
        const details = {
            url: sender.tab.url,
            responseHeaders: [{ name: 'Onion-Location', value: message.onionLocation }]
        };
        const redirect = tor_redirect(details);
        if (redirect) {
            browser.tabs.update(sender.tab.id, { url: redirect.redirectUrl });
        }
    }
});

// Make sure correct icon and title (toolbar button tooltip) is shown
function updateIcon() {
    browser.browserAction.setIcon({
        path: enableRedirect ? {
          19: "icons/icon-enabled-19.png",
          38: "icons/icon-enabled-38.png"
        } : {
          19: "icons/icon-disabled-19.png",
          38: "icons/icon-disabled-38.png"
        }
    });
    browser.browserAction.setTitle({
        // Screen readers can see the title
        title: enableRedirect ? 'Onion Everywhere\n(Enabled - Click to toggle)' : 'Onion Everywhere\n(Disabled - Click to toggle)'
    });
}
// Show proper icon and title on load
updateIcon();

// On toolbar button click
browser.browserAction.onClicked.addListener(function (tab) {
    // Toggle
    enableRedirect = ! enableRedirect;
    updateIcon();
});
