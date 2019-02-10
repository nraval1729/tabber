const CREATE_NEW_TAB_NEXT_TO_CURRENT = 'create-new-tab-next-to-current';
const MOVE_CURRENT_TAB_RIGHT = 'move-current-tab-right'
const MOVE_CURRENT_TAB_LEFT = 'move-current-tab-left'
const GROUP_TABS_BY_DOMAIN = 'group-tabs-by-domain'

chrome.commands.onCommand.addListener(function (command) {
    switch (command) {
        case CREATE_NEW_TAB_NEXT_TO_CURRENT:
            createNewTabNextToCurrent();
            break;
        case MOVE_CURRENT_TAB_LEFT:
            moveCurrentTabLeft();
            break;
        case MOVE_CURRENT_TAB_RIGHT:
            moveCurrentTabRight();
            break;
        case GROUP_TABS_BY_DOMAIN:
            groupTabsByDomain();
    }
});

function createNewTabNextToCurrent() {
    chrome.tabs.query(computeTabQueryInfo(), tabs => {
        const currentTab = getCurrentTab(tabs);
        createTab({index: computeNextTabIndex(currentTab, 'right')});
    })
}

function moveCurrentTabLeft() {
    chrome.tabs.query(computeTabQueryInfo(), tabs => moveCurrentTab(tabs, 'left'))
}

function moveCurrentTabRight() {
    chrome.tabs.query(computeTabQueryInfo(), tabs => moveCurrentTab(tabs, 'right'));
}

function groupTabsByDomain() {
    chrome.tabs.query({}, tabs => {
        const hostToTabs = mapHostToTabs(tabs);
        const newTabPositions = Array.from(hostToTabs.values()).flat();

        newTabPositions.forEach((tab, index) => {
            moveTab(tab.id, {index: index})
        });
    })
}

function mapHostToTabs(tabs) {
    const hostToTabs = new Map()

    tabs.forEach(tab => {
        host = getHostFromUrl(tab.url)

        if (hostToTabs.has(host)) {
            const tabsWithThisHost = hostToTabs.get(host);
            tabsWithThisHost.push(tab);

            hostToTabs.set(host, tabsWithThisHost);
        } else {
            hostToTabs.set(host, [tab]);
        }
    });

    // Sort by length of each group in descending order
    return new Map([...hostToTabs.entries()].sort((t1, t2) => t2[1].length - t1[1].length));
}

function moveCurrentTab(tabs, direction) {
    const currentTab = getCurrentTab(tabs);
    const moveProperties = {index: computeNextTabIndex(currentTab, direction)};

    moveTab(currentTab.id, moveProperties);
}

function moveTab(tabId, moveProperties) {
    chrome.tabs.move(tabId, moveProperties);
}

function createTab(createProperties) {
    chrome.tabs.create(createProperties);
}

function getCurrentTab(tabs) {
    return tabs[0];
}

function computeNextTabIndex(currentTab, direction) {
    return direction === 'left' ? currentTab.index - 1 : currentTab.index + 1
}

// https://stackoverflow.com/a/23945027/3170101
function getHostFromUrl(url) {
    let hostname;

    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function computeTabQueryInfo() {
    return {
        active: true,
        currentWindow: true
    }
}
