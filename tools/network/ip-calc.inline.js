const els = {
    ip: document.getElementById('ipInput'),
    mask: document.getElementById('maskInput'),
    resIp: document.getElementById('resIp'),
    resMask: document.getElementById('resMask'),
    resNetwork: document.getElementById('resNetwork'),
    resBroadcast: document.getElementById('resBroadcast'),
    resRange: document.getElementById('resRange'),
    resHosts: document.getElementById('resHosts'),
    resCidr: document.getElementById('resCidr'),
    resClass: document.getElementById('resClass'),
    resType: document.getElementById('resType')
};

// Populate CIDR dropdown
for (let i = 32; i >= 1; i--) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `/${i} (${getNetmask(i)})`;
    if (i === 24) opt.selected = true;
    els.mask.appendChild(opt);
}

function getNetmask(cidr) {
    let mask = [];
    for (let i = 0; i < 4; i++) {
        let n = Math.min(cidr, 8);
        mask.push(256 - Math.pow(2, 8 - n));
        cidr -= n;
    }
    return mask.join('.');
}

function calculate() {
    const ip = els.ip.value;
    const cidr = parseInt(els.mask.value);

    if (!isValidIP(ip)) {
        // simple validation visual
        els.ip.style.borderColor = 'red';
        return;
    } else {
        els.ip.style.borderColor = '';
    }

    const ipParts = ip.split('.').map(Number);
    const maskParts = getNetmask(cidr).split('.').map(Number);

    // Calculate Network
    const netParts = ipParts.map((part, i) => part & maskParts[i]);

    // Calculate Broadcast
    const broadParts = ipParts.map((part, i) => part | (~maskParts[i] & 255));

    // Hosts
    const hosts = Math.pow(2, 32 - cidr) - 2;

    // Range
    const startIP = [...netParts];
    startIP[3]++;

    const endIP = [...broadParts];
    endIP[3]--;

    // Determining Class
    let ipClass = 'Unknown';
    if (ipParts[0] >= 1 && ipParts[0] <= 126) ipClass = 'Class A';
    else if (ipParts[0] >= 128 && ipParts[0] <= 191) ipClass = 'Class B';
    else if (ipParts[0] >= 192 && ipParts[0] <= 223) ipClass = 'Class C';
    else if (ipParts[0] >= 224 && ipParts[0] <= 239) ipClass = 'Class D (Multicast)';
    else if (ipParts[0] >= 240 && ipParts[0] <= 255) ipClass = 'Class E (Experimental)';

    // Type (Private/Public)
    let type = 'Public';
    // Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (ipParts[0] === 10) type = 'Private';
    else if (ipParts[0] === 172 && (ipParts[1] >= 16 && ipParts[1] <= 31)) type = 'Private';
    else if (ipParts[0] === 192 && ipParts[1] === 168) type = 'Private';
    else if (ipParts[0] === 127) type = 'Loopback';

    // Update UI
    els.resIp.textContent = ip;
    els.resMask.textContent = maskParts.join('.');
    els.resNetwork.textContent = netParts.join('.');
    els.resBroadcast.textContent = broadParts.join('.');
    els.resRange.textContent = (hosts > 0) ? `${startIP.join('.')} - ${endIP.join('.')}` : 'N/A';
    els.resHosts.textContent = (hosts > 0) ? hosts.toLocaleString() : '0';
    els.resCidr.textContent = `/${cidr}`;
    els.resClass.textContent = ipClass;
    els.resType.textContent = type;
}

function isValidIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

els.ip.addEventListener('input', calculate);
els.mask.addEventListener('change', calculate);

// Initial calc
calculate();