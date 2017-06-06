// first run
chrome.runtime.onInstalled.addListener(function (details) {
	chrome.contextMenus.create({
		"title": "Incognito, ergo sum",
		"contexts": ["page"],
		"id": "openincog"
	});
});

// for toolbar button
chrome.browserAction.onClicked.addListener(function (tab) {
	checkForIncognitoPermissions(tab);
});

function onClickHandler(info, tab) {
	checkForIncognitoPermissions(tab);
}

// for context menu action
chrome.contextMenus.onClicked.addListener(onClickHandler);

// extension only works if allowed to work in incognito
function checkForIncognitoPermissions(tab) {

	// if not in icognito, check if extension allowed to work in incognito
	chrome.extension.isAllowedIncognitoAccess(function (isAllowedInIncognito) {
		if (isAllowedInIncognito)
			changeContext(tab, !tab.incognito);
		else
			// redirect user to extensions page, so he/she can allow it to work in incognito
			chrome.tabs.create({
				url: 'chrome://extensions/?id=' + chrome.runtime.id
			});
	});
}

// changeContext means open in incognito if in regular window, and vice-versa
// incognito parameter holds information if tab is already in incognito window
function changeContext(tab, incognito) {
	// get list of all open Chrome windows instances
	// extension needs to be allowed in incognito for window reusability
	chrome.windows.getAll({
		"populate": false
	}, function (windows) {
		handleOpenedWindows(windows, tab, incognito);
	});
}

// handler for getAll function of extension API, that gets all current Chrome instances windows
function handleOpenedWindows(windows, tab, incognito) {
	var numWindows = windows.length;

	//traverse all opened windows and get windowId of last open incognito/regular window
	var windowId;
	for (var i = 0; i < numWindows; i++) {
		if (windows[i].incognito === incognito) {
			var windowId = windows[i].id;
		}
	}

	var url = tab.url;

	// If no needed windows are opened, create new one, otherwise reuse opened one
	if (windowId !== undefined) {
		openInExistingWindow(windowId, url, incognito);
	} else {
		openInNewWindow(url, incognito);
	}

	// close current tab and delete it from history if changing from normal to incognito window
	closeAndDeleteFromHistory(url, tab.id);
}

// reuse existing incognito or regular window for cognition change
function openInExistingWindow(windowId, url, incognito) {
	chrome.tabs.create({
		"windowId": windowId,
		"url": url,
		"active": true
	}, function () {
		if (incognito) {
			grantCookiePermission(url);
		}
	});
}

function openInNewWindow(url, incognito) {
	var state = localStorage.getItem('state');
	if (!state) state = "maximized";

	chrome.windows.create({
		"url": url,
		"incognito": incognito,
		"focused": true,
		"state": state
	}, function () {
		if (incognito) {
			grantCookiePermission(url);
		}
	});
}

// close current tab and delete from history if coming from regular window to incognito mode
function closeAndDeleteFromHistory(url, id) {
	var option = localStorage.getItem('option');
	if (!option) option = "close";

	if (option === "close") {
		chrome.tabs.remove(id);
		chrome.history.deleteUrl({
			"url": url
		});
	}
}

// grants cookie permissions only for incognito session, when opening tab from normal window
function grantCookiePermission(url) {
	var cookies = localStorage.getItem('cookies');
	if (cookies === "block") return;

	chrome.contentSettings.cookies.get({
		"primaryUrl": url,
		"incognito": false
	}, function (cookie) {

		if (cookie.setting === "block") {
			// rgular expression for extraction current URL's domain
			var extractHostname = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');

			// grant cookie permissions for extracted hostname
			// only applied to current incognito session, no tab reload needed
			chrome.contentSettings.cookies.set({
				"primaryPattern": url.match(extractHostname)[0] + '/*',
				"setting": "allow",
				"scope": "incognito_session_only"
			});
		}
	});
}
