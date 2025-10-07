// Get current tab info
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Get domain from URL
function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return null;
    }
}

// Count cookies for current site
async function countCookies() {
    const tab = await getCurrentTab();
    const domain = getDomain(tab.url);
    
    if (!domain) {
        document.getElementById('cookieCount').textContent = 'Cannot count cookies on this page';
        return;
    }
    
    const cookies = await chrome.cookies.getAll({ domain: domain });
    document.getElementById('cookieCount').textContent = `Found ${cookies.length} cookie(s) on this site`;
}

// Show status message
function showStatus(message, isSuccess = true) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = isSuccess ? 'success' : 'error';
    statusEl.style.display = 'block';
    
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// Clear cookies for current site
async function clearCurrentSiteCookies() {
    try {
        const tab = await getCurrentTab();
        const domain = getDomain(tab.url);
        
        if (!domain) {
            showStatus('Cannot clear cookies on this page', false);
            return;
        }
        
        // Get all cookies for this domain
        const cookies = await chrome.cookies.getAll({ domain: domain });
        
        // Also get cookies for the domain with a dot prefix
        const cookiesWithDot = await chrome.cookies.getAll({ domain: '.' + domain });
        
        const allCookies = [...cookies, ...cookiesWithDot];
        
        // Remove duplicates
        const uniqueCookies = allCookies.filter((cookie, index, self) =>
            index === self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain)
    );
    
    // Delete each cookie
    for (const cookie of uniqueCookies) {
        const protocol = cookie.secure ? 'https:' : 'http:';
        const url = `${protocol}//${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({
            url: url,
            name: cookie.name
        });
    }
    
    showStatus(`Cleared ${uniqueCookies.length} cookie(s)!`);
    
    // Refresh the count
    setTimeout(countCookies, 500);
    
} catch (error) {
    console.error('Error clearing cookies:', error);
    showStatus('Error clearing cookies', false);
}
}

// Clear all cookies from all sites
async function clearAllCookies() {
    try {
        const allCookies = await chrome.cookies.getAll({});
        
        for (const cookie of allCookies) {
            const protocol = cookie.secure ? 'https:' : 'http:';
            const url = `${protocol}//${cookie.domain}${cookie.path}`;
            await chrome.cookies.remove({
                url: url,
                name: cookie.name
            });
        }
        
        showStatus(`Cleared ${allCookies.length} cookie(s) from all sites!`);
        
        // Refresh the count
        setTimeout(countCookies, 500);
        
    } catch (error) {
        console.error('Error clearing all cookies:', error);
        showStatus('Error clearing cookies', false);
    }
}

// Event listeners
document.getElementById('clearCurrentSite').addEventListener('click', clearCurrentSiteCookies);
document.getElementById('clearAllSites').addEventListener('click', clearAllCookies);

// Initialize
countCookies();
