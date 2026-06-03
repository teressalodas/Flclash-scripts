function main(config) {
  const ICON = "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";
  const RULE = "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/";

  const ratioRe = /(?:\[(\d+(?:\.\d+)?)\s*[xX×]\]|(\d+(?:\.\d+)?)\s*[xX×倍]|[xX×倍]\s*(\d+(?:\.\d+)?))/i;
  const blackRe = /(?<!集)群|邀请|返利|官方|官网|网址|订阅|购买|续费|剩余|到期|过期|流量|备用|邮箱|客服|联系|工单|倒卖|防止|梯子|tg|发布|重置/i;
  const flagMap = { '🇸🇬': 'SG', '🇺🇸': 'US', '🇯🇵': 'JP', '🇭🇰': 'HK', '🇹🇼': 'TW' };

  const myManualRules = [
    "DOMAIN-SUFFIX,cn,DIRECT",
    "DOMAIN-SUFFIX,qianwen,DIRECT",
    "DOMAIN-SUFFIX,jianguoyun.com,DIRECT",
    "GEOSITE,category-ads-all,REJECT",
  ];

  const allProxies = config.proxies || [];
  const proxies = allProxies.filter(p => {
    if (!p?.name || blackRe.test(p.name)) return false;
    const m = p.name.match(ratioRe);
    return !(m && parseFloat(m[1] || m[2] || m[3]) > 3);
  });

  if (!proxies.length && !allProxies.length) return config;

  const norm = name => {
    let s = name.trim().replace(/\s+/g, '').replace(/[【】[\]（）()]/g, '');
    for (const [flag, code] of Object.entries(flagMap)) s = s.replaceAll(flag, code);
    return s;
  };

  const REGIONS = [
    ["狮城节点", "新加坡|狮城|SG|SGP|Singapore|SIN", "Singapore.png"],
    ["美国节点", "美国|美|US|USA|UnitedStates|United States|纽约|NewYork|NYC|JFK|洛杉矶|LosAngeles|LAX|旧金山|SanFrancisco|SFO|圣好塞|SanJose|SJC|西雅图|Seattle|SEA|芝加哥|Chicago|ORD|达拉斯|Dallas|DFW|硅谷|SiliconValley", "United_States.png"],
    ["日本节点", "日本|日|JP|JPN|Japan|东京|Tokyo|TYO|NRT|HND|大阪|Osaka|KIX", "Japan.png"],
    ["香港节点", "香港|港|HK|HKG|HongKong|Hong Kong", "Hong_Kong.png"],
    ["台湾节点", "台湾|台|TW|TWN|Taiwan|台北|Taipei|TPE|新北|NewTaipei", "Taiwan.png"],
  ];

  const regions = REGIONS.map(([name, pat, icon]) => {
    const re = new RegExp(pat.split('|').map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
    const matched = proxies.filter(p => re.test(norm(p.name))).map(p => p.name);
    return matched.length ? { name, icon, matched } : null;
  }).filter(Boolean);

  const regionNames = regions.map(r => r.name);
  const rp = (name) => ({ url: `${RULE}${name}.list`, path: `./ruleset/${name}.list`, behavior: "classical", interval: 86400, format: "text", type: "http" });

  const groups = [
    { name: "节点选择", icon: `${ICON}Proxy.png`, type: "select", proxies: [...regionNames, "手动切换"] },
    ...regions.map(r => ({ name: r.name, icon: `${ICON}${r.icon}`, type: "url-test", proxies: r.matched, interval: 300, tolerance: 50 })),
    { name: "手动切换", icon: `${ICON}Available.png`, "include-all": true, type: "select" },
    { name: "GLOBAL", icon: `${ICON}Global.png`, type: "select", proxies: ["节点选择", ...regionNames, "手动切换", "DIRECT"] },
  ];

  const providers = { 
    LocalAreaNetwork: rp("LocalAreaNetwork"), 
    UnBan: rp("UnBan"),
    BanAD: rp("BanAD"),
    BanProgramAD: rp("BanProgramAD"),
    ProxyGFWlist: rp("ProxyGFWlist"),
    ChinaDomain: rp("ChinaDomain") 
  };

  const valid = new Set(["DIRECT", "REJECT", "REJECT-DROP", "PASS", ...groups.map(g => g.name), ...allProxies.map(p => p.name)]);
  const providerKeys = new Set(Object.keys(providers));

  const mapTarget = t => {
    const target = t.trim();
    if (/直连|DIRECT|地理|LAN/i.test(target)) return "DIRECT";
    if (/拦截|广告|REJECT|DROP/i.test(target)) return "REJECT";
    return "节点选择";
  };

  const custom = (config.rules || [])
    .filter(r => !r.startsWith("MATCH,") && (!r.startsWith("RULE-SET,") || providerKeys.has(r.split(',')[1])))
    .map(r => {
      if (/^(AND|OR|NOT|SUB-RULE),/i.test(r = r.trim())) return r; 
      const p = r.split(',');
      if (p.length >= 3) {
        if (!valid.has(p[2].trim())) p[2] = mapTarget(p[2].trim());
      }
      return p.join(',');
    });

  config["proxy-groups"] = groups;
  config["rule-providers"] = providers;
  config["rules"] = [
    ...myManualRules,
    "RULE-SET,LocalAreaNetwork,DIRECT",
    "RULE-SET,UnBan,DIRECT",
    "RULE-SET,BanAD,REJECT",
    "RULE-SET,BanProgramAD,REJECT",
    ...custom,
    "RULE-SET,ProxyGFWlist,节点选择",
    "RULE-SET,ChinaDomain,DIRECT",
    "GEOIP,CN,DIRECT",
    "MATCH,节点选择",
  ];
  
  config.proxies = allProxies;
  return config;
}
