function main(config) {
  const ICON = "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";
  const RULE = "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/";
  
  const blackRe = /(?<!集)群|邀请|返利|官方|官网|网址|订阅|购买|续费|剩余|到期|过期|流量|备用|邮箱|客服|联系|工单|倒卖|防止|梯子|tg|发布|重置/i;
  const proxies = (config.proxies || []).filter(p => p?.name && !blackRe.test(p.name));

  if (!proxies.length) throw new Error('无有效代理节点');

  const REGIONS = [
    ["美国节点", /美国|美|US|USA|UnitedStates|United States|纽约|NewYork|NYC|JFK|洛杉矶|LosAngeles|LAX|旧金山|SanFrancisco|SFO|圣好塞|SanJose|SJC|西雅图|Seattle|SEA|芝加哥|Chicago|ORD|达拉斯|Dallas|DFW|硅谷|SiliconValley/i, "United_States.png"],
    ["日本节点", /^(?!.*尼日利亚)(临日|日本|东区域|东京都|大阪府|日|JP|JPN|Japan|东京|Tokyo|TYO|NRT|HND|大阪|Osaka|KIX)/i, "Japan.png"],
    ["狮城节点", /新加坡|狮城|SG|SGP|Singapore|SIN/i, "Singapore.png"],
    ["香港节点", /香港|港|HK|HKG|HongKong|Hong Kong/i, "Hong_Kong.png"],
    ["台湾节点", /台湾|台|TW|TWN|Taiwan|台北|Taipei|TPE|新北|NewTaipei/i, "Taiwan.png"],
  ];

  const matchedProxyNames = new Set();
  const regions = REGIONS.map(([name, regex, icon]) => {
    const matched = proxies.filter(p => regex.test(p.name)).map(p => p.name);
    matched.forEach(n => matchedProxyNames.add(n));
    return matched.length ? { name, icon, matched } : null;
  }).filter(Boolean);

  const otherProxies = proxies.map(p => p.name).filter(name => !matchedProxyNames.has(name));
  const hasOther = otherProxies.length > 0;

  const rp = n => ({ url: `${RULE}${n}.list`, path: `./ruleset/${n}.list`, behavior: "classical", interval: 86400, format: "text", type: "http" });
  
  config["rule-providers"] = {
    LocalAreaNetwork: rp("LocalAreaNetwork"),
    UnBan: rp("UnBan"),
    BanAD: rp("BanAD"),
    BanProgramAD: rp("BanProgramAD"),
    ProxyGFWlist: rp("ProxyGFWlist"),
    ChinaDomain: rp("ChinaDomain"),
    AdBlock: { type: "http", format: "text", behavior: "classical", interval: 86400, url: "https://raw.githubusercontent.com/fmz200/wool_scripts/main/Loon/rule/rejectAd.list", path: "./ruleset/AdBlock.list" }
  };

  const regionNames = regions.map(r => r.name);
  
  config["proxy-groups"] = [
    { name: "节点选择", icon: `${ICON}Proxy.png`, type: "select", proxies: [...regionNames, ...(hasOther ? ["其他节点"] : []), "DIRECT"] },
    ...regions.map(r => ({ name: r.name, icon: `${ICON}${r.icon}`, type: "select", proxies: r.matched })),
    hasOther ? { name: "其他节点", icon: `${ICON}Available.png`, type: "select", proxies: otherProxies } : null,
    { name: "GLOBAL", icon: `${ICON}Global.png`, type: "select", proxies: ["节点选择", ...regionNames, ...(hasOther ? ["其他节点"] : []), "DIRECT"] }
  ].filter(Boolean);

  const validTargets = new Set(["DIRECT", "REJECT", "REJECT-DROP", "PASS", ...config["proxy-groups"].map(g => g.name), ...proxies.map(p => p.name)]);

  const custom = (config.rules || [])
    .filter(r => !r.startsWith("MATCH,"))
    .map(r => {
      const parts = r.split(',');
      if (parts.length >= 3) {
        const target = parts[2].trim();
        if (!validTargets.has(target)) {
          parts[2] = "节点选择";
          return parts.join(',');
        }
      }
      return r;
    });

  config.rules = [
    "DOMAIN-SUFFIX,googleapis.cn,节点选择",
    "DOMAIN-KEYWORD,googleusercontent,节点选择",
    "DOMAIN-KEYWORD,xn--ngstr-lra8j,节点选择",
    "RULE-SET,LocalAreaNetwork,DIRECT",
    "RULE-SET,UnBan,DIRECT",
    "RULE-SET,AdBlock,REJECT",
    "RULE-SET,BanAD,REJECT",
    "RULE-SET,BanProgramAD,REJECT",
    ...custom,
    "RULE-SET,ProxyGFWlist,节点选择",
    "RULE-SET,ChinaDomain,DIRECT",
    "GEOIP,CN,DIRECT",
    "MATCH,节点选择"
  ];

  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["find-process-mode"] = "strict";

  return config;
}
