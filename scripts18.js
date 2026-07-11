function main(config) {
  const blackRe = /(?<!集)群|邀请|返利|官方|官网|网址|订阅|购买|续费|剩余|到期|过期|流量|备用|邮箱|客服|联系|工单|倒卖|防止|梯子|tg|发布|重置/i;
  const proxies = (config.proxies || []).filter(p => p?.name && !blackRe.test(p.name));
  if (!proxies.length) throw new Error('无有效代理节点');

  const REGIONS = [
    ["美国节点", (n) => /美国|纽约|NewYork|NYC|JFK|洛杉矶|LosAngeles|LAX|旧金山|SanFrancisco|SFO|圣何塞|SanJose|SJC|西雅图|Seattle|SEA|芝加哥|Chicago|ORD|达拉斯|Dallas|DFW|硅谷|SiliconValley|\bUS\b|\bUSA\b|United\s?States/i.test(n), "United_States.png"],
    ["日本节点", (n) => !/尼日利亚/i.test(n) && /日本|东京都|大阪府|东京|Tokyo|TYO|NRT|HND|大阪|Osaka|KIX|\bJP\b|\bJPN\b|\bJapan\b/i.test(n), "Japan.png"],
    ["狮城节点", (n) => /新加坡|狮城|Singapore|\bSG\b|\bSGP\b|\bSIN\b/i.test(n), "Singapore.png"],
    ["香港节点", (n) => /香港|HongKong|Hong Kong|\bHK\b|\bHKG\b/i.test(n), "Hong_Kong.png"],
    ["台湾节点", (n) => /台湾|台北|Taipei|TPE|新北|NewTaipei|\bTW\b|\bTWN\b|\bTaiwan\b/i.test(n), "Taiwan.png"],
  ];

  const matchedNames = new Set();
  const regions = REGIONS.map(([name, matchFn, icon]) => {
    const matched = proxies
      .filter(p => !matchedNames.has(p.name) && matchFn(p.name))
      .map(p => p.name);
    matched.forEach(n => matchedNames.add(n));
    return matched.length ? { name, icon, proxies: matched } : null;
  }).filter(Boolean);

  const otherProxies = proxies.map(p => p.name).filter(n => !matchedNames.has(n));
  const hasOther = otherProxies.length > 0;
  const regionNames = regions.map(r => r.name);
  const ICON_BASE_URL = "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";

  const autoSpeedConfig = { 
    type: "select", 
    interval: 300, 
    lazy: false 
  };

  const allGroups = [
    ...regions,
    ...(hasOther ? [{ name: "其他节点", icon: "Available.png", proxies: otherProxies }] : [])
  ];

  config["proxy-groups"] = [
    { name: "节点选择", icon: `${ICON_BASE_URL}Proxy.png`, type: "select", proxies: [...regionNames, ...(hasOther ? ["其他节点"] : [])] },
    ...allGroups.map(g => ({
      name: g.name,
      icon: `${ICON_BASE_URL}${g.icon}`,
      ...autoSpeedConfig,
      proxies: g.proxies
    })),
    { name: "GLOBAL", icon: `${ICON_BASE_URL}Global.png`, type: "select", proxies: ["节点选择", ...regionNames, ...(hasOther ? ["其他节点"] : [])] },
  ];

  const validTargets = new Set([
    "DIRECT", "REJECT", "REJECT-DROP", "PASS",
    ...config["proxy-groups"].map(g => g.name),
    ...proxies.map(p => p.name),
  ]);

  config.rules = (config.rules || []).map(r => {
    if (/^(AND|OR|NOT|SUB-RULE),/i.test(r)) return r;
    const parts = r.split(',');
    if (parts.length < 2) return r;

    const isMatch = parts[0].trim().toUpperCase() === "MATCH";
    const targetIdx = isMatch ? 1 : 2;

    if (parts.length > targetIdx && !validTargets.has(parts[targetIdx].trim())) {
      parts[targetIdx] = "节点选择";
      return parts.join(',');
    }
    return r;
  });

  return config;
}
